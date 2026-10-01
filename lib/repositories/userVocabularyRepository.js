import { collection, COLLECTIONS } from "@/lib/db/collections";
import { toObjectId } from "@/lib/validation/common";

// userVocabulary: one document per (user, word) with its Leitner review state.
const userVocab = () => collection(COLLECTIONS.userVocabulary);

// `limit` bounds the read; a whole level's words (journey views) need more than a lesson.
export async function findStates(userId, vocabIds, { limit = 500 } = {}) {
  const ids = vocabIds.map(toObjectId).filter(Boolean);
  if (ids.length === 0) return [];
  return (await userVocab())
    .find({ userId: toObjectId(userId), vocabId: { $in: ids } })
    .limit(Math.min(limit, 5000))
    .toArray();
}

export async function findState(userId, vocabId) {
  return (await userVocab()).findOne({ userId: toObjectId(userId), vocabId: toObjectId(vocabId) });
}

export async function saveState(userId, vocabId, { levelCode, ...state }, now = new Date()) {
  const filter = { userId: toObjectId(userId), vocabId: toObjectId(vocabId) };
  const update = { $set: { ...state, levelCode, updatedAt: now }, $setOnInsert: { introducedAt: now } };
  const col = await userVocab();
  try {
    return await col.findOneAndUpdate(filter, update, { upsert: true, returnDocument: "after" });
  } catch (err) {
    if (err?.code !== 11000) throw err;
    return col.findOneAndUpdate(filter, update, { upsert: true, returnDocument: "after" });
  }
}

export async function listDue(userId, now = new Date(), limit = 50) {
  return (await userVocab())
    .find({ userId: toObjectId(userId), dueAt: { $lte: now } })
    .sort({ dueAt: 1 })
    .limit(Math.min(limit, 200))
    .toArray();
}
