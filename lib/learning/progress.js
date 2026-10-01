// Dependency-free constants: this module also runs in the browser (guest learners).
import { CONTENT_BLOCK_TYPES } from "@/lib/content/constants";
import { evaluateMastery } from "@/lib/content/mastery";

// Pure progress calculations. Four separate notions, deliberately kept apart:
//
//   exercise correctness  per attempt, per item            (attempts collection)
//   lesson completion     every block done                 (userProgress, scope "lesson")
//   module progress       lessons/blocks done + skill scores (computed on read)
//   skill mastery         skill scores vs configured thresholds (computed on read)
//
// Vocabulary review state (userVocabulary) is separate again: it schedules reviews and
// never feeds mastery, because flashcard ratings are self-reported.
//
// Lesson progress document (bounded by the lesson's ≤30 blocks):
//   { blocksDone: [blockKey], exercises: { [exerciseId]: { skill, attempts, bestRatio,
//     last: { score, maxScore, ratio, passed, at }, passedAt } }, completedAt }

export function isContentBlock(block) {
  return CONTENT_BLOCK_TYPES.includes(block.type);
}

// An exercise block is only done once an attempt reached the exercise's pass threshold
// (or, for ungraded speaking practice, every prompt was answered).
export function isBlockDone(block, progress) {
  if (isContentBlock(block)) return Boolean(progress?.blocksDone?.includes(block.key));
  return Boolean(progress?.exercises?.[String(block.refId)]?.passedAt);
}

export function lessonCompletion(lesson, progress) {
  const blocks = (lesson.blocks ?? []).map((b) => ({ key: b.key, type: b.type, done: isBlockDone(b, progress) }));
  const done = blocks.filter((b) => b.done).length;
  return { total: blocks.length, done, complete: blocks.length > 0 && done === blocks.length, blocks };
}

// entries: one per gradable exercise in scope: { skill, maxScore, last: { score, maxScore } | null }.
// Uses the LATEST attempt (current ability, can go down) and counts unattempted exercises as
// zero, so mastery needs coverage, not one lucky exercise.
export function skillBreakdown(entries) {
  const out = {};
  for (const e of entries) {
    if (!e.maxScore) continue;
    const s = (out[e.skill] ??= { score: 0, maxScore: 0, exercises: 0, attempted: 0 });
    s.maxScore += e.maxScore;
    s.exercises += 1;
    if (e.last) {
      s.attempted += 1;
      // Scale the last attempt to the exercise's current max in case the item count changed.
      s.score += e.last.maxScore ? (e.last.score / e.last.maxScore) * e.maxScore : 0;
    }
  }
  for (const s of Object.values(out)) s.ratio = s.maxScore ? s.score / s.maxScore : null;
  return out;
}

export function scopeMastery(rules, entries) {
  const skills = skillBreakdown(entries);
  const ratios = Object.fromEntries(Object.entries(skills).map(([k, v]) => [k, v.ratio]));
  const result = evaluateMastery(rules, ratios, { assessable: Object.keys(skills) });
  return { ...result, breakdown: skills };
}

// Blocks-based percentage, so partially done lessons show movement.
export function moduleCompletion(lessonCompletions) {
  const total = lessonCompletions.reduce((s, c) => s + c.total, 0);
  const done = lessonCompletions.reduce((s, c) => s + c.done, 0);
  return {
    lessonsTotal: lessonCompletions.length,
    lessonsCompleted: lessonCompletions.filter((c) => c.complete).length,
    blocksTotal: total,
    blocksDone: done,
    percent: total ? Math.round((done / total) * 100) : 0,
  };
}
