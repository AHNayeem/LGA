import { getDb } from "@/lib/db/client";

// Single source of truth for collection names. Later-phase collections are added here
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
  // Phase 2: curriculum content (lifecycle-managed)
  vocabulary: "vocabulary",
  grammarTopics: "grammarTopics",
  exercises: "exercises",
  // Phase 2: per-learner data (one document per attempt / lesson / word, never one big user doc)
  attempts: "attempts",
  userProgress: "userProgress",
  userVocabulary: "userVocabulary",
  // Exams: definitions are lifecycle-managed content; attempts are per learner.
  exams: "exams",
  examAttempts: "examAttempts",
});

export const MEDIA_BUCKET = "media";

export async function collection(name) {
  if (!Object.values(COLLECTIONS).includes(name)) throw new Error(`Unknown collection: ${name}`);
  const db = await getDb();
  return db.collection(name);
}
