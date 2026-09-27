// Decides how the UI should play a piece of German audio. Pure function so both
// server and client code can use it.
//
// Production: pre-generated or recorded assets only (never live TTS per request).
// Development: if no asset exists yet, fall back to the browser's SpeechSynthesis so
// authors can preview content. The result says which one, so the UI can label it.

export function resolveAudioSource({ mediaId = null, text = "", lang = "de-DE", allowSpeechFallback = false }) {
  if (mediaId) return { type: "asset", url: `/api/media/${mediaId}`, lang };
  if (allowSpeechFallback && text) return { type: "speech-synthesis", text, lang };
  return { type: "unavailable" };
}

export function speechFallbackAllowed() {
  return process.env.NODE_ENV !== "production";
}
