import { serialize } from "@/lib/db/serialize";
import { AuthenticationError, NotFoundError } from "@/lib/errors";
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
import { createAudioResolver } from "@/lib/services/audioService";
import { exerciseCues, vocabularyCues, vocabDisplayForm } from "@/lib/audio/cues";
import { exerciseMaxScore, toClientExercise } from "@/lib/exercises/engine";
import { lessonCompletion, moduleCompletion, scopeMastery } from "@/lib/learning/progress";
import { resolveMastery } from "@/lib/content/mastery";

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

// Loads every learner-visible item used by the given lessons in three queries.
async function loadContentFor(lessons) {
  const deps = { exercises: [], grammar: [], vocabulary: [] };
  for (const l of lessons) {
    const d = lessonDependencies(l);
    deps.exercises.push(...d.exercises);
    deps.grammar.push(...d.grammar);
    deps.vocabulary.push(...d.vocabulary);
  }
  const [exercises, grammar, vocabulary] = await Promise.all([
    exerciseRepository.findManyByIds(deps.exercises, LEARNER_VISIBLE),
    grammarTopicRepository.findManyByIds(deps.grammar, LEARNER_VISIBLE),
    vocabularyRepository.findManyByIds(deps.vocabulary, LEARNER_VISIBLE),
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

function vocabCard(v, audio, state) {
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
    audio: audio(wordCue),
    exampleAudio: exampleCue ? audio(exampleCue) : null,
    review: state ? { box: state.box, dueAt: state.dueAt } : null,
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
  const header = {
    level: levelSummary(found.level),
    module: { id: String(found.module._id), slug: found.module.slug, title: found.module.title },
    lesson: {
      id: String(lesson._id),
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description ?? null,
      estimatedMinutes: lesson.estimatedMinutes ?? null,
    },
  };
  if (!isLessonAvailable(lesson, content)) return { ...header, available: false, blocks: [] };

  const progress = await progressRepo.findLessonProgress(actor.id, lesson._id);
  const d = lessonDependencies(lesson);
  const vocabStates = await userVocabRepo.findStates(actor.id, d.vocabulary);
  const stateById = new Map(vocabStates.map((s) => [String(s.vocabId), s]));

  const cues = [
    ...[...content.exercises.values()].flatMap(exerciseCues),
    ...[...content.vocabulary.values()].flatMap(vocabularyCues),
  ];
  const audio = await createAudioResolver(cues);
  const completion = lessonCompletion(lesson, progress);

  const blocks = lesson.blocks.map((b, i) => {
    const base = { key: b.key, type: b.type, title: b.title ?? null, done: completion.blocks[i].done };
    if (b.type === "intro") return { ...base, body: b.body };
    if (b.type === "grammar") {
      const g = content.grammar.get(String(b.refId));
      return { ...base, grammar: { title: g.title, summary: g.summary ?? null, sections: g.sections } };
    }
    if (b.type === "vocabulary") {
      return {
        ...base,
        cards: b.vocabIds.map((id) => vocabCard(content.vocabulary.get(String(id)), audio, stateById.get(String(id)))),
      };
    }
    const id = String(b.refId);
    const ex = content.exercises.get(id);
    const p = progress?.exercises?.[id];
    return {
      ...base,
      exercise: toClientExercise(ex, { exerciseId: id, audio }),
      stats: p ? { attempts: p.attempts, bestRatio: p.bestRatio ?? null, last: p.last ?? null } : null,
    };
  });

  const { items: siblings } = await lessonRepository.list({ moduleId: found.module._id, ...LEARNER_VISIBLE }, { pageSize: 100 });
  const idx = siblings.findIndex((s) => String(s._id) === String(lesson._id));
  const next = siblings[idx + 1] ?? null;

  return serialize({
    ...header,
    available: true,
    blocks,
    completion: { total: completion.total, done: completion.done, complete: completion.complete },
    completedAt: progress?.completedAt ?? null,
    nextLesson: next ? { slug: next.slug, title: next.title } : null,
  });
}
