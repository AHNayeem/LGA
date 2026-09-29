import { randomUUID } from "node:crypto";

// Atlas integration runs (vitest.atlas.config.mjs): a real cluster, one throwaway
// database per test file. Fails loudly instead of falling back to anything else.
if (!process.env.ATLAS_TEST_URI || !process.env.ATLAS_TEST_DB_PREFIX) {
  throw new Error("Atlas tests must be started with `bun run test:atlas` (ATLAS_TEST_URI is not set).");
}
process.env.MONGODB_URI = process.env.ATLAS_TEST_URI;
process.env.MONGODB_DB = `${process.env.ATLAS_TEST_DB_PREFIX}${randomUUID().slice(0, 8)}`;
process.env.MEDIA_STORAGE_DRIVER = "gridfs"; // recordings go through real Atlas GridFS
process.env.SESSION_TTL_DAYS = "14";
process.env.LGA_REAL_DATABASE = "1";
