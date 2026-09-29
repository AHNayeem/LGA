// Builds a structurally valid MP3 (MPEG-2 Layer III, 24 kHz, 32 kbps – what Google TTS
// returns for MP3) with silent frames: 96 bytes and 24 ms per frame.
export function makeMp3({ seconds = 1.2, id3 = false, marker = 0 } = {}) {
  const frames = Math.max(2, Math.round(seconds / 0.024));
  const frame = new Uint8Array(96);
  frame.set([0xff, 0xf3, 0x44, 0xc4]);
  frame[4] = marker; // lets tests make otherwise identical files differ
  const tag = id3 ? new Uint8Array([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, 10, ...new Array(10).fill(0)]) : new Uint8Array(0);
  const out = new Uint8Array(tag.length + frames * frame.length);
  out.set(tag, 0);
  for (let i = 0; i < frames; i++) out.set(frame, tag.length + i * frame.length);
  return out;
}
