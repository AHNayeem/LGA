import { z } from "zod";
import { serialize } from "@/lib/db/serialize";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { objectIdString, parseOrThrow, slug, toObjectId } from "@/lib/validation/common";
import { EXERCISE_BLOCK_TYPES } from "@/lib/validation/content";
import { answersSchema, gradeExercise, revealExercise } from "@/lib/exercises/engine";
import { exerciseCues, vocabularyCues, vocabDisplayForm } from "@/lib/audio/cues";
import { lessonCompletion, isBlockDone } from "@/lib/learning/progress";
import { REVIEW_RESULTS, reviewCard } from "@/lib/learning/srs";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { GUEST_RATE_LIMITS } from "@/lib/security/guestRateLimit";
import { vocabularyRepository, LEARNER_VISIBLE } from "@/lib/repositories/contentRepository";
import * as attemptRepo from "@/lib/repositories/attemptRepository";
import * as progressRepo from "@/lib/repositories/progressRepository";
import * as userVocabRepo from "@/lib/repositories/userVocabularyRepository";
import { assertCanPreview, assertLearner, loadAvailableLesson, loadPreviewLesson } from "@/lib/services/curriculumService";
import { getLevelStructure, getStartLevelCode, listPublishedLevels, loadLearnerState } from "@/lib/services/journeyService";
import { dueVocabulary, levelOverview } from "@/lib/learning/journey";
import { createAudioResolver, createExerciseAudioResolver } from "@/lib/services/audioService";
import { createImageResolver } from "@/lib/services/imageService";
import { contentImageIds } from "@/lib/media/imageRefs";
import { attachRecordings, claimRecordingsForSubmission } from "@/lib/services/recordingService";
import { logger } from "@/lib/logger";

// Learner writes. Every write re-checks that the lesson and its content are live, and
// every result is computed on the server: the client only sends ids and raw answers.

const submitSchema = z.object({
  lessonId: objectIdString,
  exerciseId: objectIdString,
  answers: answersSchema,
});

async function finishIfComplete(userId, lesson, progress) {
  const completion = lessonCompletion(lesson, progress);
  if (completion.complete && !progress.completedAt) {
    progress = await progressRepo.markLessonCompleted(userId, lesson._id);
  }
  return { completion, completedAt: progress.completedAt ?? null };
}

export async function submitExerciseAttempt(actor, input) {
  assertLearner(actor);
  const { lessonId, exerciseId, answers } = parseOrThrow(submitSchema, input, "Invalid submission.");
  await enforceRateLimit(RATE_LIMITS.learningByUser, actor.id);

  const { level, module: mod, lesson, content } = await loadAvailableLesson(lessonId);
  const block = lesson.blocks.find((b) => EXERCISE_BLOCK_TYPES.includes(b.type) && String(b.refId) === exerciseId);
  const exercise = block && content.exercises.get(exerciseId);
  if (!exercise) throw new NotFoundError();

  // Recording ids are validated before anything is stored (ownership + exercise item).
  const claims = await claimRecordingsForSubmission(actor, exercise, answers);
  const result = gradeExercise(exercise, answers, { exerciseId });
  const now = new Date();
  const attempt = await attemptRepo.insertAttempt({
    userId: toObjectId(actor.id),
    exerciseId: exercise._id,
    exerciseVersion: exercise.version,
    lessonId: lesson._id,
    moduleId: mod._id,
    levelCode: level.code,
    blockKey: block.key,
    skill: exercise.skill,
    items: result.items,
    answers: sanitizedAnswers(exercise, answers),
    score: result.score,
    maxScore: result.maxScore,
    ratio: result.ratio,
    graded: result.graded,
    passed: result.passed,
    createdAt: now,
  });
  const progress = await progressRepo.recordExerciseResult({
    userId: actor.id,
    lessonId: lesson._id,
    moduleId: mod._id,
    levelCode: level.code,
    exerciseId,
    skill: exercise.skill,
    result,
    now,
  });
  const recordings = claims.length ? await attachRecordings(actor, { exerciseId: exercise._id, attemptId: attempt._id, claims }) : {};
  const { completion, completedAt } = await finishIfComplete(actor.id, lesson, progress);
  logger.info("exercise_attempt", { userId: actor.id, exerciseId, score: result.score, maxScore: result.maxScore, passed: result.passed });

  const audio = await createExerciseAudioResolver([exercise], exerciseCues(exercise));
  return serialize({
    attemptId: attempt._id,
    result,
    reveal: revealExercise(exercise, { exerciseId, audio }),
    recordings,
    stats: progress.exercises[exerciseId],
    blockDone: isBlockDone(block, progress),
    lesson: { done: completion.done, total: completion.total, complete: completion.complete, completedAt },
  });
}

