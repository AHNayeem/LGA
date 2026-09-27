// Google Cloud Text-to-Speech over REST (no SDK dependency). Used ONLY by the offline
// generation script, never at request time. The API key is read from the script's
// environment (GOOGLE_TTS_API_KEY) and sent as a header, so it never appears in URLs/logs.
//
// Voice names are configurable because provider catalogues change; verify them against
// the provider's current voice list before a production generation run.

const ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";

export const DEFAULT_GOOGLE_VOICES = Object.freeze({
  female: "de-DE-Wavenet-F",
  male: "de-DE-Wavenet-B",
  female2: "de-DE-Wavenet-C",
  male2: "de-DE-Wavenet-D",
});

const RATES = { slow: 0.85, normal: 1.0 };

export function createGoogleTtsProvider({ apiKey, voices = {}, fetchImpl = globalThis.fetch } = {}) {
  if (!apiKey) throw new Error("GOOGLE_TTS_API_KEY is required for the google TTS provider.");
  const voiceMap = { ...DEFAULT_GOOGLE_VOICES, ...voices };

  return {
    name: "google",
    async synthesize(cue) {
      const voice = voiceMap[cue.voice] ?? voiceMap.female;
      const res = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
        body: JSON.stringify({
          input: { text: cue.text },
          voice: { languageCode: cue.lang ?? "de-DE", name: voice },
          audioConfig: { audioEncoding: "MP3", speakingRate: RATES[cue.rate] ?? 1.0 },
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Google TTS request failed (${res.status}): ${detail.slice(0, 200)}`);
      }
      const json = await res.json();
      if (!json.audioContent) throw new Error("Google TTS returned no audio.");
      return { bytes: new Uint8Array(Buffer.from(json.audioContent, "base64")), mime: "audio/mpeg", ext: "mp3", voice };
    },
  };
}
