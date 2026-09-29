import { contentFields } from "@/lib/content/lifecycle";
import { itemType } from "@/lib/exercises/types";
import { exerciseMaxScore, toClientExercise } from "@/lib/exercises/engine";

// Exam structure: pure functions shared by the exam service, the CMS and tests.
//
// An exam definition (`exams` collection) lists sections of exercise ids. Its questions are
// the items of those exercises. When a learner starts an attempt, the exam and every
// exercise are frozen into a snapshot on the attempt, so later edits can never change how
// an open or finished attempt is graded or reviewed.

export const NO_AUDIO = () => null;
export const NO_IMAGE = () => null;

export function examExerciseIds(exam) {
  return (exam.sections ?? []).flatMap((s) => s.exerciseIds ?? []).map(String);
}

// Every item of an exam question must be scored automatically. Speaking practice has no
// reliable automated evaluation, so it can't be part of an exam (see docs/EXAMS.md).
export function ungradedItems(exercise) {
  return (exercise.items ?? []).filter((i) => !itemType(i.type).graded).map((i) => i.id);
}

// What stops an exam from being published (and what the CMS shows while authoring).
// `exercisesById`: the referenced exercises in any lifecycle state; `isLive(doc)` says
// whether an exercise is approved and published.
export function examReadiness(exam, exercisesById, { isLive = () => true } = {}) {
  const ids = examExerciseIds(exam);
  const found = ids.map((id) => exercisesById.get(id)).filter(Boolean);
  const questionCount = found.reduce((n, ex) => n + ex.items.length, 0);
  const problems = [];
  const missing = ids.length - found.length;
  const unpublished = found.filter((ex) => !isLive(ex)).length;
  const ungraded = found.filter((ex) => ungradedItems(ex).length > 0);
  const emptySections = (exam.sections ?? []).filter((s) => (s.exerciseIds ?? []).length === 0).length;
  if (ids.length === 0) problems.push("Add at least one exercise.");
  if (emptySections > 0) problems.push(`${emptySections} section(s) have no exercises.`);
  if (missing > 0) problems.push(`${missing} exercise(s) no longer exist.`);
  if (unpublished > 0) problems.push(`${unpublished} exercise(s) are not published.`);
  if (ungraded.length > 0) {
    problems.push(`${ungraded.length} exercise(s) contain questions that can't be scored automatically (speaking practice).`);
  }
  return {
    exercises: ids.length,
    questionCount,
    maxScore: found.reduce((n, ex) => n + exerciseMaxScore(ex), 0),
    missing,
    unpublished,
    ungraded: ungraded.map((ex) => String(ex._id)),
    problems,
    ready: problems.length === 0,
  };
}

// Frozen copy of the exam and its exercises (bodies only, plus id and version).
// `exercisesById` must contain every referenced exercise.
export function buildExamSnapshot(exam, exercisesById) {
  const docs = [exam];
  const sections = exam.sections.map((s) => ({
    key: s.key,
    title: s.title,
    instructions: s.instructions ?? null,
    exercises: s.exerciseIds.map((id) => {
      const ex = exercisesById.get(String(id));
      if (!ex) throw new Error(`Exam exercise ${id} is missing`);
      docs.push(ex);
      return { ...contentFields(ex), _id: ex._id, version: ex.version };
    }),
  }));
  return {
    examId: exam._id,
    version: exam.version,
    levelCode: exam.levelCode,
    slug: exam.slug,
    title: exam.title,
    description: exam.description ?? null,
    instructions: exam.instructions ?? null,
    durationMinutes: exam.durationMinutes ?? null,
    passThreshold: exam.passThreshold,
    reviewPolicy: exam.reviewPolicy,
    aiGenerated: docs.some((d) => d.sourceType === "ai_generated"),
    sections,
  };
}

export function snapshotExercises(snapshot) {
  return snapshot.sections.flatMap((s) => s.exercises);
}

export function snapshotQuestionCount(snapshot) {
  return snapshotExercises(snapshot).reduce((n, ex) => n + ex.items.length, 0);
}

// Learner payload while the exam is running: no answer keys (toClientExercise), and in
// exam mode no transcript before submission, whatever the exercise's own policy says.
// Questions are numbered continuously across the exam.
export function toClientExam(snapshot, { seedPrefix, audio = NO_AUDIO, image = NO_IMAGE } = {}) {
  let number = 0;
  return {
    title: snapshot.title,
    description: snapshot.description,
    instructions: snapshot.instructions,
    levelCode: snapshot.levelCode,
    slug: snapshot.slug,
    durationMinutes: snapshot.durationMinutes,
    passThreshold: snapshot.passThreshold,
    reviewPolicy: snapshot.reviewPolicy,
    aiGenerated: snapshot.aiGenerated,
    questionCount: snapshotQuestionCount(snapshot),
    sections: snapshot.sections.map((s) => ({
      key: s.key,
      title: s.title,
      instructions: s.instructions,
      exercises: s.exercises.map((ex) => {
        const client = toClientExercise(ex, { exerciseId: String(ex._id), audio, image, seedPrefix });
        const { passThreshold: _practiceThreshold, ...rest } = client;
        const firstNumber = number + 1;
        number += client.items.length;
        return { ...rest, firstNumber, stimulus: rest.stimulus ? { ...rest.stimulus, transcript: null } : null };
      }),
    })),
  };
}
