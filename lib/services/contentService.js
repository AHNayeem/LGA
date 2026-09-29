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
  examSchema,
  reviewTransitionSchema,
  publishTransitionSchema,
  adminListQuerySchema,
  saveContentSchema,
  exerciseAudioMediaSchema,
  EDITABLE_KINDS,
  EXERCISE_BLOCK_TYPES,
} from "@/lib/validation/content";
import {
  contentFields,
  editPatch,
  initialLifecycle,
  isVisibleToLearners,
  publishPatch,
  removedFields,
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
  referenceRepository,
  examRepository,
  LEARNER_VISIBLE,
} from "@/lib/repositories/contentRepository";
import { exerciseAudioTargets, exerciseMediaIds } from "@/lib/audio/cues";
import { exerciseAudioStatus, exerciseAudioStatuses, isUsableCurriculumMedia, missingRequiredAudio } from "@/lib/services/audioService";
import { findCurriculumUploadsByIds } from "@/lib/repositories/mediaAssetRepository";
import { contentImageSummaries, unusableImageRefs } from "@/lib/services/imageService";
import { exerciseMaxScore } from "@/lib/exercises/engine";
import { logger } from "@/lib/logger";
import { contentLabel } from "@/lib/content/adminSections";
import { examExerciseIds, examReadiness } from "@/lib/exams/exam";

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
  [COLLECTIONS.exams]: examSchema,
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

// Exam definitions also need the exam permission (exam:configure).
function assertCanWrite(actor, kind) {
  assertCan(actor, PERMISSIONS.contentWrite);
  if (kind === COLLECTIONS.exams) assertCan(actor, PERMISSIONS.examConfigure);
}

function imageToStorage(image) {
  return image?.mediaId ? { ...image, mediaId: toObjectId(image.mediaId) } : image;
}

function blockToStorage(b) {
  const out = { ...b };
  if (b.image) out.image = imageToStorage(b.image);
  if (b.refId) out.refId = toObjectId(b.refId);
  if (b.vocabIds) out.vocabIds = b.vocabIds.map(toObjectId);
  return out;
}

function audioToStorage(audio) {
  return audio?.mediaId ? { ...audio, mediaId: toObjectId(audio.mediaId) } : audio;
}

// Stored ids: convert validated id strings to ObjectIds before persisting.
export function toStorage(kind, data) {
  const out = { ...data };
  if (kind === COLLECTIONS.exercises) {
    if (data.stimulus?.audio) out.stimulus = { ...data.stimulus, audio: audioToStorage(data.stimulus.audio) };
    if (data.stimulus?.image) out.stimulus = { ...out.stimulus, image: imageToStorage(data.stimulus.image) };
    out.items = data.items.map((i) => (i.audio ? { ...i, audio: audioToStorage(i.audio) } : i));
  }
  if (kind === COLLECTIONS.lessons) out.moduleId = toObjectId(data.moduleId);
  if (kind === COLLECTIONS.exams) out.sections = data.sections.map((sec) => ({ ...sec, exerciseIds: sec.exerciseIds.map(toObjectId) }));
  if (kind === COLLECTIONS.vocabulary && data.image) out.image = imageToStorage(data.image);
  if (kind === COLLECTIONS.references) out.parentId = data.parentId ? toObjectId(data.parentId) : null;
  if (out.refs) out.refs = out.refs.map((r) => ({ ...r, referenceId: toObjectId(r.referenceId) }));
  if (out.blocks) out.blocks = out.blocks.map(blockToStorage);
  return out;
}

