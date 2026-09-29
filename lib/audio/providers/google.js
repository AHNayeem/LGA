// Google Cloud Text-to-Speech over REST (no SDK dependency). Used ONLY by the offline
// generation scripts, never at request time. The API key is read from the script's
// environment (GOOGLE_TTS_API_KEY) and sent as a header, so it never appears in URLs/logs.
//
// API contract (checked against the official docs, 2026-09-27):
//   POST https://texttospeech.googleapis.com/v1/text:synthesize
//     { input: { text }, voice: { languageCode, name }, audioConfig: { audioEncoding, speakingRate } }
//     -> { audioContent: base64 }
//   GET  https://texttospeech.googleapis.com/v1/voices?languageCode=de-DE
//     -> { voices: [{ name, languageCodes[], ssmlGender, naturalSampleRateHertz }] }
//
// Default voices are from Google's published de-DE list. The earlier defaults
// de-DE-Wavenet-B/-D are no longer listed. Chirp3-HD voices are excluded: per the docs they
// don't support speakingRate, and every "slow" cue depends on it. `voices.list` is still
// called before any generation (verifyVoices), so a renamed or removed voice fails fast.

const BASE = "https://texttospeech.googleapis.com/v1";

export const DEFAULT_GOOGLE_VOICES = Object.freeze({
  female: "de-DE-Neural2-F",
  male: "de-DE-Neural2-E",
  female2: "de-DE-Neural2-C",
  male2: "de-DE-Wavenet-E", // Neural2 has only one German male voice
});

export const GOOGLE_AUDIO_ENCODING = "MP3";
export const SPEAKING_RATES = Object.freeze({ slow: 0.85, normal: 1.0 });

const ROLE_GENDER = { female: "FEMALE", female2: "FEMALE", male: "MALE", male2: "MALE" };

function describeFailure(status, detail) {
  // The response body can echo request metadata; keep it short and never include headers.
  return `Google TTS request failed (${status}): ${String(detail).replace(/\s+/g, " ").slice(0, 300)}`;
}

export function createGoogleTtsProvider({ apiKey, voices = {}, fetchImpl = globalThis.fetch } = {}) {
  if (!apiKey) throw new Error("GOOGLE_TTS_API_KEY is required for the google TTS provider.");
  const voiceMap = { ...DEFAULT_GOOGLE_VOICES, ...voices };
  const headers = { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey };

  return {
    name: "google",
    voiceMap,
    settings: { audioEncoding: GOOGLE_AUDIO_ENCODING, speakingRates: SPEAKING_RATES, voices: voiceMap },

    async listVoices(languageCode = "de-DE") {
      const res = await fetchImpl(`${BASE}/voices?languageCode=${encodeURIComponent(languageCode)}`, { headers });
      if (!res.ok) throw new Error(describeFailure(res.status, await res.text().catch(() => "")));
      const json = await res.json();
      return Array.isArray(json.voices) ? json.voices : [];
    },

    // Checks every configured voice against the live catalogue. Returns { ok, problems[], voices }.
    async verifyVoices(languageCode = "de-DE") {
      const available = new Map((await this.listVoices(languageCode)).map((v) => [v.name, v]));
      const problems = [];
      for (const [role, name] of Object.entries(voiceMap)) {
        const v = available.get(name);
        if (!v) problems.push(`${role}: voice "${name}" is not offered for ${languageCode}.`);
        else if (!v.languageCodes?.includes(languageCode)) problems.push(`${role}: "${name}" does not list ${languageCode}.`);
        else if (ROLE_GENDER[role] && v.ssmlGender !== ROLE_GENDER[role]) problems.push(`${role}: "${name}" is ${v.ssmlGender}, expected ${ROLE_GENDER[role]}.`);
        if (/Chirp3-HD/i.test(name)) problems.push(`${role}: "${name}" is a Chirp3-HD voice, which does not support speakingRate ("slow" cues).`);
      }
      return { ok: problems.length === 0, problems, voices: Object.fromEntries(Object.entries(voiceMap).map(([r, n]) => [r, available.get(n) ?? null])) };
    },

    async synthesize(cue) {
      const voice = voiceMap[cue.voice] ?? voiceMap.female;
      const speakingRate = SPEAKING_RATES[cue.rate] ?? 1.0;
      const res = await fetchImpl(`${BASE}/text:synthesize`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          input: { text: cue.text },
          voice: { languageCode: cue.lang ?? "de-DE", name: voice },
          audioConfig: { audioEncoding: GOOGLE_AUDIO_ENCODING, speakingRate },
        }),
      });
      if (!res.ok) throw new Error(describeFailure(res.status, await res.text().catch(() => "")));
      const json = await res.json();
      if (!json.audioContent) throw new Error("Google TTS returned no audio.");
      return { bytes: new Uint8Array(Buffer.from(json.audioContent, "base64")), mime: "audio/mpeg", ext: "mp3", voice, speakingRate };
    },
  };
}