// CMS draft preview: the same server-side grading and reveal as a real submission, for a
// lesson in any lifecycle state, without persisting anything. No attempt, progress,
// completion, recording claim, rate-limit counter or attempt log is written, so the
// response is always a first attempt on a fresh lesson.
export async function previewExerciseAttempt(actor, input) {
  assertCanPreview(actor);
  const { lessonId, exerciseId, answers } = parseOrThrow(submitSchema, input, "Invalid submission.");
  const { lesson, content } = await loadPreviewLesson(lessonId);
  const block = lesson.blocks.find((b) => EXERCISE_BLOCK_TYPES.includes(b.type) && String(b.refId) === exerciseId);
  const exercise = block && content.exercises.get(exerciseId);
  if (!exercise) throw new NotFoundError();

  const result = gradeExercise(exercise, answers, { exerciseId });
  const audio = await createExerciseAudioResolver([exercise], exerciseCues(exercise));
  const total = lesson.blocks.length;
  return serialize({
    attemptId: null,
    preview: true,
    result,
    reveal: revealExercise(exercise, { exerciseId, audio }),
    recordings: {},
    stats: null,
    blockDone: result.passed,
    lesson: { done: 0, total, complete: false, completedAt: null },
  });
}

// Guests (no account): the same server-side grading and reveal as a signed-in
// submission, on published content only (the same visibility chain), without storing
// anything. No attempt, progress, completion, recording or log line is written; the only
// write is the per-IP rate-limit counter. The guest's browser keeps the result in its own
// state (lib/learning/state.js); nothing the browser keeps is ever read back here.
export async function gradeExerciseAsGuest({ ip }, input) {
  const { lessonId, exerciseId, answers } = parseOrThrow(submitSchema, input, "Invalid submission.");
  await enforceRateLimit(GUEST_RATE_LIMITS.learningByIp, ip);
  const { lesson, content } = await loadAvailableLesson(lessonId);
  const block = lesson.blocks.find((b) => EXERCISE_BLOCK_TYPES.includes(b.type) && String(b.refId) === exerciseId);
  const exercise = block && content.exercises.get(exerciseId);
  if (!exercise) throw new NotFoundError();

  const result = gradeExercise(exercise, answers, { exerciseId });
  const audio = await createExerciseAudioResolver([exercise], exerciseCues(exercise));
  return serialize({
    attemptId: null,
    guest: true,
    skill: exercise.skill,
    result,
    reveal: revealExercise(exercise, { exerciseId, audio }),
    recordings: {},
    stats: null,
    blockDone: result.passed,
    lesson: { done: 0, total: lesson.blocks.length, complete: false, completedAt: null },
  });
}

// Keep only answers for known items, as submitted, so stored attempts are bounded and
// can be re-graded later. Unknown keys are dropped.
function sanitizedAnswers(exercise, answers) {
  const out = {};
  for (const item of exercise.items) {
    if (Object.hasOwn(answers, item.id)) out[item.id] = answers[item.id];
  }
  return JSON.parse(JSON.stringify(out));
}

const blockSchema = z.object({ lessonId: objectIdString, blockKey: slug });

// Intro and grammar blocks are completed by reading them; a vocabulary block only once
// every card has been rated at least once. Exercise blocks can't be marked done here.
export async function completeContentBlock(actor, input) {
  assertLearner(actor);
  const { lessonId, blockKey } = parseOrThrow(blockSchema, input, "Invalid request.");
  await enforceRateLimit(RATE_LIMITS.learningByUser, actor.id);
  const { level, module: mod, lesson } = await loadAvailableLesson(lessonId);
  const block = lesson.blocks.find((b) => b.key === blockKey);
  if (!block) throw new NotFoundError();
  if (EXERCISE_BLOCK_TYPES.includes(block.type)) {
    throw new ConflictError("Exercises are completed by submitting answers.");
  }
  if (block.type === "vocabulary") {
    const states = await userVocabRepo.findStates(actor.id, block.vocabIds);
    if (states.length < new Set(block.vocabIds.map(String)).size) {
      throw new ConflictError("Go through every word card first.");
    }
  }
  const progress = await progressRepo.markBlockDone({
    userId: actor.id,
    lessonId: lesson._id,
    moduleId: mod._id,
    levelCode: level.code,
    blockKey,
  });
  const { completion, completedAt } = await finishIfComplete(actor.id, lesson, progress);
  return serialize({ blockKey, lesson: { done: completion.done, total: completion.total, complete: completion.complete, completedAt } });
}

