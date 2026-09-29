// Usage: bun run build && bun run test:e2e:atlas [-- --keep]
//        (needs ATLAS_TEST_URI, or MONGODB_URI in .env.local)
//
// Browser E2E against a REAL MongoDB Atlas cluster, including an application restart:
//   1. seed a throwaway database lga_e2e_<run> (Module 1 with test-fixture approval)
//   2. start the production build, run phase 1 (register → lessons → attempts → words →
//      speaking recording), stop the server
//   3. start a NEW server process, run phase 2 (log in again, everything is still there)
//   4. check the stored documents directly, then drop the database (unless --keep)
// Never falls back to an in-memory database. Use a development/test cluster only.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dropDatabasesWithPrefix, newRunId, resolveAtlasUri } from "./lib/atlas.mjs";

const keep = process.argv.includes("--keep");
const port = process.env.ATLAS_E2E_PORT ?? "3200";
const baseURL = `http://localhost:${port}`;

let atlas;
try {
  atlas = resolveAtlasUri();
} catch (err) {
  console.error(`test:e2e:atlas: ${err.message}`);
  process.exit(1);
}
if (!existsSync(".next/BUILD_ID")) {
  console.error("test:e2e:atlas: no production build found. Run `bun run build` first.");
  process.exit(1);
}

const runId = newRunId();
const dbName = `lga_e2e_${runId}`;
// Outside test-results/: Playwright empties that directory when it starts.
const stateDir = join(tmpdir(), `lga-atlas-e2e-${runId}`);
mkdirSync(stateDir, { recursive: true });
Object.assign(process.env, {
  MONGODB_URI: atlas.uri,
  MONGODB_DB: dbName,
  APP_URL: baseURL,
  MEDIA_STORAGE_DRIVER: "gridfs",
});
console.log(`test:e2e:atlas: ${atlas.source} → ${atlas.host}, database ${dbName}`);

const { seedE2EDatabase } = await import("./lib/e2e-seed.mjs");
const { closeClient, getDb } = await import("@/lib/db/client");

function startServer() {
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", port], {
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, NODE_ENV: "production" },
  });
  return child;
}

async function waitHealthy(timeoutMs = 90_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const res = await fetch(`${baseURL}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not become healthy");
}

function stopServer(child) {
  return new Promise((resolve) => {
    if (child.exitCode != null || child.signalCode != null) return resolve();
    child.once("exit", resolve);
    child.kill();
  });
}

function runPhase(phase) {
  const res = spawnSync(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "--config", "playwright.atlas.config.mjs"], {
    stdio: "inherit",
    env: { ...process.env, ATLAS_E2E_PHASE: String(phase), ATLAS_E2E_STATE_DIR: stateDir, ATLAS_E2E_BASE_URL: baseURL },
  });
  return res.status === 0;
}

// Direct checks on what phase 1 stored, after the second server has been used.
async function verifyStoredState() {
  const db = await getDb();
  const problems = [];
  for (const file of ["chromium", "mobile"].map((p) => `${stateDir}/${p}.json`).filter(existsSync)) {
    const s = JSON.parse(readFileSync(file, "utf8"));
    const user = await db.collection("users").findOne({ email: s.email });
    if (!user) {
      problems.push(`${file}: user not found`);
      continue;
    }
    const counts = {
      attempts: await db.collection("attempts").countDocuments({ userId: user._id }),
      progress: await db.collection("userProgress").countDocuments({ userId: user._id, completedAt: { $ne: null } }),
      vocabulary: await db.collection("userVocabulary").countDocuments({ userId: user._id }),
      recordings: await db.collection("mediaAssets").countDocuments({ ownerId: user._id, "recording.status": "attached" }),
    };
    const rec = await db.collection("mediaAssets").findOne({ ownerId: user._id, "recording.status": "attached" });
    const bytes = rec ? await db.collection("media.files").findOne({ filename: rec.storage.key }) : null;
    console.log(`  ${s.project}: ${JSON.stringify(counts)}; GridFS bytes: ${bytes?.length ?? 0}`);
    if (counts.attempts < s.expected.attempts) problems.push(`${s.project}: ${counts.attempts} attempts, expected ≥ ${s.expected.attempts}`);
    if (counts.progress < 1) problems.push(`${s.project}: lesson completion not stored`);
    if (counts.vocabulary < s.expected.vocabulary) problems.push(`${s.project}: ${counts.vocabulary} word states, expected ${s.expected.vocabulary}`);
    if (counts.recordings !== 1 || !bytes?.length) problems.push(`${s.project}: recording or its GridFS bytes missing`);
  }
  return problems;
}

let ok = false;
let server;
try {
  const { audioSource } = await seedE2EDatabase({ publishLevel: true, log: (l) => console.log(l) });
  await closeClient();
  console.log(`Seeded (${audioSource} audio). Phase 1: first server.`);

  server = startServer();
  await waitHealthy();
  const phase1 = runPhase(1);
  await stopServer(server);
  server = null;
  if (!phase1) throw new Error("phase 1 failed");

  console.log("Phase 2: restarted server (new process, new connections).");
  server = startServer();
  await waitHealthy();
  const phase2 = runPhase(2);
  await stopServer(server);
  server = null;
  if (!phase2) throw new Error("phase 2 failed");

  console.log("Stored state:");
  const problems = await verifyStoredState();
  if (problems.length) throw new Error(problems.join("\n"));
  ok = true;
  const target = atlas.host.endsWith(".mongodb.net") ? `Atlas (${atlas.host})` : `NON-Atlas server ${atlas.host} (ATLAS_ALLOW_NON_ATLAS=1)`;
  console.log(`test:e2e:atlas: PASSED — state persisted across an application restart on ${target}.`);
} catch (err) {
  console.error(`test:e2e:atlas: FAILED — ${err.message}`);
} finally {
  if (server) await stopServer(server);
  await closeClient();
  if (keep) {
    console.log(`Kept database ${dbName} (--keep). Drop it when done.`);
  } else {
    const { dropped, listed } = await dropDatabasesWithPrefix(atlas.uri, dbName).catch((e) => ({ dropped: [], listed: false, e }));
    console.log(listed ? `Dropped ${dropped.join(", ") || "nothing"}.` : `Could not list databases; drop ${dbName} manually if it exists.`);
  }
  rmSync(stateDir, { recursive: true, force: true });
}
process.exit(ok ? 0 : 1);
