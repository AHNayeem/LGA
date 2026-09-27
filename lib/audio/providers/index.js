import { createGoogleTtsProvider } from "@/lib/audio/providers/google";
import { createFakeTtsProvider } from "@/lib/audio/providers/fake";

// TTS provider contract (offline generation only):
//   name: string
//   synthesize(cue: { text, voice, rate, lang }) -> { bytes: Uint8Array, mime, ext, voice }
//
// Adding a provider (Azure, ElevenLabs, a local engine…) = one file + one case here.
export const TTS_PROVIDERS = Object.freeze(["google", "fake"]);

export function createTtsProvider(name, env = process.env) {
  switch (name) {
    case "google":
      return createGoogleTtsProvider({
        apiKey: env.GOOGLE_TTS_API_KEY,
        voices: Object.fromEntries(
          ["female", "male", "female2", "male2"]
            .map((role) => [role, env[`TTS_VOICE_${role.toUpperCase()}`]])
            .filter(([, v]) => v),
        ),
      });
    case "fake":
      return createFakeTtsProvider();
    default:
      throw new Error(`Unknown TTS provider "${name}". Use one of: ${TTS_PROVIDERS.join(", ")}.`);
  }
}
