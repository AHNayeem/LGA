import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getEnv } from "@/lib/config/env";
import { getStorage } from "@/lib/storage";
import { serialize } from "@/lib/db/serialize";
import { detectAudioType, declaredTypeMatches, extensionMatches } from "@/lib/media/fileTypes";
import { detectImageType, MAX_IMAGE_PIXELS, MAX_IMAGE_SIDE, readImageDimensions } from "@/lib/media/imageInfo";
import { parseMp3 } from "@/lib/audio/mp3";
import { ConflictError, ForbiddenError, NotFoundError, PayloadTooLargeError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { RECORDING_MIME_TYPES } from "@/lib/media/recording";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { parseOrThrow, text, toObjectId } from "@/lib/validation/common";
import * as mediaRepo from "@/lib/repositories/mediaAssetRepository";
import { countContentUsingMedia, findContentUsingMedia, LEARNER_VISIBLE, referencedMediaIds } from "@/lib/repositories/contentRepository";
import { adminMediaSummary, MEDIA_STATUS } from "@/lib/services/audioService";
import { adminImageSummary } from "@/lib/services/imageService";
import { exerciseAudioTargets } from "@/lib/audio/cues";
import { contentImageRefs } from "@/lib/media/imageRefs";
import { contentLabel } from "@/lib/content/adminSections";

// Media assets are referenced by id everywhere. The asset records where the bytes live
// (driver + key), how they were produced, and who may read them.
//
//   source:     tts | native | licensed | learner
//   visibility: curriculum  any signed-in user
//               private     owner + media managers
//               linked      media managers; learners only while approved, published
//                           content attaches it (admin uploads of curriculum media)
//
// Three kinds of audio, never mixed up:
//   learner recordings  source "learner", private, ownerId, `recording` subdocument
//   generated TTS       source "tts", curriculum, `ttsHash`; audio:generate + seed
//   curriculum uploads  source "native" | "licensed", linked, status active | archived;
//                       managed in /admin/media, attached to exercises by id
// Curriculum images are curriculum uploads too (kind "image", same sources, visibility
// and lifecycle), attached to words, exercise stimuli and intro blocks
// (lib/media/imageRefs.js).

export const MEDIA_SOURCES = Object.freeze(["tts", "native", "licensed", "learner"]);
export const MEDIA_VISIBILITY = Object.freeze({ curriculum: "curriculum", private: "private", linked: "linked" });
const { CURRICULUM_UPLOAD_SOURCES } = mediaRepo;
export { CURRICULUM_UPLOAD_SOURCES };

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

// Learners reach a curriculum upload only through content they can see: an approved,
// published exercise, word or lesson that attaches it. Drafts, unpublished or archived
// content and archived media don't count.
async function usedByLiveContent(asset) {
  if (asset.status === MEDIA_STATUS.archived) return false;
  return (await countContentUsingMedia(asset._id, LEARNER_VISIBLE)) > 0;
}

export async function canReadMedia(actor, asset) {
  if (!actor || !asset) return false;
  if (asset.visibility === MEDIA_VISIBILITY.curriculum) return true;
  if (hasPermission(actor, PERMISSIONS.mediaManage)) return true;
  if (asset.visibility === MEDIA_VISIBILITY.linked) return usedByLiveContent(asset);
  return asset.ownerId != null && String(asset.ownerId) === actor.id;
}

// Returns either a redirect URL (static assets) or a body to stream.
export async function openMedia(actor, id) {
  const asset = await mediaRepo.findMediaAssetById(id);
  // Same response for "missing" and "not yours" so ids can't be probed.
  if (!asset || !(await canReadMedia(actor, asset))) throw new NotFoundError();
  const storage = getStorage(asset.storage.driver);
  const url = storage.publicUrl(asset.storage.key);
  if (url) return { redirect: url, asset };
  const file = await storage.get(asset.storage.key);
  if (!file) throw new NotFoundError();
  return { file, asset };
}

export async function deleteMedia(actor, id) {
  const asset = await mediaRepo.findMediaAssetById(id);
  if (!asset || !(await canReadMedia(actor, asset))) throw new NotFoundError();
  // Curriculum uploads have their own rules (archive first, no references).
  if (CURRICULUM_UPLOAD_SOURCES.includes(asset.source)) return deleteCurriculumMedia(actor, id);
  const isOwner = asset.ownerId != null && String(asset.ownerId) === actor.id;
  if (!isOwner && !hasPermission(actor, PERMISSIONS.mediaManage)) throw new ForbiddenError();
  await destroyMediaAsset(asset);
  return true;
}

// --- Curriculum media (admin uploads) ----------------------------------------------------
// Recorded or licensed audio an admin uploads in /admin/media and attaches to listening
// exercises by id, and images attached to words, exercise stimuli and intro blocks. Every
// entry point requires media:manage; learners read these files only through the "linked"
// rule above.

function assertManage(actor) {
  if (!hasPermission(actor, PERMISSIONS.mediaManage)) throw new ForbiddenError();
}

export const CURRICULUM_MIME_TYPES = Object.freeze(["audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav", "audio/webm"]);
export const CURRICULUM_IMAGE_MIME_TYPES = Object.freeze(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const MEDIA_KINDS = Object.freeze(["audio", "image"]);

const languageTag = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, "Use a language tag such as de-DE");
const blankToUndefined = (v) => (v === "" || v == null ? undefined : v);
const optionalText = (max) => z.preprocess(blankToUndefined, text(max).optional());

export const curriculumMediaMetaSchema = z
  .object({
    title: text(200).pipe(z.string().min(1, "A title is required")),
    source: z.enum(CURRICULUM_UPLOAD_SOURCES).default("native"),
    language: z.preprocess(blankToUndefined, languageTag.default("de-DE")),
    voice: optionalText(120), // speaker, e.g. "Sprecherin A"
    license: optionalText(300),
    transcript: optionalText(5000),
    alt: optionalText(250), // images: default alt text, prefilled when attaching
  })
  .superRefine((m, ctx) => {
    if (m.source === "licensed" && !m.license) ctx.addIssue({ code: "custom", path: ["license"], message: "Licensed audio needs its license or source" });
  });

// Display only: the client's file name is never used for storage.
function safeOriginalName(name) {
  const base = String(name ?? "").split(/[\\/]/).pop() ?? "";
  return base.replace(/[\u0000-\u001f\u007f]/g, "").normalize("NFC").trim().slice(0, 200) || null;
}

// Size, then signature (magic bytes), then the declared type and the file name's
// extension against what was detected. MP3s must also parse frame by frame. The client
// MIME type and file name are only ever compared, never trusted.
export function validateCurriculumAudio(bytes, { declaredType = "", filename = "" } = {}) {
  const max = getEnv().CURRICULUM_MEDIA_MAX_BYTES;
  if (!bytes || bytes.byteLength === 0) throw new ValidationError("The file is empty.");
  if (bytes.byteLength > max) throw new PayloadTooLargeError(`The file is too large (max ${formatMb(max)} MB).`);
  const detected = detectAudioType(bytes);
  if (!detected || !CURRICULUM_MIME_TYPES.includes(detected.mime)) {
    throw new ValidationError("Unsupported file. Upload MP3, M4A, Ogg, WAV or WebM audio.");
  }
  if (!declaredTypeMatches(declaredType, detected)) throw new ValidationError("The file type does not match its contents.");
  if (!extensionMatches(filename, detected)) {
    throw new ValidationError(`The file name must end in .${detected.exts.join(" or .")} for this ${detected.ext.toUpperCase()} file.`);
  }
  let durationSec = null;
  if (detected.mime === "audio/mpeg") {
    const mp3 = parseMp3(bytes);
    if (!mp3.ok) throw new ValidationError("The MP3 file is damaged or incomplete.");
    durationSec = Math.round(mp3.durationSec * 10) / 10;
  }
  return { ...detected, durationSec };
}

const UNSUPPORTED = "Unsupported file. Upload MP3, M4A, Ogg, WAV or WebM audio, or a PNG, JPEG, WebP or GIF image.";

// Images: size, signature, declared type and extension (as for audio), then the header
// structure and dimensions, with limits against decompression bombs. SVG and anything
// else unknown is rejected.
export function validateCurriculumImage(bytes, { declaredType = "", filename = "" } = {}) {
  const max = getEnv().CURRICULUM_IMAGE_MAX_BYTES;
  if (!bytes || bytes.byteLength === 0) throw new ValidationError("The file is empty.");
  if (bytes.byteLength > max) throw new PayloadTooLargeError(`The image is too large (max ${formatMb(max)} MB).`);
  const detected = detectImageType(bytes);
  if (!detected || !CURRICULUM_IMAGE_MIME_TYPES.includes(detected.mime)) throw new ValidationError(UNSUPPORTED);
  if (!declaredTypeMatches(declaredType, detected)) throw new ValidationError("The file type does not match its contents.");
  if (!extensionMatches(filename, detected)) {
    throw new ValidationError(`The file name must end in .${detected.exts.join(" or .")} for this ${detected.ext.toUpperCase()} file.`);
  }
  const dims = readImageDimensions(bytes, detected);
  if (!dims) throw new ValidationError(`The ${detected.ext.toUpperCase()} image is damaged or incomplete.`);
  if (dims.width > MAX_IMAGE_SIDE || dims.height > MAX_IMAGE_SIDE || dims.width * dims.height > MAX_IMAGE_PIXELS) {
    throw new ValidationError(`The image is too large (${dims.width}×${dims.height} px). Use at most ${MAX_IMAGE_SIDE} px per side.`);
  }
  return { ...detected, kind: "image", ...dims };
}

// Upload entry point: the bytes decide whether this is an image or audio, never the client.
export function validateCurriculumUpload(bytes, options = {}) {
  if (bytes && bytes.byteLength > 0 && detectImageType(bytes)) return validateCurriculumImage(bytes, options);
  try {
    return { ...validateCurriculumAudio(bytes, options), kind: "audio" };
  } catch (err) {
    // Neither a known image nor known audio: name both families in the message.
    if (err instanceof ValidationError && /^Unsupported file/.test(err.message)) throw new ValidationError(UNSUPPORTED);
    throw err;
  }
}

// Measured in the browser when the server can't (non-MP3); display metadata only.
const clientDuration = z.coerce.number().positive().max(3600).optional().catch(undefined);

export function adminMediaView(asset) {
  const isUpload = CURRICULUM_UPLOAD_SOURCES.includes(asset.source);
  return serialize({
    id: asset._id,
    kind: asset.kind,
    mime: asset.mime,
    size: asset.size ?? null,
    durationSec: asset.durationSec ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    alt: asset.alt ?? null,
    source: asset.source,
    visibility: asset.visibility,
    status: isUpload ? (asset.status ?? MEDIA_STATUS.active) : null,
    title: asset.title ?? null,
    originalName: asset.originalName ?? null,
    language: asset.language ?? null,
    voice: asset.voice ?? null,
    license: asset.license ?? null,
    transcript: asset.transcript ?? null,
    tts: asset.tts ? { provider: asset.tts.provider, voiceRole: asset.tts.voiceRole, rate: asset.tts.rate } : null,
    editable: isUpload,
    createdAt: asset.createdAt ?? null,
    updatedAt: asset.updatedAt ?? null,
  });
}

// New bytes always get a fresh server-generated key.
async function storeCurriculumBytes(bytes, detected) {
  return getStorage().put({ key: `curriculum/${randomUUID()}.${detected.ext}`, body: bytes, contentType: detected.mime });
}

async function removeBytes(stored) {
  const storage = getStorage(stored.driver);
  if (storage.readOnly) return;
  await storage.delete(stored.key).catch((err) => logger.error("media_bytes_delete_failed", { key: stored.key, err }));
}

// `readBytes` is called only after the permission, metadata and rate-limit checks, so an
// unauthorised caller never makes the server read a body.
export async function uploadCurriculumMedia(actor, { filename, declaredType, durationSec, meta, readBytes }) {
  assertManage(actor);
  const data = parseOrThrow(curriculumMediaMetaSchema, meta ?? {});
  await enforceRateLimit(RATE_LIMITS.curriculumUploadByUser, actor.id);
  const bytes = await readBytes();
  const detected = validateCurriculumUpload(bytes, { declaredType, filename });
  const stored = await storeCurriculumBytes(bytes, detected);
  const now = new Date();
  const byKind =
    detected.kind === "image"
      ? { durationSec: null, width: detected.width, height: detected.height, alt: data.alt ?? null, language: null, voice: null, transcript: null }
      : {
          durationSec: detected.durationSec ?? clientDuration.parse(durationSec) ?? null,
          language: data.language,
          voice: data.voice ?? null,
          transcript: data.transcript ?? null,
        };
  try {
    const asset = await mediaRepo.insertMediaAsset({
      kind: detected.kind,
      mime: detected.mime,
      storage: { driver: stored.driver, key: stored.key },
      size: stored.size,
      source: data.source,
      visibility: MEDIA_VISIBILITY.linked,
      status: MEDIA_STATUS.active,
      ownerId: null,
      title: data.title,
      originalName: safeOriginalName(filename),
      license: data.license ?? null,
      ...byKind,
      createdBy: toObjectId(actor.id),
      createdAt: now,
      updatedBy: toObjectId(actor.id),
      updatedAt: now,
    });
    logger.info("curriculum_media_uploaded", { id: String(asset._id), kind: detected.kind, mime: detected.mime, size: stored.size, actor: actor.id });
    return adminMediaView(asset);
  } catch (err) {
    await removeBytes(stored);
    throw err;
  }
}

async function findUploadOrThrow(id) {
  const asset = await mediaRepo.findCurriculumUploadById(id);
  if (!asset) throw new NotFoundError();
  return asset;
}

// Reviewed or approved content was checked with this exact file; swapping it under them
// would change what learners hear or see without a new review.
const REVIEWED = { reviewStatus: { $ne: "draft" } };

const kindNoun = (asset) => (asset.kind === "image" ? "image" : "audio");

// Replaces the file of an upload (same id, so every attachment picks it up), while only
// drafts use it. The new file must be of the same kind (an image stays an image). The
// new bytes are stored first, the document is switched only if nobody replaced the file
// meanwhile, and then the old bytes are removed.
export async function replaceCurriculumMediaFile(actor, id, { filename, declaredType, durationSec, readBytes }) {
  assertManage(actor);
  const asset = await findUploadOrThrow(id);
  const noun = kindNoun(asset);
  if (asset.status === MEDIA_STATUS.archived) throw new ConflictError(`Restore this ${noun} before replacing its file.`);
  const reviewed = await countContentUsingMedia(asset._id, REVIEWED);
  if (reviewed > 0) {
    throw new ConflictError(
      asset.kind === "image"
        ? `${reviewed} reviewed or approved item(s) use this image. Upload the new image separately and attach it there, so the change is reviewed.`
        : `${reviewed} reviewed or approved exercise(s) use this audio. Upload the new recording separately and attach it there, so the change is reviewed.`,
    );
  }
  await enforceRateLimit(RATE_LIMITS.curriculumUploadByUser, actor.id);
  const bytes = await readBytes();
  const options = { declaredType, filename };
  const detected = asset.kind === "image" ? validateCurriculumImage(bytes, options) : validateCurriculumAudio(bytes, options);
  const stored = await storeCurriculumBytes(bytes, detected);
  let updated;
  try {
    updated = await mediaRepo.replaceCurriculumUploadFile(asset._id, asset.storage, {
      mime: detected.mime,
      storage: { driver: stored.driver, key: stored.key },
      size: stored.size,
      ...(asset.kind === "image"
        ? { width: detected.width, height: detected.height }
        : { durationSec: detected.durationSec ?? clientDuration.parse(durationSec) ?? null }),
      originalName: safeOriginalName(filename),
      updatedBy: toObjectId(actor.id),
      updatedAt: new Date(),
    });
  } catch (err) {
    await removeBytes(stored);
    throw err;
  }
  if (!updated) {
    await removeBytes(stored);
    throw new ConflictError(`This ${noun} was changed by someone else. Reload and try again.`);
  }
  await removeBytes(asset.storage);
  logger.info("curriculum_media_replaced", { id: String(asset._id), actor: actor.id });
  return adminMediaView(updated);
}

export async function updateCurriculumMedia(actor, id, input) {
  assertManage(actor);
  const asset = await findUploadOrThrow(id);
  const data = parseOrThrow(curriculumMediaMetaSchema, input ?? {});
  const byKind =
    asset.kind === "image" ? { alt: data.alt ?? null } : { language: data.language, voice: data.voice ?? null, transcript: data.transcript ?? null };
  const updated = await mediaRepo.updateCurriculumUpload(asset._id, {
    title: data.title,
    source: data.source,
    license: data.license ?? null,
    ...byKind,
    updatedBy: toObjectId(actor.id),
    updatedAt: new Date(),
  });
  return adminMediaView(updated);
}

function inUseError(asset, n) {
  if (asset.kind === "image") return new ConflictError(`${n} item(s) use this image. Remove it from them first (see "Used by").`);
  return new ConflictError(`${n} exercise(s) use this audio. Remove it from them first (see "Used by").`);
}

// Archive = soft delete: hidden from pickers and the default list, can't be attached and
// is never played. Only unused audio can be archived, so nothing loses its recording
// silently.
export async function setCurriculumMediaStatus(actor, id, status) {
  assertManage(actor);
  const to = parseOrThrow(z.enum(Object.values(MEDIA_STATUS)), status, "Unknown status.");
  const asset = await findUploadOrThrow(id);
  if (to === MEDIA_STATUS.archived) {
    const used = await countContentUsingMedia(asset._id);
    if (used > 0) throw inUseError(asset, used);
  }
  const updated = await mediaRepo.updateCurriculumUpload(asset._id, { status: to, updatedBy: toObjectId(actor.id), updatedAt: new Date() });
  logger.info("curriculum_media_status", { id: String(asset._id), status: to, actor: actor.id });
  return adminMediaView(updated);
}

// Hard delete (metadata, then bytes): only archived audio that no exercise references.
// Archiving first closes the window in which an editor could still attach it, because
// saves reject archived media.
export async function deleteCurriculumMedia(actor, id) {
  assertManage(actor);
  const asset = await findUploadOrThrow(id);
  if (asset.status !== MEDIA_STATUS.archived) throw new ConflictError(`Archive this ${kindNoun(asset)} before deleting it.`);
  const used = await countContentUsingMedia(asset._id);
  if (used > 0) throw inUseError(asset, used);
  await destroyMediaAsset(asset);
  logger.info("curriculum_media_deleted", { id: String(asset._id), actor: actor.id });
  return true;
}

// --- Admin reads -------------------------------------------------------------------------

// List filters come from the URL, so anything invalid is ignored rather than rejected.
const param = (schema) =>
  z.preprocess((v) => blankToUndefined(Array.isArray(v) ? v[0] : v), schema.optional()).catch(undefined);

export const MEDIA_SOURCE_FILTERS = Object.freeze(["uploads", "native", "licensed", "tts", "all"]);

export const mediaListQuerySchema = z.object({
  q: param(z.string().trim().max(100)),
  source: param(z.enum(MEDIA_SOURCE_FILTERS)),
  status: param(z.enum(["active", "archived", "any"])),
  usage: param(z.enum(["used", "unused"])),
  kind: param(z.enum([...MEDIA_KINDS, "any"])),
  page: param(z.coerce.number().int().min(1).max(10_000)),
  pageSize: param(z.coerce.number().int().min(1).max(100)),
});

const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function mediaFilter(q) {
  const and = [];
  const source = q.source ?? "uploads";
  if (source === "uploads") and.push({ source: { $in: CURRICULUM_UPLOAD_SOURCES } });
  else if (source === "all") and.push({ source: { $in: [...CURRICULUM_UPLOAD_SOURCES, "tts"] } });
  else and.push({ source });
  const status = q.status ?? "active";
  if (status === "active") and.push({ status: { $ne: MEDIA_STATUS.archived } });
  else if (status === "archived") and.push({ status: MEDIA_STATUS.archived });
  if (q.kind && q.kind !== "any") and.push({ kind: q.kind });
  if (q.q) {
    const rx = { $regex: escapeRegex(q.q), $options: "i" };
    and.push({ $or: ["title", "originalName", "transcript", "voice", "license", "alt"].map((f) => ({ [f]: rx })) });
  }
  if (q.usage) {
    const ids = await referencedMediaIds();
    and.push({ _id: q.usage === "used" ? { $in: ids } : { $nin: ids } });
  }
  return { $and: and };
}

// Where one upload is used, per document: the exercise audio targets ("stimulus" or an
// item id; removable from the library) and the image targets (changed in the editor).
function contentUsage({ kind, doc }, mediaId) {
  const id = String(mediaId);
  return serialize({
    kind,
    id: doc._id,
    slug: doc.slug ?? null,
    label: contentLabel(kind, doc),
    levelCode: doc.levelCode ?? null,
    skill: doc.skill ?? null,
    version: doc.version,
    reviewStatus: doc.reviewStatus,
    publishStatus: doc.publishStatus,
    targets: kind === "exercises" ? exerciseAudioTargets(doc).filter((t) => t.mediaId === id).map((t) => t.target) : [],
    images: contentImageRefs(kind, doc)
      .filter((r) => String(r.ref.mediaId) === id)
      .map((r) => r.label),
  });
}

function usesMedia({ kind, doc }, id) {
  return (
    (kind === "exercises" && exerciseAudioTargets(doc).some((t) => t.mediaId === id)) ||
    contentImageRefs(kind, doc).some((r) => String(r.ref.mediaId) === id)
  );
}

// Media library: curriculum uploads and/or generated TTS, never learner recordings.
export async function listCurriculumMedia(actor, query = {}) {
  assertManage(actor);
  const q = mediaListQuerySchema.parse(query);
  const result = await mediaRepo.listCurriculumMedia(await mediaFilter(q), { page: q.page ?? 1, pageSize: q.pageSize ?? 50 });
  const users = await findContentUsingMedia(
    result.items.map((a) => a._id),
    {},
    { limit: 1000 },
  );
  const items = result.items.map((a) => ({
    ...adminMediaView(a),
    usedBy: users.filter((u) => usesMedia(u, String(a._id))).length,
  }));
  return { ...result, items, query: q };
}

export async function getCurriculumMediaForAdmin(actor, id) {
  assertManage(actor);
  const asset = await mediaRepo.findMediaAssetById(id);
  if (!asset || asset.source === "learner") throw new NotFoundError();
  const usedBy = CURRICULUM_UPLOAD_SOURCES.includes(asset.source)
    ? (await findContentUsingMedia([asset._id])).map((u) => contentUsage(u, asset._id))
    : [];
  return { media: adminMediaView(asset), usedBy };
}

// Pickers in the editors and the library's attach form: active uploads of one kind only
// (audio, unless `kind: "image"` is asked for).
export async function searchCurriculumMedia(actor, query = {}) {
  assertManage(actor);
  const q = mediaListQuerySchema.parse({ ...query, status: "active", page: 1 });
  const source = ["native", "licensed"].includes(q.source) ? q.source : "uploads";
  const kind = q.kind === "image" ? "image" : "audio";
  const { items, total } = await mediaRepo.listCurriculumMedia(await mediaFilter({ ...q, source, kind }), { pageSize: 20 });
  if (kind === "image") return { items: items.map(adminImageSummary), total };
  return { items: items.map((a) => ({ ...adminMediaSummary(a), originalName: a.originalName ?? null, language: a.language ?? null })), total };
}
