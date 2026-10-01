import { serialize } from "@/lib/db/serialize";
import { AuthenticationError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { isVisibleToLearners, PUBLISH_STATUS } from "@/lib/content/lifecycle";
import { levelCode as levelCodeSchema, slug as slugSchema, objectIdString, toObjectId } from "@/lib/validation/common";
import { EXERCISE_BLOCK_TYPES } from "@/lib/validation/content";
import {
  levelRepository,
  moduleRepository,
  lessonRepository,
  exerciseRepository,
  vocabularyRepository,
  grammarTopicRepository,
  referenceRepository,
  LEARNER_VISIBLE,
} from "@/lib/repositories/contentRepository";
import * as progressRepo from "@/lib/repositories/progressRepository";
import * as userVocabRepo from "@/lib/repositories/userVocabularyRepository";
import { lessonDependencies } from "@/lib/services/contentService";
import { createExerciseAudioResolver } from "@/lib/services/audioService";
import { createImageResolver } from "@/lib/services/imageService";
import { contentImageIds } from "@/lib/media/imageRefs";
import { exerciseCues, vocabularyCues, vocabDisplayForm } from "@/lib/audio/cues";
import { DEFAULT_PASS_THRESHOLD, exerciseMaxScore, toClientExercise } from "@/lib/exercises/engine";
import { lessonCompletion } from "@/lib/learning/progress";
import { learnerStateFromDocs } from "@/lib/learning/state";
import { summarizeModule } from "@/lib/learning/journey";
import { resolveMastery } from "@/lib/content/mastery";
import { getEnv } from "@/lib/config/env";
import { listOwnRecordings } from "@/lib/services/recordingReads";

// Learner-facing reads. Everything goes through the same visibility chain:
// level, module, lesson and every piece of content a lesson uses must be approved AND
// published. If anything in the chain is not, the lesson is unavailable (fail closed).
//
// Reads take `actor = null` for guests: they see the same published content with no
// learner state (a guest's progress lives in their browser, see lib/learning/state.js).
// Writes still require a signed-in learner (assertLearner).

export function assertLearner(actor) {
  if (!actor?.id) throw new AuthenticationError();
}

function parseParam(schema, value) {
  const r = schema.safeParse(value);
  if (!r.success) throw new NotFoundError();
  return r.data;
}

export function toLevelCode(param) {
  return parseParam(levelCodeSchema, String(param ?? "").toUpperCase());
}

// --- Visibility chain -------------------------------------------------------------

export async function findVisibleModule(levelCode, moduleSlug) {
  const code = toLevelCode(levelCode);
  const slug = parseParam(slugSchema, moduleSlug);
  const level = await levelRepository.findOne({ code, ...LEARNER_VISIBLE });
  if (!level) return null;
  const mod = await moduleRepository.findOne({ levelCode: code, slug, ...LEARNER_VISIBLE });
  return mod ? { level, module: mod } : null;
}

// By id (used for submissions: the client only sends ids).
export async function findVisibleLessonById(lessonId) {
  const id = parseParam(objectIdString, lessonId);
  const lesson = await lessonRepository.findOne({ _id: toObjectId(id), ...LEARNER_VISIBLE });
  if (!lesson) return null;
  const mod = await moduleRepository.findOne({ _id: lesson.moduleId, ...LEARNER_VISIBLE });
  if (!mod) return null;
  const level = await levelRepository.findOne({ code: mod.levelCode, ...LEARNER_VISIBLE });
  return level ? { level, module: mod, lesson } : null;
}

// Every visible lesson of these modules. A level can have more lessons than one page
// (A1 has 65, larger levels more), so this reads all pages.
async function listVisibleLessons(moduleIds) {
  const filter = { moduleId: { $in: moduleIds.map(toObjectId) }, ...LEARNER_VISIBLE };
  const all = [];
  for (let page = 1; ; page++) {
    const { items, total } = await lessonRepository.list(filter, { page, pageSize: 100 });
    all.push(...items);
    if (items.length === 0 || all.length >= total) return all;
  }
}

// Loads every item used by the given lessons in three queries. Learner reads keep the
// default (learner-visible only); the CMS preview passes {} to load any lifecycle state.
async function loadContentFor(lessons, filter = LEARNER_VISIBLE) {
  const deps = { exercises: [], grammar: [], vocabulary: [] };
  for (const l of lessons) {
    const d = lessonDependencies(l);
    deps.exercises.push(...d.exercises);
    deps.grammar.push(...d.grammar);
    deps.vocabulary.push(...d.vocabulary);
  }
  const [exercises, grammar, vocabulary] = await Promise.all([
    exerciseRepository.findManyByIds(deps.exercises, filter),
    grammarTopicRepository.findManyByIds(deps.grammar, filter),
    vocabularyRepository.findManyByIds(deps.vocabulary, filter),
  ]);
  const byId = (docs) => new Map(docs.map((d) => [String(d._id), d]));
  return { exercises: byId(exercises), grammar: byId(grammar), vocabulary: byId(vocabulary) };
}

export function isLessonAvailable(lesson, content) {
  const d = lessonDependencies(lesson);
  return (
    (lesson.blocks?.length ?? 0) > 0 &&
    d.exercises.every((id) => content.exercises.has(String(id))) &&
    d.grammar.every((id) => content.grammar.has(String(id))) &&
    d.vocabulary.every((id) => content.vocabulary.has(String(id)))
  );
}

// Used by learningService before accepting any write for a lesson.
export async function loadAvailableLesson(lessonId) {
  const chain = await findVisibleLessonById(lessonId);
  if (!chain) throw new NotFoundError();
  const content = await loadContentFor([chain.lesson]);
  if (!isLessonAvailable(chain.lesson, content)) throw new NotFoundError();
  return { ...chain, content };
}

// --- Level structure (shared by the dashboard, level, module, review and Goethe pages) --
// The published content of a level reduced to what the journey views need
// (lib/learning/journey.js). It holds no learner state, so it can be sent to a guest's
// browser, which computes the same views from its own state.

// Goethe exam parts: an exercise prepares a part when it references a child of an exam
// specification (e.g. goethe-start-deutsch-1-hoeren under goethe-start-deutsch-1). The key
// is the child's slug without the parent's prefix ("hoeren"). References hold structural
// metadata only (titles, minutes, parts, items).
async function goetheParts(exercises) {
  const refIds = [...new Set(exercises.flatMap((ex) => (ex.refs ?? []).map((r) => String(r.referenceId))))];
  const refs = (await referenceRepository.findManyByIds(refIds)).filter((r) => r.kind === "exam_spec" && r.parentId);
  const parents = new Map(
    (await referenceRepository.findManyByIds(refs.map((r) => r.parentId))).filter((p) => p.kind === "exam_spec").map((p) => [String(p._id), p]),
  );
  const partByRef = new Map();
  for (const r of refs) {
    const parent = parents.get(String(r.parentId));
    if (!parent || !r.slug.startsWith(`${parent.slug}-`)) continue;
    partByRef.set(String(r._id), {
      key: r.slug.slice(parent.slug.length + 1),
      title: r.title,
      order: r.order ?? 0,
      minutes: r.meta?.minutes ?? null,
      parts: r.meta?.parts ?? null,
      items: r.meta?.items ?? null,
      // What each Teil asks (meta.teil1, teil2 …; seed data from REFERENCE-ANALYSIS §1).
      teile: Object.keys(r.meta ?? {})
        .filter((k) => /^teil\d+$/.test(k) && typeof r.meta[k] === "string")
        .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))
        .map((k) => r.meta[k]),
    });
  }
  const byExercise = new Map();
  const sections = new Map();
  for (const ex of exercises) {
    const part = (ex.refs ?? []).map((r) => partByRef.get(String(r.referenceId))).find(Boolean);
    if (!part) continue;
    byExercise.set(String(ex._id), part.key);
    sections.set(part.key, part);
  }
  return { byExercise, sections: [...sections.values()].sort((a, b) => a.order - b.order).map(({ order, ...p }) => p) };
}

