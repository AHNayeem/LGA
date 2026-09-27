import { collection, COLLECTIONS } from "@/lib/db/collections";
import { toObjectId } from "@/lib/validation/common";

// userProgress: one document per (user, lesson). Bounded by the lesson's block count, so
// no document grows without limit. Updates are atomic ($inc/$max/$min/$addToSet).
const progress = () => collection(COLLECTIONS.userProgress);

export const LESSON_SCOPE = "lesson";

function lessonKey(userId, lessonId) {
  return { userId: toObjectId(userId), scope: LESSON_SCOPE, scopeId: toObjectId(lessonId) };
}

function onInsert({ moduleId, levelCode }, now) {
  return { moduleId: toObjectId(moduleId), levelCode, blocksDone: [], completedAt: null, createdAt: now };
}

// Two concurrent first writes can both try to insert; the loser retries as an update.
async function upsert(filter, update) {
  const col = await progress();
  try {
    return await col.findOneAndUpdate(filter, update, { upsert: true, returnDocument: "after" });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    return col.findOneAndUpdate(filter, update, { upsert: true, returnDocument: "after" });
  }
}

export async function findLessonProgress(userId, lessonId) {
  return (await progress()).findOne(lessonKey(userId, lessonId));
}

export async function listLessonProgress(userId, lessonIds) {
  const ids = lessonIds.map(toObjectId).filter(Boolean);
  if (ids.length === 0) return [];
  return (await progress())
    .find({ userId: toObjectId(userId), scope: LESSON_SCOPE, scopeId: { $in: ids } })
    .limit(500)
    .toArray();
}

// exerciseId is a validated ObjectId hex string, so it is safe as a field name.
export async function recordExerciseResult({ userId, lessonId, moduleId, levelCode, exerciseId, skill, result, now = new Date() }) {
  const p = `exercises.${String(exerciseId)}`;
  const update = {
    $setOnInsert: onInsert({ moduleId, levelCode }, now),
    $set: {
      [`${p}.skill`]: skill,
      [`${p}.last`]: { score: result.score, maxScore: result.maxScore, ratio: result.ratio, passed: result.passed, at: now },
      updatedAt: now,
    },
    $inc: { [`${p}.attempts`]: 1 },
  };
  if (result.ratio != null) update.$max = { [`${p}.bestRatio`]: result.ratio };
  if (result.passed) update.$min = { [`${p}.passedAt`]: now };
  return upsert(lessonKey(userId, lessonId), update);
}

export async function markBlockDone({ userId, lessonId, moduleId, levelCode, blockKey, now = new Date() }) {
  const { blocksDone, ...insertFields } = onInsert({ moduleId, levelCode }, now);
  void blocksDone; // created by $addToSet instead
  return upsert(lessonKey(userId, lessonId), {
    $setOnInsert: insertFields,
    $addToSet: { blocksDone: String(blockKey) },
    $set: { updatedAt: now },
  });
}

// Sets completedAt once; later calls keep the first completion time.
export async function markLessonCompleted(userId, lessonId, now = new Date()) {
  const res = await (await progress()).findOneAndUpdate(
    { ...lessonKey(userId, lessonId), completedAt: null },
    { $set: { completedAt: now, updatedAt: now } },
    { returnDocument: "after" },
  );
  return res ?? findLessonProgress(userId, lessonId);
}
