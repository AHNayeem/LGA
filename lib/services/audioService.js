import { cueHash } from "@/lib/audio/cues";
import { manifestEntrySchema } from "@/lib/audio/manifest";
import { resolveAudioSource, speechFallbackAllowed } from "@/lib/media/audioSource";
import * as mediaRepo from "@/lib/repositories/mediaAssetRepository";

// Connects audio cues in content with generated assets. Content never stores media ids
// for TTS audio; the asset is found by the cue hash at read time (one indexed query per
// page), so generating audio never modifies (or un-approves) content.

export async function createAudioResolver(cues) {
  const hashes = cues.map(cueHash);
  const assets = await mediaRepo.findTtsAssetsByHashes(hashes);
  const byHash = new Map(assets.map((a) => [a.ttsHash, String(a._id)]));
  const allowSpeechFallback = speechFallbackAllowed();
  return (cue) =>
    resolveAudioSource({ mediaId: byHash.get(cueHash(cue)) ?? null, text: cue.text, lang: "de-DE", allowSpeechFallback });
}

export async function findMissingAudio(cues) {
  const assets = await mediaRepo.findTtsAssetsByHashes(cues.map(cueHash));
  const have = new Set(assets.map((a) => a.ttsHash));
  return cues.filter((c) => !have.has(cueHash(c)));
}

// System operation (seed/generation scripts, E2E setup): registers generated audio in
// mediaAssets. Not exposed to any request handler.
export async function registerTtsAssets(entries) {
  let registered = 0;
  for (const raw of entries) {
    const e = manifestEntrySchema.parse(raw);
    await mediaRepo.upsertTtsAsset({
      ttsHash: e.hash,
      kind: "audio",
      mime: e.mime,
      storage: { driver: e.driver, key: e.key },
      size: e.size ?? null,
      source: "tts",
      visibility: "curriculum",
      ownerId: null,
      language: e.lang,
      voice: e.providerVoice ?? e.voiceRole,
      transcript: e.text,
      durationSec: e.durationSec ?? null,
      tts: { provider: e.provider, voiceRole: e.voiceRole, rate: e.rate, speakingRate: e.speakingRate ?? null, generatedAt: e.generatedAt ?? null },
      createdBy: null,
    });
    registered++;
  }
  return { registered };
}