function lessonStructure(lesson, content) {
  return {
    id: String(lesson._id),
    slug: lesson.slug,
    order: lesson.order,
    title: lesson.title,
    description: lesson.description ?? null,
    estimatedMinutes: lesson.estimatedMinutes ?? null,
    blocks: lesson.blocks.map((b) => ({
      key: b.key,
      type: b.type,
      title: b.title ?? null,
      ...(b.refId ? { refId: String(b.refId) } : {}),
      ...(b.vocabIds ? { vocabIds: b.vocabIds.map(String) } : {}),
    })),
    grammar: lesson.blocks.filter((b) => b.type === "grammar").map((b) => content.grammar.get(String(b.refId))?.title).filter(Boolean),
  };
}

// Only available lessons (everything they use is live) are part of the structure.
export async function buildCurriculumStructure(level, modules) {
  const lessons = modules.length ? await listVisibleLessons(modules.map((m) => m._id)) : [];
  const content = await loadContentFor(lessons);
  const available = lessons.filter((l) => isLessonAvailable(l, content));
  const used = new Set(available.flatMap((l) => lessonDependencies(l).exercises.map(String)));
  const exercises = [...content.exercises.values()].filter((ex) => used.has(String(ex._id)));
  const goethe = await goetheParts(exercises);
  return {
    level: levelSummary(level),
    rules: resolveMastery(level.mastery),
    modules: [...modules]
      .sort((a, b) => a.order - b.order)
      .map((mod) => ({
        id: String(mod._id),
        slug: mod.slug,
        levelCode: mod.levelCode,
        order: mod.order,
        title: mod.title,
        description: mod.description ?? null,
        goals: mod.goals ?? [],
        aiGenerated: mod.sourceType === "ai_generated",
        rules: resolveMastery(level.mastery, mod.mastery),
        lessons: available
          .filter((l) => String(l.moduleId) === String(mod._id))
          .sort((a, b) => a.order - b.order)
          .map((l) => lessonStructure(l, content)),
      })),
    exercises: Object.fromEntries(
      exercises.map((ex) => [
        String(ex._id),
        {
          title: ex.title,
          skill: ex.skill,
          maxScore: exerciseMaxScore(ex),
          passThreshold: ex.passThreshold ?? DEFAULT_PASS_THRESHOLD,
          goethe: goethe.byExercise.get(String(ex._id)) ?? null,
        },
      ]),
    ),
    goethe: goethe.sections,
  };
}

