import { COLLECTIONS } from "@/lib/db/collections";
import { serialize } from "@/lib/db/serialize";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError, isAppError } from "@/lib/errors";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { parseOrThrow, toObjectId } from "@/lib/validation/common";
import {
  levelSchema,
  moduleSchema,
  lessonSchema,
  referenceSchema,
  vocabularySchema,
  grammarTopicSchema,
  exerciseSchema,
  reviewTransitionSchema,
  publishTransitionSchema,
  EXERCISE_BLOCK_TYPES,
} from "@/lib/validation/content";
import {
  editPatch,
  initialLifecycle,
  isVisibleToLearners,
  publishPatch,
  reviewTransitionPatch,
  PUBLISH_STATUS,
  REVIEW_STATUS,
} from "@/lib/content/lifecycle";
import {
  createContentRepository,
  levelRepository,
  moduleRepository,
  lessonRepository,
  exerciseRepository,
  vocabularyRepository,
  grammarTopicRepository,
  LEARNER_VISIBLE,
} from "@/lib/repositories/contentRepository";
import { requiredExerciseCues } from "@/lib/audio/cues";
import { findMissingAudio } from "@/lib/services/audioService";
import { exerciseMaxScore } from "@/lib/exercises/engine";
import { logger } from "@/lib/logger";

// Services receive the acting user and enforce permissions themselves, so authorisation
// holds no matter which entry point (Server Action, route handler, script) calls them.

const SCHEMAS = {
  [COLLECTIONS.levels]: levelSchema,
  [COLLECTIONS.modules]: moduleSchema,
  [COLLECTIONS.lessons]: lessonSchema,
  [COLLECTIONS.references]: referenceSchema,
  [COLLECTIONS.vocabulary]: vocabularySchema,
  [COLLECTIONS.grammarTopics]: grammarTopicSchema,
  [COLLECTIONS.exercises]: exerciseSchema,
};

function schemaFor(kind) {
  if (!Object.hasOwn(SCHEMAS, kind)) throw new ValidationError(`Unknown content type "${kind}".`);
  return SCHEMAS[kind];
}

export function contentSchemaFor(kind) {
  return schemaFor(kind);
}

const repos = new Map();
function repoFor(kind) {
  schemaFor(kind);
  if (!repos.has(kind)) repos.set(kind, createContentRepository(kind));
  return repos.get(kind);
}

function assertCan(actor, permission) {
  if (!hasPermission(actor, permission)) throw new ForbiddenError();
}

function blockToStorage(b) {
  const out = { ...b };
  if (b.refId) out.refId = toObjectId(b.refId);
  if (b.vocabIds) out.vocabIds = b.vocabIds.map(toObjectId);
  return out;
}

// Stored ids: convert validated id strings to ObjectIds before persisting.
export function toStorage(kind, data) {
  const out = { ...data };
  if (kind === COLLECTIONS.lessons) out.moduleId = toObjectId(data.moduleId);
  if (kind === COLLECTIONS.references) out.parentId = data.parentId ? toObjectId(data.parentId) : null;
  if (out.refs) out.refs = out.refs.map((r) => ({ ...r, referenceId: toObjectId(r.referenceId) }));
  if (out.blocks) out.blocks = out.blocks.map(blockToStorage);
  return out;
}

export async function createContent(actor, kind, input) {
  assertCan(actor, PERMISSIONS.contentWrite);
  const data = parseOrThrow(schemaFor(kind), input);
  const { sourceType, sourceReference, ...body } = data;
  const doc = { ...toStorage(kind, body), ...initialLifecycle({ sourceType, sourceReference, createdBy: toObjectId(actor.id) }) };
  const created = await repoFor(kind).insert(doc);
  logger.info("content_created", { kind, id: String(created._id), actor: actor.id });
  return serialize(created);
}

export async function updateContent(actor, kind, id, expectedVersion, input) {
  assertCan(actor, PERMISSIONS.contentWrite);
  const repo = repoFor(kind);
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError();
  const data = parseOrThrow(schemaFor(kind), input);
  const { sourceType, sourceReference, ...body } = data;
  const patch = editPatch(existing, { ...toStorage(kind, body), sourceType, sourceReference: sourceReference ?? null }, toObjectId(actor.id));
  const updated = await repo.updateIfVersion(id, expectedVersion, patch);
  logger.info("content_updated", { kind, id, version: updated.version, actor: actor.id });
  return serialize(updated);
}

