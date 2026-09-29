import { z } from "zod";
import { getEnv } from "@/lib/config/env";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { logger } from "@/lib/logger";
import { EXERCISE_BLOCK_TYPES } from "@/lib/validation/content";
import { objectIdString, parseOrThrow, toObjectId } from "@/lib/validation/common";
import { itemIdSchema } from "@/lib/exercises/types/common";
import { speakRecordingId } from "@/lib/exercises/types/speakPrompt";
import { DURATION_TOLERANCE_SEC, RECORDING_STATUS, STALE_RECORDING_MS } from "@/lib/media/recording";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { assertLearner, loadAvailableLesson } from "@/lib/services/curriculumService";
import { destroyMediaAsset, publicMediaView, storeLearnerRecording } from "@/lib/services/mediaService";
import * as mediaRepo from "@/lib/repositories/mediaAssetRepository";

// Speaking-practice recordings. A recording is a private learner media asset with a
// `recording` subdocument that ties it to one lesson/exercise/item:
//
//   upload  -> status "pending"   (POST /api/recordings; bytes validated, target checked)
//   submit  -> status "attached"  (submitExerciseAttempt; must match learner + exercise + item)
//   replace -> a newer attached recording for the same item removes the older one
//   stale   -> pending uploads never submitted are removed after STALE_RECORDING_MS
//
// The learning service only ever sees a recording *id*, so how the bytes reach storage
// (this route today, a direct-to-storage upload later) can change without touching it.
// Nothing here scores or analyses the audio.

const uploadSchema = z.object({
  lessonId: objectIdString,
  exerciseId: objectIdString,
  itemId: itemIdSchema,
  durationSec: z.coerce.number().min(0).max(3600).optional(),
});

const INVALID_RECORDING = "That recording could not be found. Please record your answer again.";

// Resolves the target through the learner visibility chain. Anything that is not a live
// speaking prompt in a live lesson is "not found", so ids can't be probed.
async function resolveSpeakingTarget({ lessonId, exerciseId, itemId }) {
  const { lesson, content } = await loadAvailableLesson(lessonId);
  const block = lesson.blocks.find((b) => EXERCISE_BLOCK_TYPES.includes(b.type) && String(b.refId) === exerciseId);
  const exercise = block && content.exercises.get(exerciseId);
  const item = exercise?.items.find((i) => i.id === itemId);
  if (!item || item.type !== "speak_prompt") throw new NotFoundError();
  return { lesson, exercise, item };
}

// `bytes` may be given directly, or as `readBytes()` so an HTTP entry point only reads
// the body after authentication, rate limiting and target checks have passed.
export async function uploadSpeakingRecording(actor, { bytes, readBytes, declaredType, ...target }) {
  assertLearner(actor);
  if (!hasPermission(actor, PERMISSIONS.mediaUpload)) throw new ForbiddenError();
  const input = parseOrThrow(uploadSchema, target, "Invalid recording target.");
  await enforceRateLimit(RATE_LIMITS.uploadByUser, actor.id);
  const maxSeconds = getEnv().RECORDING_MAX_SECONDS;
  if (input.durationSec != null && input.durationSec > maxSeconds + DURATION_TOLERANCE_SEC) {
    throw new ValidationError(`Recordings can be at most ${maxSeconds} seconds long.`);
  }
  const { lesson, exercise, item } = await resolveSpeakingTarget(input);

  const asset = await storeLearnerRecording(actor, {
    bytes: bytes ?? (readBytes ? await readBytes() : null),
    declaredType,
    recording: {
      lessonId: lesson._id,
      exerciseId: exercise._id,
      itemId: item.id,
      status: RECORDING_STATUS.pending,
      attemptId: null,
      durationSec: input.durationSec != null ? Math.round(input.durationSec * 10) / 10 : null,
    },
  });

  // A new take supersedes earlier unsubmitted takes for the same item, and old
  // abandoned uploads of this learner are removed. Best effort: never fails the upload.
  try {
    const pending = await mediaRepo.listRecordingsForTarget(actor.id, {
      exerciseId: exercise._id,
      itemId: item.id,
      status: RECORDING_STATUS.pending,
      excludeId: asset._id,
    });
    for (const old of pending) await destroyMediaAsset(old);
    await cleanupStaleRecordings({ ownerId: actor.id });
  } catch (err) {
    logger.warn("recording_cleanup_failed", { err });
  }

  logger.info("recording_uploaded", { userId: actor.id, exerciseId: String(exercise._id), itemId: item.id, size: asset.size });
  return publicMediaView(asset);
}

// Called by submitExerciseAttempt BEFORE the attempt is stored: every recording id in
// the answers must belong to this learner and to this exercise item. One invalid id
// rejects the whole submission (forged, foreign and deleted ids look the same).
export async function claimRecordingsForSubmission(actor, exercise, answers) {
  const claims = [];
  for (const item of exercise.items) {
    if (item.type !== "speak_prompt") continue;
    const recordingId = speakRecordingId(answers?.[item.id]);
    if (!recordingId) continue;
    const rec = await mediaRepo.findOwnRecording(actor.id, recordingId);
    const matches =
      rec && String(rec.recording.exerciseId) === String(exercise._id) && rec.recording.itemId === item.id;
    if (!matches) throw new ValidationError(INVALID_RECORDING);
    claims.push({ itemId: item.id, recordingId: String(rec._id) });
  }
  return claims;
}

// Called AFTER the attempt is stored: attaches the claimed recordings and removes the
// recordings they replace (same learner, exercise and item). Returns public views.
export async function attachRecordings(actor, { exerciseId, attemptId, claims }) {
  const attached = {};
  for (const { itemId, recordingId } of claims) {
    const doc = await mediaRepo.attachRecording(actor.id, recordingId, { exerciseId, itemId, attemptId });
    if (!doc) continue; // deleted concurrently; the attempt still counts
    attached[itemId] = publicMediaView(doc);
    const replaced = await mediaRepo.listRecordingsForTarget(actor.id, { exerciseId, itemId, excludeId: doc._id });
    for (const old of replaced) await destroyMediaAsset(old);
  }
  return attached;
}

export async function deleteOwnRecording(actor, input) {
  assertLearner(actor);
  const parsed = z.object({ recordingId: objectIdString }).safeParse(input);
  if (!parsed.success) throw new NotFoundError();
  await enforceRateLimit(RATE_LIMITS.learningByUser, actor.id);
  const rec = await mediaRepo.findOwnRecording(actor.id, parsed.data.recordingId);
  if (!rec) throw new NotFoundError();
  await destroyMediaAsset(rec);
  logger.info("recording_deleted", { userId: actor.id, recordingId: String(rec._id) });
  return { deleted: true };
}

// Removes pending uploads older than STALE_RECORDING_MS. Scoped to one learner when
// `ownerId` is given (opportunistic, on upload); global from scripts/cleanup-recordings.
export async function cleanupStaleRecordings({ ownerId = null, now = new Date(), limit = 100 } = {}) {
  const stale = await mediaRepo.listStalePendingRecordings({
    ownerId: ownerId ? toObjectId(ownerId) : null,
    olderThan: new Date(now.getTime() - STALE_RECORDING_MS),
    limit,
  });
  for (const doc of stale) await destroyMediaAsset(doc);
  return { removed: stale.length };
}
