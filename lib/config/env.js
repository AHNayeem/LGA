import { z } from "zod";

// Validated lazily so `next build` does not require runtime secrets.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB: z.string().min(1).default("lga"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(14),
  MEDIA_STORAGE_DRIVER: z.enum(["gridfs", "memory"]).default("gridfs"),
  MEDIA_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

let cached;

export function getEnv() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

// Test helper: env is read once per process, tests may need to reset it.
export function resetEnvCache() {
  cached = undefined;
}
