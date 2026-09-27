import { afterAll, beforeAll, beforeEach } from "vitest";
import { closeClient, getDb } from "@/lib/db/client";
import { ensureIndexes } from "@/lib/db/indexes";
import { ROLES } from "@/lib/auth/roles";
import { insertUser } from "@/lib/repositories/userRepository";
import { hashPassword } from "@/lib/auth/password";

// Call once per integration test file.
export function setupTestDatabase() {
  beforeAll(async () => {
    await ensureIndexes();
  });
  beforeEach(async () => {
    const db = await getDb();
    const cols = await db.collections();
    await Promise.all(cols.map((c) => c.deleteMany({})));
  });
  afterAll(async () => {
    const db = await getDb();
    await db.dropDatabase();
    await closeClient();
  });
}

let counter = 0;
export async function createTestUser({ role = ROLES.USER, password = "correct-horse-battery" } = {}) {
  counter++;
  const u = await insertUser({
    email: `user${counter}-${Date.now()}@example.de`,
    name: `Test ${counter}`,
    passwordHash: await hashPassword(password),
    role,
    uiLanguage: "en",
  });
  return { id: String(u._id), email: u.email, name: u.name, role, password };
}
