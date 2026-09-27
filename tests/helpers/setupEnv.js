import { inject } from "vitest";
import { randomUUID } from "node:crypto";

// Each test file gets an isolated database on the shared in-memory server.
process.env.MONGODB_URI = inject("mongoUri");
process.env.MONGODB_DB = `test_${randomUUID().slice(0, 8)}`;
process.env.MEDIA_STORAGE_DRIVER = "memory";
process.env.SESSION_TTL_DAYS = "14";