// --- Vocabulary review ------------------------------------------------------------

const reviewSchema = z.object({ vocabId: objectIdString, result: z.enum(REVIEW_RESULTS) });

export async function reviewVocabulary(actor, input) {
  assertLearner(actor);
  const { vocabId, result } = parseOrThrow(reviewSchema, input, "Invalid request.");
  await enforceRateLimit(RATE_LIMITS.learningByUser, actor.id);
  const vocab = await vocabularyRepository.findOne({ _id: toObjectId(vocabId), ...LEARNER_VISIBLE });
  if (!vocab) throw new NotFoundError();
  const now = new Date();
  const current = await userVocabRepo.findState(actor.id, vocabId);
  const next = reviewCard(current, result, now);
  const saved = await userVocabRepo.saveState(actor.id, vocabId, { ...next, levelCode: vocab.levelCode }, now);
  return serialize({ vocabId, box: saved.box, dueAt: saved.dueAt, reps: saved.reps, lapses: saved.lapses });
}

export async function getReviewQueue(actor, { limit = 20 } = {}) {
  assertLearner(actor);
  const now = new Date();
  const due = await userVocabRepo.listDue(actor.id, now, 200);
  // Only words that are still live; unpublished words silently leave the queue.
  const vocab = await vocabularyRepository.findManyByIds(
    due.map((d) => d.vocabId),
    LEARNER_VISIBLE,
  );
  const byId = new Map(vocab.map((v) => [String(v._id), v]));
  const live = due.filter((d) => byId.has(String(d.vocabId)));
  const cards = live.slice(0, Math.min(limit, 50)).map((d) => byId.get(String(d.vocabId)));
  const stateById = new Map(live.map((d) => [String(d.vocabId), d]));
  return serialize({ dueCount: live.length, cards: await reviewCards(cards, stateById) });
}

// Flashcards for the review deck, with audio and images resolved.
async function reviewCards(words, stateById = new Map()) {
  const audio = await createAudioResolver(words.flatMap(vocabularyCues));
  const image = await createImageResolver(words.flatMap((v) => contentImageIds("vocabulary", v)));
  return words.map((v) => {
    const state = stateById.get(String(v._id));
    const [wordCue, exampleCue] = vocabularyCues(v);
    return {
      id: v._id,
      display: vocabDisplayForm(v),
      plural: v.plural ?? null,
      pos: v.pos,
      meanings: v.meanings,
      example: v.example ?? null,
      image: v.image ? image(v.image) : null,
      audio: audio(wordCue),
      exampleAudio: exampleCue ? audio(exampleCue) : null,
      review: state ? { box: state.box, dueAt: state.dueAt } : null,
    };
  });
}

const cardsSchema = z.object({ vocabIds: z.array(objectIdString).min(1).max(50) });

// Guests: the flashcards for the words their browser says are due (their review state
// lives there). Published words only, in the requested order; unknown ids are dropped.
export async function getVocabularyCardsAsGuest({ ip }, input) {
  const { vocabIds } = parseOrThrow(cardsSchema, input, "Invalid request.");
  await enforceRateLimit(GUEST_RATE_LIMITS.learningByIp, ip);
  const words = await vocabularyRepository.findManyByIds(vocabIds, LEARNER_VISIBLE);
  const byId = new Map(words.map((v) => [String(v._id), v]));
  const ordered = [...new Set(vocabIds)].map((id) => byId.get(id)).filter(Boolean);
  return serialize({ cards: await reviewCards(ordered) });
}

// --- Dashboard -----------------------------------------------------------------------

// A signed-in learner's summary of the start level, from the journey views (the same
// calculations as the dashboard page, lib/learning/journey.js).
export async function getLearnerDashboard(actor) {
  assertLearner(actor);
  const [levels, code] = await Promise.all([listPublishedLevels(), getStartLevelCode()]);
  if (!code) return { levels, current: null, continueAt: null, reviewDue: 0 };
  const structure = await getLevelStructure(code);
  const state = await loadLearnerState(actor, structure);
  const overview = levelOverview(structure, state);
  const c = overview.continueAt;
  return {
    levels,
    current: { level: overview.level, modules: overview.modules },
    continueAt: c ? { levelCode: structure.level.code, module: c.module, lesson: { slug: c.lesson.slug, title: c.lesson.title } } : null,
    reviewDue: dueVocabulary(structure, state).count,
  };
}