// `options.approvalBasis` is set by trusted scripts only (never from request input).
export async function transitionReview(actor, kind, input, options = {}) {
  const { id, to } = parseOrThrow(reviewTransitionSchema, input);
  assertCan(actor, to === REVIEW_STATUS.draft ? PERMISSIONS.contentWrite : PERMISSIONS.contentReview);
  const repo = repoFor(kind);
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError();
  const patch = reviewTransitionPatch(existing, to, toObjectId(actor.id), new Date(), options);
  const updated = await repo.updateIfState(id, existing, patch);
  logger.info("content_review_transition", { kind, id, from: existing.reviewStatus, to, actor: actor.id, basis: patch.approvalBasis });
  return serialize(updated);
}

// --- Publish readiness ------------------------------------------------------------
// A lesson may only go live when everything it shows is live, and a listening exercise
// only when its audio has been generated. Learner reads also fail closed (see
// curriculumService), so later unpublishing a dependency hides the lesson instead of
// showing it broken.

export function lessonDependencies(lesson) {
  const exercises = [];
  const grammar = [];
  const vocabulary = [];
  for (const b of lesson.blocks ?? []) {
    if (b.type === "grammar") grammar.push(b.refId);
    else if (b.type === "vocabulary") vocabulary.push(...b.vocabIds);
    else if (EXERCISE_BLOCK_TYPES.includes(b.type)) exercises.push(b.refId);
  }
  return { exercises, grammar, vocabulary };
}

async function unpublishedDependencies(lesson) {
  const deps = lessonDependencies(lesson);
  const [ex, gr, vo] = await Promise.all([
    exerciseRepository.findManyByIds(deps.exercises, LEARNER_VISIBLE),
    grammarTopicRepository.findManyByIds(deps.grammar, LEARNER_VISIBLE),
    vocabularyRepository.findManyByIds(deps.vocabulary, LEARNER_VISIBLE),
  ]);
  const missing = (ids, found) => new Set(ids.map(String)).size - found.length;
  return { exercises: missing(deps.exercises, ex), grammar: missing(deps.grammar, gr), vocabulary: missing(deps.vocabulary, vo) };
}

async function assertPublishable(kind, doc) {
  if (kind === COLLECTIONS.lessons) {
    if (!doc.blocks?.length) throw new ConflictError("A lesson needs at least one block before it can be published.");
    const m = await unpublishedDependencies(doc);
    const parts = Object.entries(m)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${k === "grammar" ? "grammar topic(s)" : k === "exercises" ? "exercise(s)" : "vocabulary item(s)"}`);
    if (parts.length) throw new ConflictError(`Publish the lesson's content first: ${parts.join(", ")} not published.`);
  }
  if (kind === COLLECTIONS.exercises) {
    const missing = await findMissingAudio(requiredExerciseCues(doc));
    if (missing.length) {
      throw new ConflictError(`${missing.length} audio clip(s) have not been generated yet. Run the audio generation script first.`);
    }
    if (exerciseMaxScore(doc) === 0 && doc.skill !== "speaking") {
      throw new ConflictError("Only speaking practice may be ungraded.");
    }
  }
}

export async function setPublishStatus(actor, kind, input) {
  const { id, to } = parseOrThrow(publishTransitionSchema, input);
  assertCan(actor, PERMISSIONS.contentPublish);
  const repo = repoFor(kind);
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError();
  const patch = publishPatch(existing, to, toObjectId(actor.id));
  if (to === PUBLISH_STATUS.published) await assertPublishable(kind, existing);
  const updated = await repo.updateIfState(id, existing, patch);
  logger.info("content_publish_transition", { kind, id, from: existing.publishStatus, to, actor: actor.id });
  return serialize(updated);
}

// --- Admin reads -----------------------------------------------------------------

export async function listContentForAdmin(actor, kind, { page = 1, pageSize = 50 } = {}) {
  assertCan(actor, PERMISSIONS.contentReadDrafts);
  const result = await repoFor(kind).list({}, { page, pageSize });
  return { ...result, items: serialize(result.items) };
}

