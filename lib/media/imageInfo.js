// Image validation by signature ("magic bytes") and header structure, not by the
// client-supplied MIME type. Same shape as the audio types in fileTypes.js: `accepts`
// lists the declared types browsers send for the format, `exts` the file name extensions
// it may carry. SVG is never accepted: it is a document that can carry script.
const IMAGE_TYPES = [
  {
    mime: "image/png",
    ext: "png",
    exts: ["png"],
    accepts: ["image/png"],
    test: (b) => b[0] === 0x89 && ascii(b, 1, 4) === "PNG" && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  { mime: "image/jpeg", ext: "jpg", exts: ["jpg", "jpeg"], accepts: ["image/jpeg", "image/jpg", "image/pjpeg"], test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/webp", ext: "webp", exts: ["webp"], accepts: ["image/webp"], test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  { mime: "image/gif", ext: "gif", exts: ["gif"], accepts: ["image/gif"], test: (b) => ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a" },
];

export const IMAGE_MIME_TYPES = Object.freeze(IMAGE_TYPES.map((t) => t.mime));

function ascii(bytes, start, end) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function view(bytes) {
  return new Uint8Array(bytes.buffer ?? bytes, bytes.byteOffset ?? 0, bytes.byteLength);
}

export function detectImageType(bytes) {
  if (!bytes || bytes.byteLength < 12) return null;
  const head = view(bytes).subarray(0, 16);
  return IMAGE_TYPES.find((t) => t.test(head)) ?? null;
}

const u16be = (b, i) => (b[i] << 8) | b[i + 1];
const u16le = (b, i) => b[i] | (b[i + 1] << 8);
const u24le = (b, i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const u32be = (b, i) => ((b[i] << 24) >>> 0) + ((b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]);

function png(b) {
  // IHDR must be the first chunk; the file must end with IEND (not truncated).
  if (b.length < 45 || ascii(b, 12, 16) !== "IHDR") return null;
  if (ascii(b, b.length - 8, b.length - 4) !== "IEND") return null;
  return { width: u32be(b, 16), height: u32be(b, 20) };
}

function gif(b) {
  if (b.length < 14 || b[b.length - 1] !== 0x3b) return null; // trailer
  return { width: u16le(b, 6), height: u16le(b, 8) };
}

function webp(b) {
  if (b.length < 30) return null;
  const chunk = ascii(b, 12, 16);
  if (chunk === "VP8X") return { width: 1 + u24le(b, 24), height: 1 + u24le(b, 27) };
  if (chunk === "VP8 ") {
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    if (b[20] !== 0x2f) return null;
    return { width: 1 + (b[21] | ((b[22] & 0x3f) << 8)), height: 1 + ((b[22] >> 6) | (b[23] << 2) | ((b[24] & 0x0f) << 10)) };
  }
  return null;
}

// Frame headers that carry the dimensions (SOF0–SOF15 except DHT, JPG and DAC).
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function jpeg(b) {
  // Must end with an EOI marker (allowing a little trailing padding), so a truncated
  // upload is rejected.
  const tail = b.subarray(Math.max(0, b.length - 32));
  let eoi = false;
  for (let i = 0; i < tail.length - 1; i++) if (tail[i] === 0xff && tail[i + 1] === 0xd9) eoi = true;
  if (!eoi) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i++; // fill byte
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      i += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) return null; // image data before any frame header
    const len = u16be(b, i + 2);
    if (len < 2) return null;
    if (SOF.has(marker)) return { width: u16be(b, i + 7), height: u16be(b, i + 5) };
    i += 2 + len;
  }
  return null;
}

const READERS = { "image/png": png, "image/gif": gif, "image/webp": webp, "image/jpeg": jpeg };

// Dimensions from the file's own header, or null when the structure is not what the
// signature claims (damaged, truncated or disguised).
export function readImageDimensions(bytes, detected) {
  const read = READERS[detected?.mime];
  if (!read) return null;
  const dims = read(view(bytes));
  if (!dims || !Number.isInteger(dims.width) || !Number.isInteger(dims.height) || dims.width < 1 || dims.height < 1) return null;
  return dims;
}

// Hard limits against decompression bombs (a tiny file that decodes to a huge bitmap).
export const MAX_IMAGE_SIDE = 8000;
export const MAX_IMAGE_PIXELS = 40_000_000;