// Relationships are checked on every write, whichever entry point calls it: a lesson must
// belong to an existing module, and each block must point at an existing item of the
// right collection. Referenced items may be in any lifecycle state; publishing checks
// that they are live.
async function assertRelations(kind, data, existing) {
  if (kind === COLLECTIONS.levels && existing && existing.code !== data.code) {
    throw new ValidationError("The level code can't be changed.", { code: ["The level code can't be changed once created."] });
  }
  await assertContentImages(kind, data);
  if (kind === COLLECTIONS.exercises) return assertExerciseMedia(data);
  if (kind === COLLECTIONS.exams) return assertExamExercises(data);
  if (kind !== COLLECTIONS.lessons) return;
  const fieldErrors = {};
  if (!(await moduleRepository.findById(data.moduleId))) fieldErrors.moduleId = ["Module not found"];
  const deps = lessonDependencies(data);
  const [ex, gr, vo] = await Promise.all([
    exerciseRepository.findManyByIds(deps.exercises),
    grammarTopicRepository.findManyByIds(deps.grammar),
    vocabularyRepository.findManyByIds(deps.vocabulary),
  ]);
  const ids = (docs) => new Set(docs.map((d) => String(d._id)));
  const found = { exercises: ids(ex), grammar: ids(gr), vocabulary: ids(vo) };
  data.blocks.forEach((b, i) => {
    if (b.type === "grammar" && !found.grammar.has(b.refId.toLowerCase())) {
      fieldErrors[`blocks.${i}.refId`] = ["Grammar topic not found"];
    } else if (EXERCISE_BLOCK_TYPES.includes(b.type) && !found.exercises.has(b.refId.toLowerCase())) {
      fieldErrors[`blocks.${i}.refId`] = ["Exercise not found"];
    } else if (b.type === "vocabulary") {
      const vocabIds = b.vocabIds.map((id) => id.toLowerCase());
      if (vocabIds.some((id) => !found.vocabulary.has(id))) fieldErrors[`blocks.${i}.vocabIds`] = ["Some words were not found"];
      else if (new Set(vocabIds).size !== vocabIds.length) fieldErrors[`blocks.${i}.vocabIds`] = ["A word appears twice in this block"];
    }
  });
  if (Object.keys(fieldErrors).length) throw new ValidationError("Some linked content does not exist.", fieldErrors);
}

// Every exercise an exam lists must exist (in any lifecycle state; publishing checks that
// they are live and scored automatically).
async function assertExamExercises(data) {
  const found = new Set((await exerciseRepository.findManyByIds(examExerciseIds(data))).map((d) => String(d._id)));
  const fieldErrors = {};
  data.sections.forEach((sec, i) => {
    if (sec.exerciseIds.some((id) => !found.has(id.toLowerCase()))) fieldErrors[`sections.${i}.exerciseIds`] = ["Some exercises were not found"];
  });
  if (Object.keys(fieldErrors).length) throw new ValidationError("Some linked content does not exist.", fieldErrors);
}

// Attached recordings must be active curriculum uploads (never a learner recording or a
// generated TTS asset, and not archived).
async function assertExerciseMedia(data) {
  const ids = exerciseMediaIds(data);
  if (ids.length === 0) return;
  const usable = new Set((await findCurriculumUploadsByIds(ids)).filter(isUsableCurriculumMedia).map((a) => String(a._id)));
  const fieldErrors = {};
  const bad = (id) => !usable.has(String(id).toLowerCase());
  const message = ["Choose an active recording from the media library"];
  if (data.stimulus?.audio?.mediaId && bad(data.stimulus.audio.mediaId)) fieldErrors["stimulus.audio.mediaId"] = message;
  data.items.forEach((item, i) => {
    if (item.audio?.mediaId && bad(item.audio.mediaId)) fieldErrors[`items.${i}.audio.mediaId`] = message;
  });
  if (Object.keys(fieldErrors).length) throw new ValidationError("Some attached audio can't be used.", fieldErrors);
}

// Attached images must be active curriculum images (not audio, not archived or deleted).
async function assertContentImages(kind, data) {
  const bad = await unusableImageRefs(kind, data);
  if (bad.length === 0) return;
  const fieldErrors = Object.fromEntries(bad.map((r) => [`${r.path}.mediaId`, ["Choose an active image from the media library"]]));
  throw new ValidationError("Some attached images can't be used.", fieldErrors);
}

export async function createContent(actor, kind, input) {
  assertCanWrite(actor, kind);
  const data = parseOrThrow(schemaFor(kind), input);
  await assertRelations(kind, data, null);
  const { sourceType, sourceReference, ...body } = data;
  const doc = { ...toStorage(kind, body), ...initialLifecycle({ sourceType, sourceReference, createdBy: toObjectId(actor.id) }) };
  const created = await repoFor(kind).insert(doc);
  logger.info("content_created", { kind, id: String(created._id), actor: actor.id });
  return serialize(created);
}

