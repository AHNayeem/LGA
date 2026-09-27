import { getDb } from "@/lib/db/client";
import { COLLECTIONS } from "@/lib/db/collections";

// Index definitions follow the access patterns of the repositories.
export const INDEXES = {
  [COLLECTIONS.users]: [{ key: { email: 1 }, unique: true, name: "email_unique" }],
  [COLLECTIONS.sessions]: [
    { key: { tokenHash: 1 }, unique: true, name: "tokenHash_unique" },
    { key: { userId: 1 }, name: "userId" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "expiresAt_ttl" },
  ],
  [COLLECTIONS.rateLimits]: [
    { key: { key: 1 }, unique: true, name: "key_unique" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "expiresAt_ttl" },
  ],
  [COLLECTIONS.levels]: [
    { key: { code: 1 }, unique: true, name: "code_unique" },
    { key: { publishStatus: 1, order: 1 }, name: "publish_order" },
  ],
  [COLLECTIONS.modules]: [
    { key: { levelCode: 1, slug: 1 }, unique: true, name: "level_slug_unique" },
    { key: { levelCode: 1, publishStatus: 1, order: 1 }, name: "level_publish_order" },
  ],
  [COLLECTIONS.lessons]: [
    { key: { moduleId: 1, slug: 1 }, unique: true, name: "module_slug_unique" },
    { key: { moduleId: 1, publishStatus: 1, order: 1 }, name: "module_publish_order" },
  ],
  [COLLECTIONS.references]: [
    { key: { slug: 1 }, unique: true, name: "slug_unique" },
    { key: { parentId: 1, order: 1 }, name: "parent_order" },
  ],
  [COLLECTIONS.mediaAssets]: [
    { key: { "storage.driver": 1, "storage.key": 1 }, unique: true, name: "storage_unique" },
    { key: { ownerId: 1, createdAt: -1 }, name: "owner_recent" },
    // Generated TTS audio is looked up by the hash of its cue (see lib/audio/cues.js).
    { key: { ttsHash: 1 }, unique: true, partialFilterExpression: { ttsHash: { $type: "string" } }, name: "ttsHash_unique" },
  ],
  [COLLECTIONS.vocabulary]: [
    { key: { levelCode: 1, slug: 1 }, unique: true, name: "level_slug_unique" },
    { key: { levelCode: 1, publishStatus: 1 }, name: "level_publish" },
  ],
  [COLLECTIONS.grammarTopics]: [{ key: { levelCode: 1, slug: 1 }, unique: true, name: "level_slug_unique" }],
  [COLLECTIONS.exercises]: [
    { key: { levelCode: 1, slug: 1 }, unique: true, name: "level_slug_unique" },
    { key: { levelCode: 1, skill: 1, publishStatus: 1 }, name: "level_skill_publish" },
  ],
  [COLLECTIONS.attempts]: [
    { key: { userId: 1, exerciseId: 1, createdAt: -1 }, name: "user_exercise_recent" },
    { key: { userId: 1, createdAt: -1 }, name: "user_recent" },
  ],
  [COLLECTIONS.userProgress]: [
    { key: { userId: 1, scope: 1, scopeId: 1 }, unique: true, name: "user_scope_unique" },
    { key: { userId: 1, moduleId: 1 }, name: "user_module" },
  ],
  [COLLECTIONS.userVocabulary]: [
    { key: { userId: 1, vocabId: 1 }, unique: true, name: "user_vocab_unique" },
    { key: { userId: 1, dueAt: 1 }, name: "user_due" },
  ],
};

export async function ensureIndexes() {
  const db = await getDb();
  const results = {};
  for (const [name, specs] of Object.entries(INDEXES)) {
    results[name] = await db.collection(name).createIndexes(specs);
  }
  return results;
}
