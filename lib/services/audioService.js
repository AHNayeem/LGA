import { cueHash, exerciseAudioTargets, exerciseMediaIds, requiredExerciseCues } from "@/lib/audio/cues";
import { manifestEntrySchema } from "@/lib/audio/manifest";
import { resolveAudioSource, speechFallbackAllowed } from "@/lib/media/audioSource";
import * as mediaRepo from "@/lib/repositories/mediaAssetRepository";

// Connects audio cues in content with generated assets. Content never stores media ids
// for TTS audio; the asset is found by the cue hash at read time (one indexed query per
// page), so generating audio never modifies (or un-approves) content.
//
// Recorded curriculum audio is attached by id (`mediaId` on a stimulus or item audio,
// see lib/audio/cues.js). Resolution order, everywhere (learner pages, admin status,
// publish checks):
//   1. the attached asset, if it is an active native/licensed upload
//   2. generated TTS for the cue(s)
//   3. development only: browser speech; otherwise "unavailable"

export const MEDIA_STATUS = Object.freeze({ active: "active", archived: "archived" });

export function isUsableCurriculumMedia(asset) {
  return Boolean(asset) && asset.kind === "audio" && mediaRepo.CURRICULUM_UPLOAD_SOURCES.includes(asset.source) && asset.status !== MEDIA_STATUS.archived;
}

async function usableMediaSet(mediaIds) {
  if (mediaIds.length === 0) return new Set();
  const assets = await mediaRepo.findCurriculumUploadsByIds(mediaIds);
  return new Set(assets.filter(isUsableCurriculumMedia).map((a) => String(a._id)));
}

// `mediaIds`: recordings attached to the content on the page (exerciseMediaIds).
export async function createAudioResolver(cues, { mediaIds = [] } = {}) {
  const hashes = cues.map(cueHash);
  const [assets, usable] = await Promise.all([mediaRepo.findTtsAssetsByHashes(hashes), usableMediaSet(mediaIds)]);
  const byHash = new Map(assets.map((a) => [a.ttsHash, String(a._id)]));
  const allowSpeechFallback = speechFallbackAllowed();
  return (cue) => {
    if (cue?.mediaId && usable.has(String(cue.mediaId))) return resolveAudioSource({ mediaId: String(cue.mediaId) });
    // A bare { mediaId } (a whole-stimulus recording) has no cue to fall back to.
    if (!cue?.text) return null;
    return resolveAudioSource({ mediaId: byHash.get(cueHash(cue)) ?? null, text: cue.text, lang: "de-DE", allowSpeechFallback });
  };
}

export async function createExerciseAudioResolver(exercises, cues) {
  return createAudioResolver(cues, { mediaIds: exercises.flatMap(exerciseMediaIds) });
}

export async function findMissingAudio(cues) {
  const assets = await mediaRepo.findTtsAssetsByHashes(cues.map(cueHash));
  const have = new Set(assets.map((a) => a.ttsHash));
  return cues.filter((c) => !have.has(cueHash(c)));
}

// Required listening audio with no playable source: neither a usable attached recording
// nor generated TTS. Publishing is blocked while this is non-empty.
export async function missingRequiredAudio(exercise) {
  const usable = await usableMediaSet(exerciseMediaIds(exercise));
  return findMissingAudio(requiredExerciseCues(exercise, { hasMedia: (id) => usable.has(String(id)) }));
}

// Admin view of an attached asset: what an editor needs to recognise and preview it.
// Storage details (driver, key) are never included.
export function adminMediaSummary(asset) {
  return {
    id: String(asset._id),
    title: asset.title ?? asset.transcript?.slice(0, 80) ?? null,
    source: asset.source,
    status: asset.status ?? MEDIA_STATUS.active,
    mime: asset.mime,
    durationSec: asset.durationSec ?? null,
    usable: isUsableCurriculumMedia(asset),
  };
}

// Per exercise, per audio target: attached recording, generated TTS, and which one plays.
//   source: "native" (attached recording) | "tts" (all cues generated) | "missing"
// Batched: one TTS lookup and one media lookup for all given exercises. Read-only; it
// never generates audio.
export async function exerciseAudioStatuses(exercises) {
  const targetsBy = exercises.map(exerciseAudioTargets);
  const allCues = targetsBy.flat().flatMap((t) => t.cues);
  const allMedia = targetsBy.flat().map((t) => t.mediaId).filter(Boolean);
  const [tts, media] = await Promise.all([
    mediaRepo.findTtsAssetsByHashes(allCues.map(cueHash)),
    mediaRepo.findCurriculumUploadsByIds(allMedia),
  ]);
  const haveTts = new Set(tts.map((a) => a.ttsHash));
  const mediaById = new Map(media.map((a) => [String(a._id), a]));

  return targetsBy.map((targets) => {
    const out = targets.map(({ target, mediaId, cues }) => {
      const asset = mediaId ? mediaById.get(mediaId) : null;
      const native = asset ? adminMediaSummary(asset) : null;
      const available = cues.filter((c) => haveTts.has(cueHash(c))).length;
      const ttsReady = cues.length > 0 && available === cues.length;
      const source = native?.usable ? "native" : ttsReady ? "tts" : "missing";
      return {
        target,
        mediaId,
        // An id that no longer points at a curriculum upload (deleted) is reported, not hidden.
        native: native ?? (mediaId ? { id: mediaId, title: null, usable: false, status: "missing" } : null),
        tts: { total: cues.length, available },
        source,
      };
    });
    const sources = new Set(out.map((t) => t.source));
    return {
      targets: out,
      source: out.length === 0 ? "none" : sources.has("missing") ? "missing" : sources.size === 1 ? [...sources][0] : "mixed",
      missing: out.filter((t) => t.source === "missing").reduce((n, t) => n + (t.tts.total - t.tts.available), 0),
    };
  });
}

export async function exerciseAudioStatus(exercise) {
  const [status] = await exerciseAudioStatuses([exercise]);
  return status;
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