export async function findVisibleLevel(levelCode) {
  const code = toLevelCode(levelCode);
  const level = await levelRepository.findOne({ code, ...LEARNER_VISIBLE });
  if (!level) return null;
  const { items: modules } = await moduleRepository.list({ levelCode: code, ...LEARNER_VISIBLE }, { pageSize: 100 });
  return { level, modules };
}

// The stored lesson progress of a signed-in learner for the lessons in a structure, as
// learner state. Guests have none on the server.
export async function lessonStateFor(actor, structure) {
  if (!actor?.id) return learnerStateFromDocs();
  const lessonIds = structure.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const progress = await progressRepo.listLessonProgress(actor.id, lessonIds);
  return learnerStateFromDocs({ progress: serialize(progress) });
}

async function summarizeModules(actor, level, modules) {
  if (modules.length === 0) return [];
  const structure = await buildCurriculumStructure(level, modules);
  const state = await lessonStateFor(actor, structure);
  return structure.modules.map((m) => summarizeModule(structure, m, state));
}

function levelSummary(level) {
  return { code: level.code, title: level.title, description: level.description ?? null };
}

export async function getLearnerLevel(actor, levelCode) {
  const found = await findVisibleLevel(levelCode);
  if (!found) throw new NotFoundError();
  return { level: levelSummary(found.level), modules: await summarizeModules(actor, found.level, found.modules) };
}

export async function getLearnerModule(actor, levelCode, moduleSlug) {
  const found = await findVisibleModule(levelCode, moduleSlug);
  if (!found) throw new NotFoundError();
  const [summary] = await summarizeModules(actor, found.level, [found.module]);
  return { level: levelSummary(found.level), ...summary };
}

// --- Lesson player -----------------------------------------------------------------

function vocabCard(v, audio, state, image) {
  const [wordCue, exampleCue] = vocabularyCues(v);
  return {
    id: String(v._id),
    display: vocabDisplayForm(v),
    lemma: v.lemma,
    article: v.article ?? null,
    plural: v.plural ?? null,
    pos: v.pos,
    meanings: v.meanings,
    example: v.example ?? null,
    notes: v.notes ?? null,
    image: v.image ? image(v.image) : null,
    audio: audio(wordCue),
    exampleAudio: exampleCue ? audio(exampleCue) : null,
    review: state ? { box: state.box, dueAt: state.dueAt } : null,
  };
}

function lessonHeader(level, mod, lesson) {
  return {
    level: levelSummary(level),
    module: { id: String(mod._id), slug: mod.slug, title: mod.title },
    lesson: {
      id: String(lesson._id),
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description ?? null,
      estimatedMinutes: lesson.estimatedMinutes ?? null,
    },
  };
}

