// Minimal MPEG audio (MP3) frame parser, used to verify generated TTS files without a
// media library: it walks the frame headers, so a truncated, empty or non-MP3 file fails.
// Returns { ok, durationSec, frames, sampleRate, bitrateKbps, error }.

const BITRATES = {
  // [versionGroup][layer] -> kbps by index (0 = free, 15 = bad)
  v1: {
    1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  },
  v2: {
    1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  },
};
const SAMPLE_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
const LAYERS = { 3: 1, 2: 2, 1: 3 }; // header bits -> layer number

export function parseFrameHeader(b, i) {
  if (i + 4 > b.length || b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) return null;
  const versionBits = (b[i + 1] >> 3) & 0x03; // 0 = 2.5, 1 = reserved, 2 = 2, 3 = 1
  const layer = LAYERS[(b[i + 1] >> 1) & 0x03];
  const bitrateIndex = (b[i + 2] >> 4) & 0x0f;
  const srIndex = (b[i + 2] >> 2) & 0x03;
  const padding = (b[i + 2] >> 1) & 0x01;
  if (versionBits === 1 || !layer || bitrateIndex === 0 || bitrateIndex === 15 || srIndex === 3) return null;
  const group = versionBits === 3 ? "v1" : "v2";
  const kbps = BITRATES[group][layer][bitrateIndex];
  const sampleRate = SAMPLE_RATES[versionBits][srIndex];
  const bitrate = kbps * 1000;
  let length;
  let samples;
  if (layer === 1) {
    length = (Math.floor((12 * bitrate) / sampleRate) + padding) * 4;
    samples = 384;
  } else if (layer === 2 || group === "v1") {
    length = Math.floor((144 * bitrate) / sampleRate) + padding;
    samples = 1152;
  } else {
    length = Math.floor((72 * bitrate) / sampleRate) + padding;
    samples = 576;
  }
  return { length, samples, sampleRate, kbps };
}

function skipId3v2(b) {
  if (b.length >= 10 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) {
    const size = ((b[6] & 0x7f) << 21) | ((b[7] & 0x7f) << 14) | ((b[8] & 0x7f) << 7) | (b[9] & 0x7f);
    const footer = b[5] & 0x10 ? 10 : 0;
    return 10 + size + footer;
  }
  return 0;
}

export function parseMp3(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const fail = (error) => ({ ok: false, durationSec: 0, frames: 0, sampleRate: null, bitrateKbps: null, error });
  if (b.length === 0) return fail("empty file");

  let i = skipId3v2(b);
  if (i >= b.length) return fail("ID3 tag without audio");
  // Allow a little junk before the first frame, but not much.
  const searchLimit = Math.min(b.length, i + 2048);
  while (i < searchLimit && !parseFrameHeader(b, i)) i++;
  if (i >= searchLimit) return fail("no MPEG audio frame found");

  const end = b.length >= 128 && b[b.length - 128] === 0x54 && b[b.length - 127] === 0x41 && b[b.length - 126] === 0x47 ? b.length - 128 : b.length;
  const audioStart = i;
  let frames = 0;
  let samples = 0;
  let sampleRate = null;
  let bits = 0;
  while (i < end) {
    const h = parseFrameHeader(b, i);
    if (!h || h.length < 4) break;
    if (sampleRate && h.sampleRate !== sampleRate) return fail("sample rate changes mid-stream");
    if (i + h.length > end) {
      // A truncated last frame: count what's there only if it's a tiny tail.
      break;
    }
    sampleRate = h.sampleRate;
    frames++;
    samples += h.samples;
    bits += h.kbps;
    i += h.length;
  }
  if (frames < 2) return fail("fewer than two complete MPEG frames");
  const unparsed = end - i;
  if (unparsed > Math.max(1024, (end - audioStart) * 0.05)) return fail(`${unparsed} bytes of trailing data are not MPEG frames (truncated or corrupt)`);
  return { ok: true, durationSec: samples / sampleRate, frames, sampleRate, bitrateKbps: Math.round(bits / frames), error: null };
}