export async function updateContent(actor, kind, id, expectedVersion, input) {
  assertCanWrite(actor, kind);
  const repo = repoFor(kind);
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError();
  const data = parseOrThrow(schemaFor(kind), input);
  await assertRelations(kind, data, existing);
  const { sourceType, sourceReference, ...body } = data;
  const stored = toStorage(kind, body);
  // Optional fields the editor removed (e.g. a cleared description) are cleared too.
  const changes = { ...removedFields(existing, stored), ...stored, sourceType, sourceReference: sourceReference ?? null };
  const patch = editPatch(existing, changes, toObjectId(actor.id));
  const updated = await repo.updateIfVersion(id, expectedVersion, patch);
  logger.info("content_updated", { kind, id, version: updated.version, actor: actor.id });
  return serialize(updated);
}

// Admin editor entry point: create when there is no id, otherwise update the given
// version. Lifecycle fields in `data` are stripped by the schemas: new content is always a
// draft, and edits follow the normal edit rule (back to draft, unpublished).
export async function saveContent(actor, input) {
  assertCan(actor, PERMISSIONS.contentWrite);
  const { kind, id, version, data } = parseOrThrow(saveContentSchema, input);
  assertCanWrite(actor, kind);
  return id ? updateContent(actor, kind, id, version, data) : createContent(actor, kind, data);
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
  // Normally unreachable (images in use can't be archived or deleted), but learners must
  // never get content whose image silently disappeared at publication.
  const badImages = await unusableImageRefs(kind, doc);
  if (badImages.length) {
    throw new ConflictError(`${badImages.length} attached image(s) are no longer available. Choose another image or remove it first.`);
  }
  if (kind === COLLECTIONS.lessons) {
    if (!doc.blocks?.length) throw new ConflictError("A lesson needs at least one block before it can be published.");
    const m = await unpublishedDependencies(doc);
    const parts = Object.entries(m)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${n} ${k === "grammar" ? "grammar topic(s)" : k === "exercises" ? "exercise(s)" : "vocabulary item(s)"}`);
    if (parts.length) throw new ConflictError(`Publish the lesson's content first: ${parts.join(", ")} not published.`);
  }
  if (kind === COLLECTIONS.exercises) {
    // Playable means: an attached active recording, or generated TTS for every cue.
    const missing = await missingRequiredAudio(doc);
    if (missing.length) {
      throw new ConflictError(
        `${missing.length} audio clip(s) have no playable audio: attach a recording from the media library, or run the audio generation script.`,
      );
    }
    if (exerciseMaxScore(doc) === 0 && doc.skill !== "speaking") {
      throw new ConflictError("Only speaking practice may be ungraded.");
    }
  }
  if (kind === COLLECTIONS.exams) {
    const readiness = await examReadinessFor(doc);
    if (!readiness.ready) throw new ConflictError(`This exam can't be published yet: ${readiness.problems.join(" ")}`);
  }
}

