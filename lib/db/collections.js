import { getDb } from "@/lib/db/client";

// Single source of truth for collection names. Phase 2+ collections are added here
// when they are actually used.
export const COLLECTIONS = Object.freeze({
  users: "users",
  sessions: "sessions",
  rateLimits: "rateLimits",
  levels: "levels",
  modules: "modules",
  lessons: "lessons",
  references: "references",
  mediaAssets: "mediaAssets",
});

export const MEDIA_BUCKET = "media";

export async function collection(name) {
  if (!Object.values(COLLECTIONS).includes(name)) throw new Error(`Unknown collection: ${name}`);
  const db = await getDb();
  return db.collection(name);
}