function speakingExerciseIds(content) {
  return [...content.exercises.values()].filter((ex) => ex.items.some((i) => i.type === "speak_prompt")).map((ex) => ex._id);
}

// The lesson player view: blocks in lesson order with their content, audio sources and
// the learner's own state. Shared by the learner page and the CMS draft preview, which
// passes no learner state (nothing done, no stats, no review states, no recordings).
async function buildLessonView({ module: mod, lesson, content, progress = null, vocabStates = [], recordings = {} }) {
  const stateById = new Map(vocabStates.map((s) => [String(s.vocabId), s]));
  const cues = [
    ...[...content.exercises.values()].flatMap(exerciseCues),
    ...[...content.vocabulary.values()].flatMap(vocabularyCues),
  ];
  const audio = await createExerciseAudioResolver([...content.exercises.values()], cues);
  // Every image on the page in one lookup; unusable ones resolve to null (not shown).
  const image = await createImageResolver([
    ...contentImageIds("lessons", lesson),
    ...[...content.exercises.values()].flatMap((ex) => contentImageIds("exercises", ex)),
    ...[...content.vocabulary.values()].flatMap((v) => contentImageIds("vocabulary", v)),
  ]);
  const completion = lessonCompletion(lesson, progress);
  const speakingIds = new Set(speakingExerciseIds(content).map(String));
  const env = getEnv();
  const recordingLimits = { maxSeconds: env.RECORDING_MAX_SECONDS, maxBytes: env.MEDIA_MAX_UPLOAD_BYTES };

  const blocks = lesson.blocks.map((b, i) => {
    const base = { key: b.key, type: b.type, title: b.title ?? null, done: completion.blocks[i].done };
    if (b.type === "intro") return { ...base, body: b.body, image: b.image ? image(b.image) : null };
    if (b.type === "grammar") {
      const g = content.grammar.get(String(b.refId));
      return { ...base, grammar: { title: g.title, summary: g.summary ?? null, sections: g.sections } };
    }
    if (b.type === "vocabulary") {
      return {
        ...base,
        cards: b.vocabIds.map((id) => vocabCard(content.vocabulary.get(String(id)), audio, stateById.get(String(id)), image)),
      };
    }
    const id = String(b.refId);
    const ex = content.exercises.get(id);
    const p = progress?.exercises?.[id];
    return {
      ...base,
      exercise: toClientExercise(ex, { exerciseId: id, audio, image }),
      stats: p ? { attempts: p.attempts, bestRatio: p.bestRatio ?? null, last: p.last ?? null } : null,
      ...(speakingIds.has(id) ? { recordings: recordings[id] ?? {}, recordingLimits } : {}),
    };
  });

  return {
    // Learner disclosure: true when anything shown in this lesson was drafted with AI.
    aiGenerated: [mod, lesson, ...content.exercises.values(), ...content.grammar.values(), ...content.vocabulary.values()].some(
      (d) => d.sourceType === "ai_generated",
    ),
    blocks,
    completion: { total: completion.total, done: completion.done, complete: completion.complete },
  };
}

export async function getLearnerLesson(actor, { level: levelParam, module: moduleParam, lesson: lessonParam }) {
  const found = await findVisibleModule(levelParam, moduleParam);
  if (!found) throw new NotFoundError();
  const lessonSlug = parseParam(slugSchema, lessonParam);
  const lesson = await lessonRepository.findOne({ moduleId: found.module._id, slug: lessonSlug, ...LEARNER_VISIBLE });
  if (!lesson) throw new NotFoundError();

  const content = await loadContentFor([lesson]);
  const header = lessonHeader(found.level, found.module, lesson);
  if (!isLessonAvailable(lesson, content)) return { ...header, available: false, blocks: [] };

  // Guests get the fresh view (no state); their browser overlays its own progress.
  const signedIn = Boolean(actor?.id);
  const progress = signedIn ? await progressRepo.findLessonProgress(actor.id, lesson._id) : null;
  const d = lessonDependencies(lesson);
  const vocabStates = signedIn ? await userVocabRepo.findStates(actor.id, d.vocabulary) : [];
  const recordings = signedIn ? await listOwnRecordings(actor.id, speakingExerciseIds(content)) : {};
  const view = await buildLessonView({ module: found.module, lesson, content, progress, vocabStates, recordings });

  const next = await nextAvailableLesson(found.module, lesson);

  return serialize({
    ...header,
    available: true,
    ...view,
    completedAt: progress?.completedAt ?? null,
    nextLesson: next ? { slug: next.slug, title: next.title } : null,
    results: lessonResults(lesson, content, progress),
  });
}