// Publish readiness of an exam: questions exist, every exercise is published and every
// question is scored automatically.
async function examReadinessFor(exam) {
  const docs = await exerciseRepository.findManyByIds(examExerciseIds(exam));
  return examReadiness(exam, new Map(docs.map((d) => [String(d._id), d])), { isLive: isVisibleToLearners });
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

const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SEARCH_FIELDS = {
  [COLLECTIONS.levels]: ["code", "title.de", "title.en"],
  [COLLECTIONS.modules]: ["slug", "title.de", "title.en"],
  [COLLECTIONS.lessons]: ["slug", "title.de", "title.en"],
  [COLLECTIONS.references]: ["slug", "title"],
  [COLLECTIONS.vocabulary]: ["slug", "lemma", "plural", "meanings.en", "meanings.de", "meanings.bn"],
  [COLLECTIONS.grammarTopics]: ["slug", "title.de", "title.en"],
  [COLLECTIONS.exercises]: ["slug", "title.de", "title.en"],
  [COLLECTIONS.exams]: ["slug", "title.de", "title.en"],
};

const ADMIN_SORT = {
  [COLLECTIONS.modules]: { levelCode: 1, order: 1, _id: 1 },
  [COLLECTIONS.lessons]: { moduleId: 1, order: 1, _id: 1 },
  [COLLECTIONS.vocabulary]: { levelCode: 1, slug: 1, _id: 1 },
  [COLLECTIONS.grammarTopics]: { levelCode: 1, slug: 1, _id: 1 },
  [COLLECTIONS.exercises]: { levelCode: 1, slug: 1, _id: 1 },
  [COLLECTIONS.exams]: { levelCode: 1, order: 1, _id: 1 },
};

// Builds a Mongo filter from validated query values only (see adminListQuerySchema).
async function adminFilter(kind, query) {
  const and = [];
  if (query.q) {
    const rx = { $regex: escapeRegex(query.q), $options: "i" };
    and.push({ $or: SEARCH_FIELDS[kind].map((f) => ({ [f]: rx })) });
  }
  if (kind === COLLECTIONS.lessons) {
    if (query.moduleId) and.push({ moduleId: toObjectId(query.moduleId) });
    else if (query.level) {
      const { items } = await moduleRepository.list({ levelCode: query.level }, { pageSize: 100 });
      and.push({ moduleId: { $in: items.map((m) => m._id) } });
    }
  } else if (query.level) {
    and.push(kind === COLLECTIONS.levels ? { code: query.level } : { levelCode: query.level });
  }
  if (query.skill && kind === COLLECTIONS.exercises) and.push({ skill: query.skill });
  if (query.topic && kind === COLLECTIONS.vocabulary) and.push({ topics: query.topic });
  if (query.pos && kind === COLLECTIONS.vocabulary) and.push({ pos: query.pos });
  if (query.review) and.push({ reviewStatus: query.review });
  const publish = query.publish ?? "active";
  if (publish === "active") and.push({ publishStatus: { $ne: PUBLISH_STATUS.archived } });
  else if (publish !== "any") and.push({ publishStatus: publish });
  return and.length ? { $and: and } : {};
}

// `query`: search, filters and pagination (adminListQuerySchema). Invalid values are
// ignored. Archived content is hidden unless `publish` asks for it.
export async function listContentForAdmin(actor, kind, query = {}) {
  assertCan(actor, PERMISSIONS.contentReadDrafts);
  const repo = repoFor(kind);
  const q = adminListQuerySchema.parse(query);
  const result = await repo.list(await adminFilter(kind, q), { sort: ADMIN_SORT[kind], page: q.page ?? 1, pageSize: q.pageSize ?? 50 });
  const items = serialize(result.items);
  if (kind === COLLECTIONS.exercises) {
    // Audio source per exercise (native / TTS / missing), one batched lookup.
    const statuses = await exerciseAudioStatuses(result.items);
    items.forEach((it, i) => (it.audioStatus = { source: statuses[i].source, missing: statuses[i].missing }));
  }
  return { ...result, items, query: q };
}

// Compact view used by pickers, "used by" hints and the lesson composer.
function summarize(kind, doc) {
  return serialize({
    id: doc._id,
    kind,
    slug: doc.slug ?? doc.code ?? null,
    label: contentLabel(kind, doc),
    levelCode: doc.levelCode ?? doc.code ?? null,
    moduleId: doc.moduleId ?? null,
    skill: doc.skill ?? null,
    pos: doc.pos ?? null,
    meaning: doc.meanings?.en ?? null,
    reviewStatus: doc.reviewStatus,
    publishStatus: doc.publishStatus,
  });
}

const PICKABLE = [COLLECTIONS.vocabulary, COLLECTIONS.grammarTopics, COLLECTIONS.exercises];

export async function searchContentOptions(actor, kind, query = {}) {
  assertCan(actor, PERMISSIONS.contentReadDrafts);
  if (!PICKABLE.includes(kind)) throw new ValidationError(`Content type "${kind}" can't be picked.`);
  const q = adminListQuerySchema.parse(query);
  const { items, total } = await repoFor(kind).list(await adminFilter(kind, q), { sort: ADMIN_SORT[kind], pageSize: 20 });
  return { items: items.map((d) => summarize(kind, d)), total };
}

// Lessons that use an item (any lifecycle state), shown before archiving or editing.
async function lessonsUsing(kind, id) {
  const filter =
    kind === COLLECTIONS.vocabulary
      ? { "blocks.vocabIds": id }
      : kind === COLLECTIONS.grammarTopics
        ? { blocks: { $elemMatch: { type: "grammar", refId: id } } }
        : { blocks: { $elemMatch: { type: { $in: EXERCISE_BLOCK_TYPES }, refId: id } } };
  const { items } = await lessonRepository.list(filter, { pageSize: 100 });
  return items;
}

// One item for its edit page, plus what the page needs around it:
//   usedBy   words, grammar topics, exercises: the lessons using them
//   related  lessons: a summary of every item the blocks reference (any state)
//   checks   exercises: points, missing audio (publish readiness) and the audio source of
//            each listening target (attached recording / generated TTS / missing)
export async function getContentForAdmin(actor, kind, id) {
  assertCan(actor, PERMISSIONS.contentReadDrafts);
  const doc = await repoFor(kind).findById(id);
  if (!doc) throw new NotFoundError();
  // images: summaries of the attached images (editor previews and states), by id.
  const out = { item: serialize(doc), usedBy: [], related: {}, checks: null, images: await contentImageSummaries(kind, doc) };
  if ([COLLECTIONS.vocabulary, COLLECTIONS.grammarTopics, COLLECTIONS.exercises].includes(kind)) {
    out.usedBy = (await lessonsUsing(kind, doc._id)).map((l) => summarize(COLLECTIONS.lessons, l));
  }
  if (kind === COLLECTIONS.exercises) {
    const { items: exams } = await examRepository.list({ "sections.exerciseIds": doc._id }, { pageSize: 100 });
    out.usedByExams = exams.map((e) => summarize(COLLECTIONS.exams, e));
  }
  if (kind === COLLECTIONS.exams) {
    const exercises = await exerciseRepository.findManyByIds(examExerciseIds(doc));
    for (const ex of exercises) {
      out.related[String(ex._id)] = { ...summarize(COLLECTIONS.exercises, ex), questions: ex.items.length, maxScore: exerciseMaxScore(ex) };
    }
    out.checks = examReadiness(doc, new Map(exercises.map((d) => [String(d._id), d])), { isLive: isVisibleToLearners });
  }
  if (kind === COLLECTIONS.lessons) {
    const deps = lessonDependencies(doc);
    const [ex, gr, vo] = await Promise.all([
      exerciseRepository.findManyByIds(deps.exercises),
      grammarTopicRepository.findManyByIds(deps.grammar),
      vocabularyRepository.findManyByIds(deps.vocabulary),
    ]);
    const groups = [
      [COLLECTIONS.exercises, ex],
      [COLLECTIONS.grammarTopics, gr],
      [COLLECTIONS.vocabulary, vo],
    ];
    for (const [k, docs] of groups) for (const d of docs) out.related[String(d._id)] = summarize(k, d);
  }
  if (kind === COLLECTIONS.exercises) {
    const audio = await exerciseAudioStatus(doc);
    out.checks = { maxScore: exerciseMaxScore(doc), missingAudio: audio.missing, audio };
  }
  return out;
}

// --- Curriculum media attachments -------------------------------------------------------

// A stored document as content-schema input: ids as strings, and top-level fields an edit
// cleared (stored as null) left out, as the editors would send it.
function storedInput(doc) {
  const body = Object.fromEntries(Object.entries(serialize(contentFields(doc))).filter(([, v]) => v !== null));
  return { ...body, sourceType: doc.sourceType, ...(doc.sourceReference ? { sourceReference: doc.sourceReference } : {}) };
}

function audioTargetLabel(doc, target) {
  if (target === "stimulus") return `Listening passage (${doc.stimulus.audio.lines.length} line(s))`;
  const index = doc.items.findIndex((i) => i.id === target);
  const text = doc.items[index].audio.text;
  return `Question ${index + 1} (${target}): ${text.length > 60 ? `${text.slice(0, 57)}…` : text}`;
}

// Where a recording can be attached in one exercise, with each target's current source.
export async function listExerciseAudioTargets(actor, exerciseId) {
  assertCan(actor, PERMISSIONS.contentReadDrafts);
  const doc = await exerciseRepository.findById(exerciseId);
  if (!doc) throw new NotFoundError();
  const status = await exerciseAudioStatus(doc);
  return serialize({
    exercise: summarize(COLLECTIONS.exercises, doc),
    version: doc.version,
    source: status.source,
    targets: status.targets.map((t) => ({ ...t, label: audioTargetLabel(doc, t.target) })),
  });
}

// Attaches a recording to one listening target (or removes it: mediaId null). This is an
// ordinary edit through updateContent, so the payload is validated, the recording must be
// an active curriculum upload, the version must match, and reviewed/approved/published
// content returns to draft: what learners hear changes, so it is reviewed again.
// Removing an attachment never deletes the recording; the library shows it as unused.
export async function setExerciseAudioMedia(actor, input) {
  assertCan(actor, PERMISSIONS.contentWrite);
  assertCan(actor, PERMISSIONS.mediaManage);
  const { exerciseId, version, target, mediaId } = parseOrThrow(exerciseAudioMediaSchema, input);
  const existing = await exerciseRepository.findById(exerciseId);
  if (!existing) throw new NotFoundError();
  if (!exerciseAudioTargets(existing).some((t) => t.target === target)) {
    throw new ValidationError("This exercise has no listening audio there.", { target: ["Choose the listening passage or a question with audio"] });
  }
  const data = storedInput(existing);
  const withMedia = (audio) => {
    const { mediaId: _previous, ...cue } = audio;
    return mediaId ? { ...cue, mediaId } : cue;
  };
  if (target === "stimulus") data.stimulus = { ...data.stimulus, audio: withMedia(data.stimulus.audio) };
  else data.items = data.items.map((i) => (i.id === target ? { ...i, audio: withMedia(i.audio) } : i));
  const updated = await updateContent(actor, COLLECTIONS.exercises, exerciseId, version, data);
  logger.info("exercise_audio_media_set", { exerciseId, target, mediaId, actor: actor.id });
  return updated;
}

async function listAll(repo, sort) {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const r = await repo.list({}, { sort, page, pageSize: 100 });
    out.push(...r.items);
    if (out.length >= r.total || r.items.length === 0) break;
  }
  return out;
}

