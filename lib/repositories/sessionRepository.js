import { collection, COLLECTIONS } from "@/lib/db/collections";
import { toObjectId } from "@/lib/validation/common";

const sessions = () => collection(COLLECTIONS.sessions);

export async function insertSession({ tokenHash, userId, expiresAt, userAgent, ip }) {
  const now = new Date();
  await (await sessions()).insertOne({
    tokenHash,
    userId: toObjectId(userId),
    expiresAt,
    createdAt: now,
    lastSeenAt: now,
    userAgent: userAgent?.slice(0, 300) ?? null,
    ip: ip ?? null,
  });
}

// Expired sessions are rejected here as well: the TTL monitor only runs once a minute.
export async function findActiveSession(tokenHash) {
  return (await sessions()).findOne({ tokenHash: String(tokenHash), expiresAt: { $gt: new Date() } });
}

export async function extendSession(tokenHash, expiresAt) {
  await (await sessions()).updateOne({ tokenHash: String(tokenHash) }, { $set: { expiresAt, lastSeenAt: new Date() } });
}

export async function deleteSession(tokenHash) {
  await (await sessions()).deleteOne({ tokenHash: String(tokenHash) });
}

export async function deleteSessionsForUser(userId) {
  const { deletedCount } = await (await sessions()).deleteMany({ userId: toObjectId(userId) });
  return deletedCount;
}
