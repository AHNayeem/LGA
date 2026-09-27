// Vocabulary review state: a Leitner system with five boxes. Deterministic and easy to
// explain to learners ("known cards come back less often").
//
//   known   -> next box (max 5)
//   unknown -> box 1 (lapse)
//   next due = now + interval(box)

export const REVIEW_RESULTS = Object.freeze(["known", "unknown"]);
export const MAX_BOX = 5;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export const BOX_INTERVALS_MS = Object.freeze({
  1: 10 * MINUTE,
  2: 1 * DAY,
  3: 3 * DAY,
  4: 7 * DAY,
  5: 21 * DAY,
});

export function reviewCard(state, result, now = new Date()) {
  if (!REVIEW_RESULTS.includes(result)) throw new Error(`Unknown review result: ${result}`);
  const prevBox = state?.box ?? 0; // 0 = never reviewed
  const box = result === "known" ? Math.min(prevBox + 1, MAX_BOX) : 1;
  return {
    box,
    dueAt: new Date(now.getTime() + BOX_INTERVALS_MS[box]),
    reps: (state?.reps ?? 0) + 1,
    lapses: (state?.lapses ?? 0) + (result === "unknown" && prevBox > 0 ? 1 : 0),
    lastResult: result,
    lastReviewedAt: now,
  };
}

export function isDue(state, now = new Date()) {
  return Boolean(state?.dueAt) && new Date(state.dueAt).getTime() <= now.getTime();
}