// Option lists for editor selects and list filters: levels, modules, reference metadata.
export async function listEditorOptions(actor) {
  assertCan(actor, PERMISSIONS.contentReadDrafts);
  const [levels, modules, references] = await Promise.all([
    listAll(levelRepository, { order: 1, _id: 1 }),
    listAll(moduleRepository, ADMIN_SORT[COLLECTIONS.modules]),
    listAll(referenceRepository, { parentId: 1, order: 1, _id: 1 }),
  ]);
  return serialize({
    levels: levels.map((l) => ({ code: l.code, label: contentLabel(COLLECTIONS.levels, l) })),
    modules: modules.map((m) => ({
      id: m._id,
      levelCode: m.levelCode,
      slug: m.slug,
      label: `${m.levelCode} · ${contentLabel(COLLECTIONS.modules, m)}`,
      publishStatus: m.publishStatus,
    })),
    references: references.map((r) => ({ id: r._id, kind: r.kind, label: r.title })),
  });
}

// Dashboard: per content type, how many items are in each review and publish state.
export async function getAdminOverview(actor) {
  assertCan(actor, PERMISSIONS.contentReadDrafts);
  const entries = await Promise.all(
    EDITABLE_KINDS.map(async (kind) => {
      const counts = { total: 0, draft: 0, reviewed: 0, approved: 0, unpublished: 0, published: 0, archived: 0 };
      for (const row of await repoFor(kind).countByStatus()) {
        counts.total += row.count;
        if (Object.hasOwn(counts, row.reviewStatus)) counts[row.reviewStatus] += row.count;
        if (Object.hasOwn(counts, row.publishStatus)) counts[row.publishStatus] += row.count;
      }
      return [kind, counts];
    }),
  );
  return Object.fromEntries(entries);
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
      missingAudio: (await missingRequiredAudio(ex)).length,
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

// --- Bulk exam review ----------------------------------------------------------------
// The same idea as bulkModuleTransition for an exam and the exercises it uses: one step,
// through the per-item functions, exercises before the exam.

export async function bulkExamTransition(actor, examId, action, options = {}) {
  if (!Object.hasOwn(BULK_ACTIONS, action)) throw new ValidationError(`Unknown bulk action "${action}".`);
  assertCan(actor, action === "publish" ? PERMISSIONS.contentPublish : PERMISSIONS.contentReview);
  assertCan(actor, PERMISSIONS.examConfigure);
  const exam = await examRepository.findById(examId);
  if (!exam) throw new NotFoundError();
  const exercises = await exerciseRepository.findManyByIds(examExerciseIds(exam));
  const items = [...exercises.map((d) => [COLLECTIONS.exercises, d]), [COLLECTIONS.exams, exam]];
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
  logger.info("content_bulk_exam_transition", { examId: String(examId), action, changed: result.changed, failed: result.failed.length, actor: actor.id });
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
