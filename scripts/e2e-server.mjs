// Starts an isolated in-memory MongoDB, seeds it, then runs the production build on
// E2E_PORT. Used by playwright.config.mjs; never touches Atlas (see scripts/atlas-e2e.mjs
// for the Atlas run).
//
// The A1 *level* stays unpublished so the admin E2E test still exercises the publish UI.
import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";

const port = process.env.E2E_PORT ?? "3100";
const mongo = await MongoMemoryServer.create();

process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB = "e2e";
process.env.APP_URL = `http://localhost:${port}`;
process.env.MEDIA_STORAGE_DRIVER = "gridfs";
// Short limit so the auto-stop at the maximum recording length can be tested quickly.
process.env.RECORDING_MAX_SECONDS = "5";

const { seedE2EDatabase } = await import("./lib/e2e-seed.mjs");
const { closeClient } = await import("@/lib/db/client");
await seedE2EDatabase({ log: (l) => console.log(l) });
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
