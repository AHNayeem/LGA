// Starts an isolated in-memory MongoDB, seeds it, then runs the production build on
// E2E_PORT. Used by playwright.config.mjs; never touches Atlas.
import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";

const port = process.env.E2E_PORT ?? "3100";
const mongo = await MongoMemoryServer.create();

process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB = "e2e";
process.env.APP_URL = `http://localhost:${port}`;

const { ensureIndexes } = await import("@/lib/db/indexes");
const { seedLevels } = await import("@/lib/services/seedService");
const { ensureAdmin } = await import("@/lib/services/userAdminService");
const { closeClient } = await import("@/lib/db/client");
const { LEVELS } = await import("@/content/seed/levels");

await ensureIndexes();
await seedLevels(LEVELS);
await ensureAdmin({ email: "admin@e2e.test", password: "e2e-admin-password", name: "E2E Admin" });
await closeClient();

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});

async function shutdown(code = 0) {
  child.kill();
  await mongo.stop();
  process.exit(code);
}
child.on("exit", (code) => shutdown(code ?? 0));
process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