// The next lesson of the module a learner can open: published AND with all its content
// live (the same rule as the module page), so "Next lesson" never leads to a lesson that
// says it isn't available. Lessons in between that aren't available are skipped.
async function nextAvailableLesson(mod, lesson) {
  const { items: siblings } = await lessonRepository.list({ moduleId: mod._id, ...LEARNER_VISIBLE }, { pageSize: 100 });
  const later = siblings.filter((s) => s.order > lesson.order || (s.order === lesson.order && String(s._id) > String(lesson._id)));
  if (later.length === 0) return null;
  const content = await loadContentFor(later);
  return later.find((l) => isLessonAvailable(l, content)) ?? null;
}

// Per exercise block: the learner's latest result, for the lesson result (score and what
// to practise again). The same fields as the learner state (lib/learning/state.js), so a
// guest's browser fills them in from its own state.
function lessonResults(lesson, content, progress) {
  return lesson.blocks
    .filter((b) => EXERCISE_BLOCK_TYPES.includes(b.type) && content.exercises.has(String(b.refId)))
    .map((b) => {
      const ex = content.exercises.get(String(b.refId));
      const p = progress?.exercises?.[String(b.refId)] ?? null;
      return {
        blockKey: b.key,
        exerciseId: String(b.refId),
        title: ex.title,
        skill: ex.skill,
        graded: exerciseMaxScore(ex) > 0,
        attempts: p?.attempts ?? 0,
        last: p?.last ?? null,
      };
    });
}

// --- CMS draft preview ----------------------------------------------------------------
// An authorised reviewer plays a lesson in any lifecycle state through the same view the
// learner gets after publication. Strictly read-only: no learner state is read or written
// (it is always a fresh, first-visit view), and nothing is persisted anywhere. The
// learner visibility chain above is untouched, so learner routes still 404 on drafts.

export function assertCanPreview(actor) {
  assertLearner(actor);
  if (!hasPermission(actor, PERMISSIONS.contentReadDrafts)) throw new ForbiddenError();
}

// The lesson, its module and level, and every item its blocks use, in any state.
export async function loadPreviewLesson(lessonId) {
  const id = parseParam(objectIdString, lessonId);
  const lesson = await lessonRepository.findById(id);
  if (!lesson) throw new NotFoundError();
  const mod = await moduleRepository.findById(lesson.moduleId);
  if (!mod) throw new NotFoundError();
  const level = await levelRepository.findOne({ code: mod.levelCode });
  const content = await loadContentFor([lesson], {});
  return { level, module: mod, lesson, content };
}

// What learners would see today, and why not: the chain and every linked item.
function previewStatus(level, mod, lesson, content) {
  const linked = [...content.exercises.values(), ...content.grammar.values(), ...content.vocabulary.values()];
  const notLive = linked.filter((d) => !isVisibleToLearners(d));
  return {
    reviewStatus: lesson.reviewStatus,
    publishStatus: lesson.publishStatus,
    version: lesson.version,
    linkedNotPublished: notLive.length,
    linkedArchived: notLive.filter((d) => d.publishStatus === PUBLISH_STATUS.archived).length,
    moduleVisible: isVisibleToLearners(mod),
    levelVisible: isVisibleToLearners(level),
    learnerVisible:
      isVisibleToLearners(level) && isVisibleToLearners(mod) && isVisibleToLearners(lesson) && notLive.length === 0 && isLessonAvailable(lesson, content),
  };
}

export async function getLessonPreview(actor, lessonId) {
  assertCanPreview(actor);
  const { level, module: mod, lesson, content } = await loadPreviewLesson(lessonId);
  const header = {
    ...lessonHeader(level ?? { code: mod.levelCode, title: null }, mod, lesson),
    preview: previewStatus(level, mod, lesson, content),
  };
  // Same rule as for learners: no blocks, or a referenced item that no longer exists.
  if (!isLessonAvailable(lesson, content)) return serialize({ ...header, available: false, blocks: [] });
  const view = await buildLessonView({ module: mod, lesson, content });
  return serialize({ ...header, available: true, ...view, completedAt: null, nextLesson: null, results: lessonResults(lesson, content, null) });
}
