import bcrypt from "bcryptjs";

const COST = process.env.NODE_ENV === "test" ? 4 : 12;

// Pre-computed hash used when the email is unknown, so response time does not reveal
// whether an account exists.
let dummyHash;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain, hash) {
  if (!hash) {
    dummyHash ??= await bcrypt.hash("dummy-password-for-timing", COST);
    await bcrypt.compare(plain, dummyHash);
    return false;
  }
  return bcrypt.compare(plain, hash);
}
