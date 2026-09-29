import { PayloadTooLargeError, ValidationError } from "@/lib/errors";

// Reads a request body into memory with a hard byte limit. The declared Content-Length
// is checked first (cheap rejection), then the stream is counted while reading, so a
// missing or false Content-Length (chunked uploads) can't get past the limit either.
export async function readBodyWithLimit(request, maxBytes, { tooLargeMessage } = {}) {
  const declared = request.headers.get("content-length");
  if (declared != null) {
    const n = Number(declared);
    if (!Number.isFinite(n) || n < 0) throw new ValidationError("Invalid Content-Length.");
    if (n > maxBytes) throw new PayloadTooLargeError(tooLargeMessage);
  }
  if (!request.body) return new Uint8Array(0);

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new PayloadTooLargeError(tooLargeMessage);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}