// Everything a reviewer needs to check one module: the module, its lessons and every
// item those lessons use, in any lifecycle state.
async function loadModuleTree(moduleId) {
  const mod = await moduleRepository.findById(moduleId);
  if (!mod) throw new NotFoundError();
  const { items: lessons } = await lessonRepository.list({ moduleId: mod._id }, { pageSize: 100 });
  const deps = { exercises: [], grammar: [], vocabulary: [] };
  for (const l of lessons) {
    const d = lessonDependencies(l);
    deps.exercises.push(...d.exercises);
    deps.grammar.push(...d.grammar);
    deps.vocabulary.push(...d.vocabulary);
  }
  const [exercises, grammarTopics, vocabulary] = await Promise.all([
    exerciseRepository.findManyByIds(deps.exercises),
    grammarTopicRepository.findManyByIds(deps.grammar),
    vocabularyRepository.findManyByIds(deps.vocabulary),
  ]);
  const order = (ids, docs) => {
    const pos = new Map([...new Set(ids.map(String))].map((id, i) => [id, i]));
    return docs.sort((a, b) => pos.get(String(a._id)) - pos.get(String(b._id)));
  };
  return {
    module: mod,
    lessons,
    exercises: order(deps.exercises, exercises),
    grammarTopics: order(deps.grammar, grammarTopics),
    vocabulary: order(deps.vocabulary, vocabulary),
  };
}

export async function getModuleReview(actor, moduleId) {
  assertCan(actor, PERMISSIONS.contentReadDrafts);
  const tree = await loadModuleTree(moduleId);
  const level = await levelRepository.findOne({ code: tree.module.levelCode });
  const exercises = await Promise.all(
    tree.exercises.map(async (ex) => ({
      ...ex,
      maxScore: exerciseMaxScore(ex),
      missingAudio: (await findMissingAudio(requiredExerciseCues(ex))).length,
    })),
  );
  return serialize({ level, ...tree, exercises, moduleVisible: isVisibleToLearners(tree.module) });
}

// --- Bulk module review ------------------------------------------------------------
// Applies ONE lifecycle step to every item of a module that is in the matching state,
// through the same per-item functions (permissions, allowed transitions, publish
// readiness). Nothing skips a step: drafts become "reviewed", never "approved".

export const BULK_ACTIONS = Object.freeze({
  review: { from: REVIEW_STATUS.draft, to: REVIEW_STATUS.reviewed },
  approve: { from: REVIEW_STATUS.reviewed, to: REVIEW_STATUS.approved },
  publish: { to: PUBLISH_STATUS.published },
});

export async function bulkModuleTransition(actor, moduleId, action, options = {}) {
  if (!Object.hasOwn(BULK_ACTIONS, action)) throw new ValidationError(`Unknown bulk action "${action}".`);
  assertCan(actor, action === "publish" ? PERMISSIONS.contentPublish : PERMISSIONS.contentReview);
  const tree = await loadModuleTree(moduleId);
  // Dependencies first, so lessons find their content already published.
  const items = [
    ...tree.grammarTopics.map((d) => [COLLECTIONS.grammarTopics, d]),
    ...tree.vocabulary.map((d) => [COLLECTIONS.vocabulary, d]),
    ...tree.exercises.map((d) => [COLLECTIONS.exercises, d]),
    ...tree.lessons.map((d) => [COLLECTIONS.lessons, d]),
    [COLLECTIONS.modules, tree.module],
  ];
  const step = BULK_ACTIONS[action];
  const result = { changed: 0, failed: [] };
  for (const [kind, doc] of items) {
    const eligible =
      action === "publish"
        ? doc.reviewStatus === REVIEW_STATUS.approved && doc.publishStatus !== PUBLISH_STATUS.published
        : doc.reviewStatus === step.from;
    if (!eligible) continue;
    try {
      const input = { id: String(doc._id), to: step.to };
      if (action === "publish") await setPublishStatus(actor, kind, input);
      else await transitionReview(actor, kind, input, options);
      result.changed++;
    } catch (err) {
      if (!isAppError(err)) throw err;
      result.failed.push({ kind, id: String(doc._id), slug: doc.slug ?? null, message: err.message });
    }
  }
  logger.info("content_bulk_transition", { moduleId: String(moduleId), action, changed: result.changed, failed: result.failed.length, actor: actor.id });
  return result;
}

// --- Learner reads (approved + published only) --------------------------------------

export async function listPublishedLevels() {
  const { items } = await levelRepository.list(LEARNER_VISIBLE, { pageSize: 10 });
  return serialize(items);
}

export async function listPublishedModules(code) {
  const { items } = await moduleRepository.list({ ...LEARNER_VISIBLE, levelCode: String(code) }, { pageSize: 100 });
  return serialize(items);
}
