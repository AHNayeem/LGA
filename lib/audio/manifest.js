import { z } from "zod";

// One generated clip in content/audio/manifest.json. Shared by the seed registration
// (audioService) and the offline verifier (lib/audio/verify.js).
export const manifestEntrySchema = z.object({
  hash: z.string().regex(/^[0-9a-f]{32}$/),
  driver: z.enum(["static", "gridfs", "memory"]),
  key: z.string().min(1).max(300),
  mime: z.enum(["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm"]),
  size: z.number().int().nonnegative().optional(),
  text: z.string().max(1000),
  voiceRole: z.string().max(40),
  rate: z.string().max(20),
  lang: z.string().max(10),
  provider: z.string().max(40),
  providerVoice: z.string().max(120).nullable().optional(),
  speakingRate: z.number().positive().max(4).optional(),
  durationSec: z.number().nonnegative().optional(),
  generatedAt: z.string().optional(),
});

// Production curriculum audio: static MP3 files at public/media/tts/<hash>.mp3.
export const expectedStaticKey = (hash) => `tts/${hash}.mp3`;
