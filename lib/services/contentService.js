import { COLLECTIONS } from "@/lib/db/collections";
import { serialize } from "@/lib/db/serialize";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { parseOrThrow, toObjectId } from "@/lib/validation/common";
import { levelSchema, moduleSchema, lessonSchema, referenceSchema, reviewTransitionSchema, publishTransitionSchema } from "@/lib/validation/content";
import { editPatch, initialLifecycle, publishPatch, reviewTransitionPatch, REVIEW_STATUS } from "@/lib/content/lifecycle";
import { createContentRepository, levelRepository, moduleRepository, LEARNER_VISIBLE } from "@/lib/repositories/contentRepository";
import { logger } from "@/lib/logger";

// Services receive the acting user and enforce permissions themselves, so authorisation
// holds no matter which entry point (Server Action, route handler, script) calls them.

const SCHEMAS = {
  [COLLECTIONS.levels]: levelSchema,
  [COLLECTIONS.modules]: moduleSchema,
  [COLLECTIONS.lessons]: lessonSchema,
  [COLLECTIONS.references]: referenceSchema,
};

function schemaFor(kind) {
  if (!Object.hasOwn(SCHEMAS, kind)) throw new ValidationError(`Unknown content type "${kind}".`);
  return SCHEMAS[kind];
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

// Stored ids: convert validated id strings to ObjectIds before persisting.
function toStorage(kind, data) {
  const out = { ...data };
  if (kind === COLLECTIONS.lessons) out.moduleId = toObjectId(data.moduleId);
  if (kind === COLLECTIONS.references) out.parentId = data.parentId ? toObjectId(data.parentId) : null;
  if (out.refs) out.refs = out.refs.map((r) => ({ ...r, referenceId: toObjectId(r.referenceId) }));
  if (out.blocks) out.blocks = out.blocks.map((b) => ({ ...b, refId: b.refId ? toObjectId(b.refId) : undefined }));
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

export async function transitionReview(actor, kind, input) {
  const { id, to } = parseOrThrow(reviewTransitionSchema, input);
  assertCan(actor, to === REVIEW_STATUS.draft ? PERMISSIONS.contentWrite : PERMISSIONS.contentReview);
  const repo = repoFor(kind);
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError();
  const patch = reviewTransitionPatch(existing, to, toObjectId(actor.id));
  const updated = await repo.updateIfState(id, existing, patch);
  logger.info("content_review_transition", { kind, id, from: existing.reviewStatus, to, actor: actor.id });
  return serialize(updated);
}

export async function setPublishStatus(actor, kind, input) {
  const { id, to } = parseOrThrow(publishTransitionSchema, input);
  assertCan(actor, PERMISSIONS.contentPublish);
  const repo = repoFor(kind);
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError();
  const patch = publishPatch(existing, to, toObjectId(actor.id));
  const updated = await repo.updateIfState(id, existing, patch);
  logger.info("content_publish_transition", { kind, id, from: existing.publishStatus, to, actor: actor.id });
  return serialize(updated);
}

// --- Reads ---

export async function listContentForAdmin(actor, kind, { page = 1, pageSize = 50 } = {}) {
  assertCan(actor, PERMISSIONS.contentReadDrafts);
  const result = await repoFor(kind).list({}, { page, pageSize });
  return { ...result, items: serialize(result.items) };
}

// Learners only ever see approved + published content.
export async function listPublishedLevels() {
  const { items } = await levelRepository.list(LEARNER_VISIBLE, { pageSize: 10 });
  return serialize(items);
}

export async function listPublishedModules(code) {
  const { items } = await moduleRepository.list({ ...LEARNER_VISIBLE, levelCode: String(code) }, { pageSize: 100 });
  return serialize(items);
}
