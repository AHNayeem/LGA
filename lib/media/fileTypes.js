// Upload validation by signature ("magic bytes"), not by the client-supplied MIME type.
// `accepts` lists the declared types browsers use for each format (MediaRecorder reports
// e.g. "audio/webm;codecs=opus" in Chrome and "audio/mp4" in Safari). `exts` are the file
// name extensions an uploaded file of that format may carry (curriculum uploads).
const AUDIO_TYPES = [
  {
    mime: "audio/webm",
    ext: "webm",
    exts: ["webm", "weba"],
    accepts: ["audio/webm", "video/webm"],
    test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
  { mime: "audio/ogg", ext: "ogg", exts: ["ogg", "oga", "opus"], accepts: ["audio/ogg"], test: (b) => ascii(b, 0, 4) === "OggS" },
  {
    mime: "audio/wav",
    ext: "wav",
    exts: ["wav"],
    accepts: ["audio/wav", "audio/x-wav", "audio/wave"],
    test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WAVE",
  },
  {
    mime: "audio/mpeg",
    ext: "mp3",
    exts: ["mp3"],
    accepts: ["audio/mpeg", "audio/mp3"],
    test: (b) => ascii(b, 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0),
  },
  {
    mime: "audio/mp4",
    ext: "m4a",
    exts: ["m4a", "mp4"],
    accepts: ["audio/mp4", "audio/x-m4a", "audio/aac", "video/mp4"],
    test: (b) => ascii(b, 4, 8) === "ftyp",
  },
];

function ascii(bytes, start, end) {
  return String.fromCharCode(...bytes.slice(start, end));
}

export function detectAudioType(bytes) {
  if (!bytes || bytes.byteLength < 12) return null;
  const head = new Uint8Array(bytes.buffer ?? bytes, bytes.byteOffset ?? 0, Math.min(16, bytes.byteLength));
  return AUDIO_TYPES.find((t) => t.test(head)) ?? null;
}

// An empty declared type is allowed (some browsers omit it); a conflicting one is not.
export function declaredTypeMatches(declared, detected) {
  if (!declared) return true;
  const base = declared.split(";")[0].trim().toLowerCase();
  return detected.accepts.includes(base);
}

// The file name's extension must name the detected format ("clip.mp3" that is really a
// WAV is rejected). A name without an extension is rejected too.
export function extensionMatches(filename, detected) {
  const m = /\.([a-z0-9]{1,5})$/i.exec(String(filename ?? "").trim());
  return Boolean(m) && detected.exts.includes(m[1].toLowerCase());
}
