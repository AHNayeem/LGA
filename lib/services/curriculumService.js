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
  LEARNER_VISIBLE,
} from "@/lib/repositories/contentRepository";
import * as progressRepo from "@/lib/repositories/progressRepository";
import * as userVocabRepo from "@/lib/repositories/userVocabularyRepository";
import { lessonDependencies } from "@/lib/services/contentService";
import { createExerciseAudioResolver } from "@/lib/services/audioService";
import { createImageResolver } from "@/lib/services/imageService";
import { contentImageIds } from "@/lib/media/imageRefs";
import { exerciseCues, vocabularyCues, vocabDisplayForm } from "@/lib/audio/cues";
import { exerciseMaxScore, toClientExercise } from "@/lib/exercises/engine";
import { lessonCompletion, moduleCompletion, scopeMastery } from "@/lib/learning/progress";
import { resolveMastery } from "@/lib/content/mastery";
import { getEnv } from "@/lib/config/env";
import { listOwnRecordings } from "@/lib/services/recordingReads";

// Learner-facing reads. Everything goes through the same visibility chain:
// level, module, lesson and every piece of content a lesson uses must be approved AND
// published. If anything in the chain is not, the lesson is unavailable (fail closed).

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

async function listVisibleLessons(moduleIds) {
  const { items } = await lessonRepository.list(
    { moduleId: { $in: moduleIds.map(toObjectId) }, ...LEARNER_VISIBLE },
    { pageSize: 100 },
  );
  return items;
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

// --- Module summaries (shared by dashboard, level and module pages) -------------------

function exerciseEntries(lessons, content, progressByLesson) {
  const seen = new Set();
  const entries = [];
  for (const lesson of lessons) {
    const p = progressByLesson.get(String(lesson._id));
    for (const b of lesson.blocks) {
      if (!EXERCISE_BLOCK_TYPES.includes(b.type)) continue;
      const id = String(b.refId);
      const ex = content.exercises.get(id);
      if (!ex || seen.has(id)) continue;
      seen.add(id);
      entries.push({ skill: ex.skill, maxScore: exerciseMaxScore(ex), last: p?.exercises?.[id]?.last ?? null });
    }
  }
  return entries;
}

async function summarizeModules(userId, level, modules) {
  if (modules.length === 0) return [];
  const lessons = await listVisibleLessons(modules.map((m) => m._id));
  const content = await loadContentFor(lessons);
  const available = lessons.filter((l) => isLessonAvailable(l, content));
  const progress = await progressRepo.listLessonProgress(userId, available.map((l) => l._id));
  const progressByLesson = new Map(progress.map((p) => [String(p.scopeId), p]));

  return modules.map((mod) => {
    const own = available.filter((l) => String(l.moduleId) === String(mod._id)).sort((a, b) => a.order - b.order);
    const lessonSummaries = own.map((l) => {
      const p = progressByLesson.get(String(l._id));
      return {
        id: String(l._id),
        slug: l.slug,
        title: l.title,
        description: l.description ?? null,
        order: l.order,
        estimatedMinutes: l.estimatedMinutes ?? null,
        completion: lessonCompletion(l, p),
        completedAt: p?.completedAt ?? null,
      };
    });
    const rules = resolveMastery(level.mastery, mod.mastery);
    const mastery = scopeMastery(rules, exerciseEntries(own, content, progressByLesson));
    const next = lessonSummaries.find((l) => !l.completion.complete) ?? null;
    return {
      module: serialize({
        id: mod._id,
        slug: mod.slug,
        levelCode: mod.levelCode,
        order: mod.order,
        title: mod.title,
        description: mod.description ?? null,
        goals: mod.goals ?? [],
        aiGenerated: mod.sourceType === "ai_generated",
      }),
      lessons: serialize(lessonSummaries),
      completion: moduleCompletion(lessonSummaries.map((l) => l.completion)),
      mastery,
      nextLesson: next ? { slug: next.slug, title: next.title } : null,
    };
  });
}

function levelSummary(level) {
  return { code: level.code, title: level.title, description: level.description ?? null };
}

export async function getLearnerLevel(actor, levelCode) {
  assertLearner(actor);
  const code = toLevelCode(levelCode);
  const level = await levelRepository.findOne({ code, ...LEARNER_VISIBLE });
  if (!level) throw new NotFoundError();
  const { items: modules } = await moduleRepository.list({ levelCode: code, ...LEARNER_VISIBLE }, { pageSize: 100 });
  return { level: levelSummary(level), modules: await summarizeModules(actor.id, level, modules) };
}

export async function getLearnerModule(actor, levelCode, moduleSlug) {
  assertLearner(actor);
  const found = await findVisibleModule(levelCode, moduleSlug);
  if (!found) throw new NotFoundError();
  const [summary] = await summarizeModules(actor.id, found.level, [found.module]);
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
  assertLearner(actor);
  const found = await findVisibleModule(levelParam, moduleParam);
  if (!found) throw new NotFoundError();
  const lessonSlug = parseParam(slugSchema, lessonParam);
  const lesson = await lessonRepository.findOne({ moduleId: found.module._id, slug: lessonSlug, ...LEARNER_VISIBLE });
  if (!lesson) throw new NotFoundError();

  const content = await loadContentFor([lesson]);
  const header = lessonHeader(found.level, found.module, lesson);
  if (!isLessonAvailable(lesson, content)) return { ...header, available: false, blocks: [] };

  const progress = await progressRepo.findLessonProgress(actor.id, lesson._id);
  const d = lessonDependencies(lesson);
  const vocabStates = await userVocabRepo.findStates(actor.id, d.vocabulary);
  const recordings = await listOwnRecordings(actor.id, speakingExerciseIds(content));
  const view = await buildLessonView({ module: found.module, lesson, content, progress, vocabStates, recordings });

  const { items: siblings } = await lessonRepository.list({ moduleId: found.module._id, ...LEARNER_VISIBLE }, { pageSize: 100 });
  const idx = siblings.findIndex((s) => String(s._id) === String(lesson._id));
  const next = siblings[idx + 1] ?? null;

  return serialize({
    ...header,
    available: true,
    ...view,
    completedAt: progress?.completedAt ?? null,
    nextLesson: next ? { slug: next.slug, title: next.title } : null,
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
  return serialize({ ...header, available: true, ...view, completedAt: null, nextLesson: null });
}
