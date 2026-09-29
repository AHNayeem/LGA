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
import { levelRepository, vocabularyRepository, LEARNER_VISIBLE } from "@/lib/repositories/contentRepository";
import * as attemptRepo from "@/lib/repositories/attemptRepository";
import * as progressRepo from "@/lib/repositories/progressRepository";
import * as userVocabRepo from "@/lib/repositories/userVocabularyRepository";
import { assertLearner, getLearnerLevel, loadAvailableLesson } from "@/lib/services/curriculumService";
import { createAudioResolver } from "@/lib/services/audioService";
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

  const audio = await createAudioResolver(exerciseCues(exercise));
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
  const audio = await createAudioResolver(cards.flatMap(vocabularyCues));
  return serialize({
    dueCount: live.length,
    cards: cards.map((v) => {
      const state = live.find((d) => String(d.vocabId) === String(v._id));
      const [wordCue, exampleCue] = vocabularyCues(v);
      return {
        id: v._id,
        display: vocabDisplayForm(v),
        plural: v.plural ?? null,
        pos: v.pos,
        meanings: v.meanings,
        example: v.example ?? null,
        audio: audio(wordCue),
        exampleAudio: exampleCue ? audio(exampleCue) : null,
        review: { box: state.box, dueAt: state.dueAt },
      };
    }),
  });
}

// --- Dashboard -----------------------------------------------------------------------

export async function getLearnerDashboard(actor) {
  assertLearner(actor);
  const { items: levels } = await levelRepository.list(LEARNER_VISIBLE, { pageSize: 10 });
  const current = levels[0] ?? null; // lowest published level (A1 first)
  const [levelView, review] = await Promise.all([
    current ? getLearnerLevel(actor, current.code) : null,
    getReviewQueue(actor, { limit: 1 }),
  ]);
  let continueAt = null;
  if (levelView) {
    const mod = levelView.modules.find((m) => m.nextLesson);
    if (mod) continueAt = { levelCode: levelView.level.code, module: mod.module, lesson: mod.nextLesson };
  }
  return serialize({
    levels: levels.map((l) => ({ code: l.code, title: l.title })),
    current: levelView,
    continueAt,
    reviewDue: review.dueCount,
  });
}
