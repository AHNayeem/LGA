import { collection, COLLECTIONS } from "@/lib/db/collections";
import { toObjectId } from "@/lib/validation/common";
import { ConflictError } from "@/lib/errors";

const users = () => collection(COLLECTIONS.users);

// Never return the password hash unless explicitly asked for (login only).
const SAFE_PROJECTION = { passwordHash: 0 };

export async function findUserById(id) {
  const _id = toObjectId(id);
  if (!_id) return null;
  return (await users()).findOne({ _id }, { projection: SAFE_PROJECTION });
}

export async function findUserByEmailWithHash(email) {
  return (await users()).findOne({ email: String(email) });
}

export async function insertUser({ email, name, passwordHash, role, uiLanguage }) {
  const now = new Date();
  const doc = { email, name, passwordHash, role, uiLanguage, createdAt: now, updatedAt: now, lastLoginAt: null };
  try {
    const { insertedId } = await (await users()).insertOne(doc);
    return { _id: insertedId, email, name, role, uiLanguage, createdAt: now };
  } catch (err) {
    if (err?.code === 11000) throw new ConflictError("An account with this email already exists.");
    throw err;
  }
}

export async function updateUserRole(id, role) {
  const _id = toObjectId(id);
  if (!_id) return null;
  return (await users()).findOneAndUpdate(
    { _id },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: "after", projection: SAFE_PROJECTION },
  );
}

export async function touchLastLogin(id) {
  await (await users()).updateOne({ _id: toObjectId(id) }, { $set: { lastLoginAt: new Date() } });
}

export async function updatePasswordHash(id, passwordHash) {
  await (await users()).updateOne({ _id: toObjectId(id) }, { $set: { passwordHash, updatedAt: new Date() } });
}

// Onboarding choices: { goal, startModule, levelCode, updatedAt } (learningProfileService).
export async function updateLearningProfile(id, profile) {
  const _id = toObjectId(id);
  if (!_id) return null;
  return (await users()).findOneAndUpdate(
    { _id },
    { $set: { learningProfile: profile, updatedAt: new Date() } },
    { returnDocument: "after", projection: SAFE_PROJECTION },
  );
}
