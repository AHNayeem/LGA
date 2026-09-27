import { collection, COLLECTIONS } from "@/lib/db/collections";
import { toObjectId } from "@/lib/validation/common";

// One immutable document per submission. Progress documents are derived from these.
const attempts = () => collection(COLLECTIONS.attempts);

export async function insertAttempt(doc) {
  const { insertedId } = await (await attempts()).insertOne(doc);
  return { ...doc, _id: insertedId };
}

export async function listAttemptsForExercise(userId, exerciseId, { limit = 20 } = {}) {
  return (await attempts())
    .find({ userId: toObjectId(userId), exerciseId: toObjectId(exerciseId) })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .toArray();
}
