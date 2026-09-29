// Speaking-recording constants shared by server and client (pure module, no imports).
//
// The client records with MediaRecorder and picks the first container the browser
// supports. The server never trusts this choice: it validates the uploaded bytes by
// signature (lib/media/fileTypes.js).

export const RECORDER_MIME_CANDIDATES = Object.freeze([
  "audio/webm;codecs=opus", // Chromium, Firefox
  "audio/webm",
  "audio/mp4", // Safari
  "audio/ogg;codecs=opus", // older Firefox
]);

// Containers accepted for learner recordings (subset of lib/media/fileTypes.js).
export const RECORDING_MIME_TYPES = Object.freeze(["audio/webm", "audio/mp4", "audio/ogg"]);

export const RECORDING_STATUS = Object.freeze({ pending: "pending", attached: "attached" });

// Uploaded but never submitted with an attempt: removed after this long.
export const STALE_RECORDING_MS = 24 * 60 * 60_000;

// Tolerance for the client-reported duration (timers and encoders round differently).
export const DURATION_TOLERANCE_SEC = 2;

export function pickRecorderMimeType(isTypeSupported) {
  if (typeof isTypeSupported !== "function") return null;
  return RECORDER_MIME_CANDIDATES.find((t) => isTypeSupported(t)) ?? null;
}
