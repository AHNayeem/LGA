// "Try again" on an exercise (components/exercises/ExercisePlayer.js): which answers stay.
// Dependency-free, runs in the browser.
//
//   - after a result with something wrong: the items the server graded fully right keep
//     their answer (shown locked, marked ✓); wrong, partly right (e.g. 2 of 3 pairs),
//     unanswered and ungraded items are cleared
//   - after a perfect result or ungraded practice: nothing is kept (start from scratch)
//
// Nothing here grades: the retry is submitted as a whole and graded on the server again,
// so the kept answers are scored like any other answer and the attempt is complete.
//
// items: the exercise's items; result: the server's grading ({ graded, score, maxScore,
// items: [{ itemId, correct }] }); answers: { [itemId]: value } as submitted;
// reveal: the server's reveal ({ items: { [itemId]: … } }).
// Returns { answers, kept: { [itemId]: { result, reveal } } }.
export function retryState(items, result, answers = {}, reveal = null) {
  const kept = {};
  const keptAnswers = {};
  if (result?.graded && result.score < result.maxScore) {
    const byId = new Map((result.items ?? []).map((r) => [r.itemId, r]));
    for (const item of items) {
      const r = byId.get(item.id);
      if (r?.correct !== true || !Object.hasOwn(answers, item.id)) continue;
      kept[item.id] = { result: r, reveal: reveal?.items?.[item.id] ?? null };
      keptAnswers[item.id] = answers[item.id];
    }
  }
  return { answers: keptAnswers, kept };
}
