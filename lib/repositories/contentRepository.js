import { collection, COLLECTIONS } from "@/lib/db/collections";
import { toObjectId } from "@/lib/validation/common";
import { ConflictError } from "@/lib/errors";
import { PUBLISH_STATUS, REVIEW_STATUS } from "@/lib/content/lifecycle";
import { IMAGE_REFERENCE_PATHS } from "@/lib/media/imageRefs";

// Generic data access for lifecycle-managed content collections.
export const CONTENT_COLLECTIONS = Object.freeze([
  COLLECTIONS.levels,
  COLLECTIONS.modules,
  COLLECTIONS.lessons,
  COLLECTIONS.references,
  COLLECTIONS.vocabulary,
  COLLECTIONS.grammarTopics,
  COLLECTIONS.exercises,
  COLLECTIONS.exams,
]);

export const LEARNER_VISIBLE = Object.freeze({
  publishStatus: PUBLISH_STATUS.published,
  reviewStatus: REVIEW_STATUS.approved,
});

const MAX_PAGE_SIZE = 100;

function assertContentCollection(name) {
  if (!CONTENT_COLLECTIONS.includes(name)) throw new Error(`Not a content collection: ${name}`);
}

export function createContentRepository(name) {
  assertContentCollection(name);
  const col = () => collection(name);

  return {
    name,

    async findById(id) {
      const _id = toObjectId(id);
      if (!_id) return null;
      return (await col()).findOne({ _id });
    },

    async findOne(filter) {
      return (await col()).findOne(filter);
    },

    // Bounded batch lookup (lesson blocks, module review). `filter` narrows further,
    // e.g. LEARNER_VISIBLE.
    async findManyByIds(ids, filter = {}) {
      const _ids = [...new Set(ids.map(String))].map(toObjectId).filter(Boolean);
      if (_ids.length === 0) return [];
      return (await col()).find({ ...filter, _id: { $in: _ids } }).limit(500).toArray();
    },

    // `filter` must be built by services from validated values, never raw request input.
    async list(filter = {}, { sort = { order: 1, _id: 1 }, page = 1, pageSize = 50 } = {}) {
      const size = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
      const skip = (Math.max(1, page) - 1) * size;
      const c = await col();
      const [items, total] = await Promise.all([
        c.find(filter).sort(sort).skip(skip).limit(size).toArray(),
        c.countDocuments(filter),
      ]);
      return { items, total, page: Math.max(1, page), pageSize: size };
    },

    // Admin dashboard: number of documents per { reviewStatus, publishStatus } pair.
    async countByStatus() {
      const rows = await (await col())
        .aggregate([{ $group: { _id: { review: "$reviewStatus", publish: "$publishStatus" }, n: { $sum: 1 } } }])
        .toArray();
      return rows.map((r) => ({ reviewStatus: r._id.review, publishStatus: r._id.publish, count: r.n }));
    },

    async insert(doc) {
      try {
        const { insertedId } = await (await col()).insertOne(doc);
        return { ...doc, _id: insertedId };
      } catch (err) {
        if (err?.code === 11000) throw new ConflictError("Content with this identifier already exists.");
        throw err;
      }
    },

    // Optimistic concurrency: the update only applies if the stored version still matches.
    async updateIfVersion(id, expectedVersion, patch) {
      const _id = toObjectId(id);
      if (!_id) return null;
      const updated = await (await col()).findOneAndUpdate(
        { _id, version: expectedVersion },
        { $set: patch },
        { returnDocument: "after" },
      );
      if (!updated) throw new ConflictError("This content was changed by someone else. Reload and try again.");
      return updated;
    },

    // Lifecycle transitions don't change the content body, so they don't bump the version,
    // but they must apply to the state the caller validated against.
    async updateIfState(id, { reviewStatus, publishStatus, version }, patch) {
      const _id = toObjectId(id);
      if (!_id) return null;
      const updated = await (await col()).findOneAndUpdate(
        { _id, reviewStatus, publishStatus, version },
        { $set: patch },
        { returnDocument: "after" },
      );
      if (!updated) throw new ConflictError("This content was changed by someone else. Reload and try again.");
      return updated;
    },

    // Seed helper: inserts only if missing, never overwrites reviewed/edited content.
    async insertIfMissing(filter, doc) {
      const res = await (await col()).updateOne(filter, { $setOnInsert: doc }, { upsert: true });
      return { inserted: res.upsertedCount === 1 };
    },
  };
}

export const levelRepository = createContentRepository(COLLECTIONS.levels);
export const moduleRepository = createContentRepository(COLLECTIONS.modules);
export const lessonRepository = createContentRepository(COLLECTIONS.lessons);
export const referenceRepository = createContentRepository(COLLECTIONS.references);
export const vocabularyRepository = createContentRepository(COLLECTIONS.vocabulary);
export const grammarTopicRepository = createContentRepository(COLLECTIONS.grammarTopics);
export const exerciseRepository = createContentRepository(COLLECTIONS.exercises);
export const examRepository = createContentRepository(COLLECTIONS.exams);

// --- Content → curriculum media references ----------------------------------------------
// Recordings are attached by id at `stimulus.audio.mediaId` and `items[].audio.mediaId`,
// images at the paths in lib/media/imageRefs.js. Every path is indexed (lib/db/indexes.js).

export const MEDIA_REFERENCE_PATHS = Object.freeze({
  [COLLECTIONS.exercises]: ["stimulus.audio.mediaId", "items.audio.mediaId", ...IMAGE_REFERENCE_PATHS.exercises],
  [COLLECTIONS.vocabulary]: IMAGE_REFERENCE_PATHS.vocabulary,
  [COLLECTIONS.lessons]: IMAGE_REFERENCE_PATHS.lessons,
});

function mediaReferenceFilter(mediaIds, paths) {
  const ids = [...new Set(mediaIds.map(String))].map(toObjectId).filter(Boolean);
  return { $or: paths.map((p) => ({ [p]: { $in: ids } })) };
}

// Every document (exercises, words, lessons; any lifecycle state unless `filter` narrows
// it) that uses any of the ids, as [{ kind, doc }].
export async function findContentUsingMedia(mediaIds, filter = {}, { limit = 500 } = {}) {
  if (mediaIds.length === 0) return [];
  const found = await Promise.all(
    Object.entries(MEDIA_REFERENCE_PATHS).map(async ([kind, paths]) =>
      (
        await (await collection(kind))
          .find({ $and: [filter, mediaReferenceFilter(mediaIds, paths)] })
          .sort({ levelCode: 1, slug: 1, _id: 1 })
          .limit(limit)
          .toArray()
      ).map((doc) => ({ kind, doc })),
    ),
  );
  return found.flat();
}

export async function countContentUsingMedia(mediaId, filter = {}) {
  const counts = await Promise.all(
    Object.entries(MEDIA_REFERENCE_PATHS).map(async ([kind, paths]) =>
      (await collection(kind)).countDocuments({ $and: [filter, mediaReferenceFilter([mediaId], paths)] }),
    ),
  );
  return counts.reduce((a, b) => a + b, 0);
}

// Every media id attached anywhere (for the library's "used" / "unused" filter).
export async function referencedMediaIds() {
  const lists = await Promise.all(
    Object.entries(MEDIA_REFERENCE_PATHS).flatMap(([kind, paths]) => paths.map(async (p) => (await collection(kind)).distinct(p))),
  );
  return [...new Map(lists.flat().filter(Boolean).map((id) => [String(id), id])).values()];
}
