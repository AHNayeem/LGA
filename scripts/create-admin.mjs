// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... bun run create-admin [--reset-password]
// Creates the admin account, or promotes an existing account to ADMIN.
import { ensureIndexes } from "@/lib/db/indexes";
import { closeClient } from "@/lib/db/client";
import { ensureAdmin } from "@/lib/services/userAdminService";

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

try {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
  await ensureIndexes();
  const res = await ensureAdmin(
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NAME || "Admin" },
    { resetPassword: process.argv.includes("--reset-password") },
  );
  console.log(res.created ? "Admin created." : res.promoted ? "Existing user promoted to ADMIN." : "User is already ADMIN.");
} catch (err) {
  console.error("create-admin failed:", err.fieldErrors ? JSON.stringify(err.fieldErrors) : err.message);
  process.exitCode = 1;
} finally {
  await closeClient();
}
