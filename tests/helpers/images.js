import { deflateSync } from "node:zlib";

// Small image files for tests. PNG and GIF are real, decodable images (the E2E test
// renders them in a browser); JPEG and WebP only carry the headers the server parses.

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u32(n) {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function chunk(type, data) {
  const body = [...new TextEncoder().encode(type), ...data];
  return [...u32(data.length), ...body, ...u32(crc32(body))];
}

// A solid-colour RGB PNG of the given size. `headerOnly` stops after IHDR (a truncated
// upload); `claim` writes different dimensions into IHDR than the pixel data has.
export function makePng({ width = 4, height = 3, rgb = [200, 40, 40], headerOnly = false, claim = null } = {}) {
  const w = claim?.width ?? width;
  const h = claim?.height ?? height;
  const ihdr = chunk("IHDR", [...u32(w), ...u32(h), 8, 2, 0, 0, 0]);
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (headerOnly) return new Uint8Array([...signature, ...ihdr]);
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter: none
    for (let x = 0; x < width; x++) raw.push(...rgb);
  }
  const idat = chunk("IDAT", [...deflateSync(Buffer.from(raw))]);
  return new Uint8Array([...signature, ...ihdr, ...idat, ...chunk("IEND", [])]);
}

// A real 1×1 GIF.
export function makeGif() {
  return new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
  ]);
}

// SOI, an APP0 segment, a baseline frame header (SOF0) and EOI.
export function makeJpeg({ width = 640, height = 480, sof = true } = {}) {
  const app0 = [0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00];
  const sof0 = [0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 0x03, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1];
  const dqt = [0xff, 0xdb, 0x00, 0x04, 0x00, 0x00];
  return new Uint8Array([0xff, 0xd8, ...app0, ...(sof ? sof0 : dqt), ...new Array(16).fill(0), 0xff, 0xd9]);
}

// RIFF/WEBP container with a VP8X (extended) header.
export function makeWebp({ width = 320, height = 200 } = {}) {
  const le24 = (n) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff];
  const vp8x = [...new TextEncoder().encode("VP8X"), 10, 0, 0, 0, 0, 0, 0, 0, ...le24(width - 1), ...le24(height - 1)];
  const body = [...new TextEncoder().encode("WEBP"), ...vp8x];
  const size = body.length;
  return new Uint8Array([...new TextEncoder().encode("RIFF"), size & 0xff, (size >> 8) & 0xff, 0, 0, ...body]);
}

export const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
