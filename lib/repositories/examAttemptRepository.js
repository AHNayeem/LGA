import { collection, COLLECTIONS } from "@/lib/db/collections";
import { toObjectId } from "@/lib/validation/common";

// examAttempts: one document per learner attempt at an exam. Every query is scoped by
// userId, so another learner's attempt is indistinguishable from a missing one.
//
//   { userId, examId, examVersion, levelCode, status: in_progress | submitted | expired,
//     seed (secret shuffle seed, never sent to the client), snapshot, startedAt,
//     deadlineAt, submittedAt, submitReason, answers, result, updatedAt }
//
// Status changes are conditional on status "in_progress", so a submitted or expired
// attempt can never change again and two concurrent submissions can't both win.
const attempts = () => collection(COLLECTIONS.examAttempts);

export const ATTEMPT_STATUS = Object.freeze({ inProgress: "in_progress", submitted: "submitted", expired: "expired" });

export async function findOpenAttempt(userId, examId) {
  return (await attempts()).findOne({ userId: toObjectId(userId), examId: toObjectId(examId), status: ATTEMPT_STATUS.inProgress });
}

// Returns the inserted attempt, or null when another open attempt already exists (the
// unique partial index on { userId, examId } while in progress).
export async function insertOpenAttempt(doc) {
  try {
    const { insertedId } = await (await attempts()).insertOne(doc);
    return { ...doc, _id: insertedId };
  } catch (err) {
    if (err?.code === 11000) return null;
    throw err;
  }
}

export async function findOwnAttempt(userId, attemptId) {
  const _id = toObjectId(attemptId);
  if (!_id) return null;
  return (await attempts()).findOne({ _id, userId: toObjectId(userId) });
}

// Finishes an open attempt. Returns the updated document, or null if it was no longer open.
export async function closeOpenAttempt(userId, attemptId, patch) {
  return (await attempts()).findOneAndUpdate(
    { _id: toObjectId(attemptId), userId: toObjectId(userId), status: ATTEMPT_STATUS.inProgress },
    { $set: { ...patch, updatedAt: patch.submittedAt ?? new Date() } },
    { returnDocument: "after" },
  );
}

// Attempt history for one exam, newest first, without the (large) snapshot and answers.
export async function listOwnAttempts(userId, examId, { limit = 20 } = {}) {
  return (await attempts())
    .find(
      { userId: toObjectId(userId), examId: toObjectId(examId) },
      { projection: { snapshot: 0, answers: 0, seed: 0, "result.exercises": 0 } },
    )
    .sort({ startedAt: -1 })
    .limit(Math.min(limit, 100))
    .toArray();
}

// Latest attempts per exam for a list of exams (level page summaries).
export async function listOwnAttemptsForExams(userId, examIds, { perExam = 20 } = {}) {
  const ids = examIds.map(toObjectId).filter(Boolean);
  if (ids.length === 0) return [];
  return (await attempts())
    .find(
      { userId: toObjectId(userId), examId: { $in: ids } },
      { projection: { snapshot: 0, answers: 0, seed: 0, "result.exercises": 0 } },
    )
    .sort({ startedAt: -1 })
    .limit(Math.min(perExam * ids.length, 500))
    .toArray();
}
