// Starts an isolated in-memory MongoDB, seeds it, then runs the production build on
// E2E_PORT. Used by playwright.config.mjs; never touches Atlas.
//
// Module 1 content goes through the real review workflow (draft → reviewed → approved →
// published) as the E2E admin. The A1 *level* stays unpublished so the admin E2E test
// still exercises the publish UI. Audio comes from the fake TTS provider, stored in
// GridFS inside the in-memory database (never written to public/).
import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";

const port = process.env.E2E_PORT ?? "3100";
const mongo = await MongoMemoryServer.create();

process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB = "e2e";
process.env.APP_URL = `http://localhost:${port}`;
process.env.MEDIA_STORAGE_DRIVER = "gridfs";

const { ensureIndexes } = await import("@/lib/db/indexes");
const { seedLevels, seedReferences, seedCurriculumModule } = await import("@/lib/services/seedService");
const { ensureAdmin } = await import("@/lib/services/userAdminService");
const { bulkModuleTransition } = await import("@/lib/services/contentService");
const { registerTtsAssets } = await import("@/lib/services/audioService");
const { curriculumCues } = await import("@/lib/audio/cues");
const { generateAudio, memoryRegistry, storageSink } = await import("@/lib/audio/generate");
const { createFakeTtsProvider } = await import("@/lib/audio/providers/fake");
const { getStorage } = await import("@/lib/storage");
const { findUserByEmailWithHash } = await import("@/lib/repositories/userRepository");
const { closeClient } = await import("@/lib/db/client");
const { LEVELS } = await import("@/content/seed/levels");
const { REFERENCES } = await import("@/content/seed/references");
const { CURRICULUM } = await import("@/content/curriculum/index.js");

await ensureIndexes();
await seedLevels(LEVELS);
await seedReferences(REFERENCES);
await ensureAdmin({ email: "admin@e2e.test", password: "e2e-admin-password", name: "E2E Admin" });
const adminDoc = await findUserByEmailWithHash("admin@e2e.test");
const admin = { id: String(adminDoc._id), role: adminDoc.role };

const registry = memoryRegistry();
await generateAudio({ cues: curriculumCues(CURRICULUM), provider: createFakeTtsProvider(), sink: storageSink(getStorage("gridfs")), registry });
await registerTtsAssets([...registry.entries.values()]);

for (const def of CURRICULUM) {
  const { moduleId } = await seedCurriculumModule(def);
  for (const step of ["review", "approve", "publish"]) {
    const r = await bulkModuleTransition(admin, moduleId, step);
    if (r.failed.length) throw new Error(`E2E seed: ${step} failed: ${JSON.stringify(r.failed)}`);
  }
}
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
