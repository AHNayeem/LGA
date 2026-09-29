import { z } from "zod";
import { answersSchema, gradeExercise, revealExercise } from "@/lib/exercises/engine";
import { EXAM_LIMITS } from "@/lib/content/constants";
import { NO_AUDIO, NO_IMAGE, snapshotExercises, snapshotQuestionCount, toClientExam } from "@/lib/exams/exam";

// Exam scoring and review: pure and deterministic. Every question is graded by the
// exercise engine's gradeExercise (the same function lessons use), against the snapshot
// frozen on the attempt and with the attempt's secret shuffle seed. Nothing here trusts
// the client beyond the raw answers.

const exerciseKey = z.string().regex(/^[a-f0-9]{24}$/i);

// { [exerciseId]: { [itemId]: answer } }. Each answer is validated per item type while
// grading; malformed or missing answers count as unanswered (0 points), never as errors.
export const examAnswersSchema = z
  .record(exerciseKey, answersSchema)
  .refine((a) => Object.keys(a).length <= EXAM_LIMITS.exercises, "Too many answers");

// Only answers to questions in this exam are kept, so stored attempts stay bounded.
export function sanitizeExamAnswers(snapshot, answers) {
  const out = {};
  for (const ex of snapshotExercises(snapshot)) {
    const id = String(ex._id);
    const given = answers?.[id];
    if (!given || typeof given !== "object") continue;
    const kept = {};
    for (const item of ex.items) if (Object.hasOwn(given, item.id)) kept[item.id] = given[item.id];
    if (Object.keys(kept).length) out[id] = kept;
  }
  return JSON.parse(JSON.stringify(out));
}

const ratioOf = (score, max) => (max > 0 ? score / max : null);

// Pass mark on the total auto-scored points. The small epsilon keeps exact boundaries
// (e.g. 21 of 35 at 60%) from failing on floating-point rounding.
export function isPassed(score, maxScore, threshold) {
  return maxScore > 0 && score >= threshold * maxScore - 1e-9;
}

export function gradeExam(snapshot, answers, { seedPrefix } = {}) {
  const exercises = {};
  const sections = snapshot.sections.map((s) => {
    let score = 0;
    let maxScore = 0;
    let questionCount = 0;
    let answeredCount = 0;
    let correctCount = 0;
    for (const ex of s.exercises) {
      const id = String(ex._id);
      const r = gradeExercise(ex, answers?.[id] ?? {}, { exerciseId: id, seedPrefix });
      exercises[id] = {
        score: r.score,
        maxScore: r.maxScore,
        items: r.items.map(({ itemId, answered, correct, score: sc, maxScore: mx, feedback }) => ({
          itemId,
          answered,
          correct,
          score: sc,
          maxScore: mx,
          ...(feedback ? { feedback } : {}),
        })),
      };
      score += r.score;
      maxScore += r.maxScore;
      questionCount += r.items.length;
      answeredCount += r.items.filter((i) => i.answered).length;
      correctCount += r.items.filter((i) => i.correct === true).length;
    }
    return { key: s.key, title: s.title, score, maxScore, ratio: ratioOf(score, maxScore), questionCount, answeredCount, correctCount };
  });
  const score = sections.reduce((n, s) => n + s.score, 0);
  const maxScore = sections.reduce((n, s) => n + s.maxScore, 0);
  return {
    score,
    maxScore,
    ratio: ratioOf(score, maxScore),
    passed: isPassed(score, maxScore, snapshot.passThreshold),
    passThreshold: snapshot.passThreshold,
    questionCount: sections.reduce((n, s) => n + s.questionCount, 0),
    answeredCount: sections.reduce((n, s) => n + s.answeredCount, 0),
    correctCount: sections.reduce((n, s) => n + s.correctCount, 0),
    sections,
    exercises,
  };
}

// What the learner sees after the attempt, limited by the review policy:
//   summary  totals and section scores
//   marks    + each question with the learner's answer and right/wrong (no answer keys)
//   full     + correct answers, explanations and transcripts
// An expired attempt has no score.
export function examResultView(snapshot, attempt, { policy = snapshot.reviewPolicy, seedPrefix, audio = NO_AUDIO, image = NO_IMAGE } = {}) {
  const base = {
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt ?? null,
    submitReason: attempt.submitReason ?? null,
    reviewPolicy: policy,
    passThreshold: snapshot.passThreshold,
    questionCount: snapshotQuestionCount(snapshot),
  };
  const r = attempt.result;
  if (!r) return { ...base, result: null, review: null };
  const { exercises: perExercise, ...totals } = r;
  const result = { ...totals, sections: r.sections };
  if (policy === "summary") return { ...base, result, review: null };

  const client = toClientExam(snapshot, { seedPrefix, audio, image });
  const byId = new Map(snapshotExercises(snapshot).map((ex) => [String(ex._id), ex]));
  const review = client.sections.map((s) => ({
    key: s.key,
    title: s.title,
    exercises: s.exercises.map((ex) => {
      const graded = perExercise[ex.id] ?? { items: [] };
      const out = { exercise: ex, answers: attempt.answers?.[ex.id] ?? {}, items: graded.items };
      if (policy === "full") out.reveal = revealExercise(byId.get(ex.id), { exerciseId: ex.id, audio, seedPrefix });
      return out;
    }),
  }));
  return { ...base, result, review };
}
