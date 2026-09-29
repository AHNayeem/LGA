import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getEnv } from "@/lib/config/env";
import { getStorage } from "@/lib/storage";
import { serialize } from "@/lib/db/serialize";
import { detectAudioType, declaredTypeMatches } from "@/lib/media/fileTypes";
import { ForbiddenError, NotFoundError, PayloadTooLargeError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { RECORDING_MIME_TYPES } from "@/lib/media/recording";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { parseOrThrow, text, toObjectId } from "@/lib/validation/common";
import * as mediaRepo from "@/lib/repositories/mediaAssetRepository";

// Media assets are referenced by id everywhere. The asset records where the bytes live
// (driver + key), how they were produced, and who may read them.
//
//   source:     tts | native | licensed | learner
//   visibility: curriculum (any signed-in learner) | private (owner + media managers)

export const MEDIA_SOURCES = Object.freeze(["tts", "native", "licensed", "learner"]);

const staticAssetSchema = z.object({
  kind: z.literal("audio"),
  key: z.string().min(1).max(300),
  mime: z.enum(["audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4", "audio/webm"]),
  durationSec: z.number().positive().max(3600).optional(),
  source: z.enum(["tts", "native", "licensed"]),
  voice: text(120).optional(), // e.g. TTS voice name, or speaker id for recordings
  language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).default("de-DE"),
  license: text(300).optional(),
  transcript: text(5000).optional(),
});

// Registers a pre-generated/curated file that ships in public/media (static driver).
export async function registerStaticAudio(actor, input) {
  if (!hasPermission(actor, PERMISSIONS.mediaManage)) throw new ForbiddenError();
  const data = parseOrThrow(staticAssetSchema, input);
  const storage = getStorage("static");
  storage.publicUrl(data.key); // validates key
  const now = new Date();
  const asset = await mediaRepo.insertMediaAsset({
    kind: data.kind,
    mime: data.mime,
    storage: { driver: "static", key: data.key },
    durationSec: data.durationSec ?? null,
    source: data.source,
    voice: data.voice ?? null,
    language: data.language,
    license: data.license ?? null,
    transcript: data.transcript ?? null,
    visibility: "curriculum",
    ownerId: null,
    size: null,
    createdBy: toObjectId(actor.id),
    createdAt: now,
  });
  return serialize(asset);
}

// What the browser may know about a stored asset. Internal storage details (driver,
// key, GridFS ids, owner) never leave the server.
export function publicMediaView(asset) {
  return {
    id: String(asset._id),
    kind: asset.kind,
    mime: asset.mime,
    size: asset.size ?? null,
    durationSec: asset.recording?.durationSec ?? asset.durationSec ?? null,
    createdAt: asset.createdAt instanceof Date ? asset.createdAt.toISOString() : (asset.createdAt ?? null),
  };
}

// Validates a learner upload (size, file signature, declared type) and returns the
// detected type. Learner recordings accept only the containers MediaRecorder produces.
export function validateLearnerAudio(bytes, declaredType) {
  const max = getEnv().MEDIA_MAX_UPLOAD_BYTES;
  if (!bytes || bytes.byteLength === 0) throw new ValidationError("The recording is empty.");
  if (bytes.byteLength > max) throw new PayloadTooLargeError(`The recording is too large (max ${formatMb(max)} MB).`);
  const detected = detectAudioType(bytes);
  if (!detected || !RECORDING_MIME_TYPES.includes(detected.mime) || !declaredTypeMatches(declaredType, detected)) {
    throw new ValidationError("Unsupported audio format.");
  }
  return detected;
}

function formatMb(bytes) {
  return Math.round((bytes / 1048576) * 10) / 10;
}

// Learner recordings (speaking practice). Bytes are written first, then the metadata;
// if the metadata write fails, the bytes are removed again so nothing is left behind
// that no document points to. `recording` is the speaking-target subdocument (see
// recordingService). Returns the internal document (callers expose publicMediaView).
// Entry points enforce the upload rate limit before calling this.
export async function storeLearnerRecording(actor, { bytes, declaredType, recording = null }) {
  if (!hasPermission(actor, PERMISSIONS.mediaUpload)) throw new ForbiddenError();
  const detected = validateLearnerAudio(bytes, declaredType);

  const storage = getStorage();
  const key = `recordings/${actor.id}/${randomUUID()}.${detected.ext}`;
  const stored = await storage.put({ key, body: bytes, contentType: detected.mime });
  try {
    return await mediaRepo.insertMediaAsset({
      kind: "audio",
      mime: detected.mime,
      storage: { driver: stored.driver, key: stored.key },
      size: stored.size,
      source: "learner",
      visibility: "private",
      ownerId: toObjectId(actor.id),
      createdBy: toObjectId(actor.id),
      createdAt: new Date(),
      ...(recording ? { recording } : {}),
    });
  } catch (err) {
    await storage.delete(stored.key).catch((cleanupErr) => logger.error("media_orphan_cleanup_failed", { err: cleanupErr }));
    throw err;
  }
}

export async function uploadLearnerRecording(actor, input) {
  if (!hasPermission(actor, PERMISSIONS.mediaUpload)) throw new ForbiddenError();
  await enforceRateLimit(RATE_LIMITS.uploadByUser, actor.id);
  return publicMediaView(await storeLearnerRecording(actor, input));
}

// Removes the metadata first (access is revoked immediately), then the bytes.
export async function destroyMediaAsset(asset) {
  await mediaRepo.deleteMediaAsset(asset._id);
  const storage = getStorage(asset.storage.driver);
  if (!storage.readOnly) {
    await storage.delete(asset.storage.key).catch((err) => logger.error("media_bytes_delete_failed", { id: String(asset._id), err }));
  }
}

export function canReadMedia(actor, asset) {
  if (!actor || !asset) return false;
  if (asset.visibility === "curriculum") return true;
  if (hasPermission(actor, PERMISSIONS.mediaManage)) return true;
  return asset.ownerId != null && String(asset.ownerId) === actor.id;
}

// Returns either a redirect URL (static assets) or a body to stream.
export async function openMedia(actor, id) {
  const asset = await mediaRepo.findMediaAssetById(id);
  // Same response for "missing" and "not yours" so ids can't be probed.
  if (!asset || !canReadMedia(actor, asset)) throw new NotFoundError();
  const storage = getStorage(asset.storage.driver);
  const url = storage.publicUrl(asset.storage.key);
  if (url) return { redirect: url, asset };
  const file = await storage.get(asset.storage.key);
  if (!file) throw new NotFoundError();
  return { file, asset };
}

export async function deleteMedia(actor, id) {
  const asset = await mediaRepo.findMediaAssetById(id);
  if (!asset || !canReadMedia(actor, asset)) throw new NotFoundError();
  const isOwner = asset.ownerId != null && String(asset.ownerId) === actor.id;
  if (!isOwner && !hasPermission(actor, PERMISSIONS.mediaManage)) throw new ForbiddenError();
  await destroyMediaAsset(asset);
  return true;
}
