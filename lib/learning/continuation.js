import { EXERCISE_BLOCK_TYPES } from "@/lib/content/constants";
import { continueAt, moduleView, summarizeModules } from "@/lib/learning/journey";
import { applyBlockDone, applyExerciseResult, emptyLearnerState } from "@/lib/learning/state";

// Sequencing check for a level structure (journeyService.getLevelStructure): a simulated
// learner starts with no progress and keeps following "Continue" (journey.continueAt),
// completing each lesson it is sent to, the same way the lesson player records progress.
// Pure; used by the readiness report and the journey tests.
//
// It reports:
//   - "Continue" not visiting every lesson exactly once in module/lesson order
//   - "Continue" sending the learner to a lesson that is already complete (a loop)
//   - "Continue" still offering a lesson once everything is complete
//   - a module page's "next module" skipping a module or pointing past the end, and the
//     last module not reporting the level as complete
// No prerequisites are involved: lessons stay open in any order (docs/LEARNER.md).

const EXERCISE_BLOCKS = new Set(EXERCISE_BLOCK_TYPES);
const lessonKey = (m, l) => `${m.slug}/${l.slug}`;

function orderedLessons(structure) {
  return [...structure.modules]
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order).map((l) => ({ module: m, lesson: l })));
}

// Every block of the lesson done: content blocks marked, exercises passed with full marks.
export function completeLessonState(state, structure, lesson, now = new Date()) {
  const blocks = lesson.blocks.map((b) => ({ key: b.key, type: b.type, ...(b.refId ? { refId: b.refId } : {}) }));
  let next = state;
  for (const b of lesson.blocks) {
    if (EXERCISE_BLOCKS.has(b.type)) {
      const ex = structure.exercises[b.refId];
      const max = ex?.maxScore ?? 0;
      const result = { score: max, maxScore: max, ratio: max > 0 ? 1 : null, passed: true };
      next = applyExerciseResult(next, { lessonId: lesson.id, exerciseId: b.refId, skill: ex?.skill ?? null, result, blocks, now });
    } else {
      next = applyBlockDone(next, { lessonId: lesson.id, blockKey: b.key, blocks, now });
    }
  }
  return next;
}

export function checkContinuation(structure) {
  const problems = [];
  const expected = orderedLessons(structure);
  const byKey = new Map(expected.map((e) => [lessonKey(e.module, e.lesson), e]));
  let state = emptyLearnerState();
  const visited = [];

  for (let step = 0; step <= expected.length; step++) {
    const c = continueAt(structure, summarizeModules(structure, state), state);
    if (!c) break;
    const key = `${c.module.slug}/${c.lesson.slug}`;
    if (visited.includes(key)) {
      problems.push(`"Continue" leads back to ${key} after it was completed (loop).`);
      break;
    }
    const entry = byKey.get(key);
    if (!entry) {
      problems.push(`"Continue" leads to ${key}, which is not a lesson of this level.`);
      break;
    }
    visited.push(key);
    state = completeLessonState(state, structure, entry.lesson);
  }

  const expectedKeys = expected.map((e) => lessonKey(e.module, e.lesson));
  const missed = expectedKeys.filter((k) => !visited.includes(k));
  if (missed.length) problems.push(`"Continue" never reaches ${missed.length} lesson(s): ${missed.slice(0, 5).join(", ")}${missed.length > 5 ? " …" : ""}.`);
  else if (visited.join("|") !== expectedKeys.join("|")) problems.push(`"Continue" visits the lessons out of module/lesson order.`);
  if (expected.length && continueAt(structure, summarizeModules(structure, state), state)) {
    problems.push(`"Continue" still offers a lesson after every lesson is complete.`);
  }

  // Module pages, with everything complete.
  const withLessons = [...structure.modules].sort((a, b) => a.order - b.order).filter((m) => m.lessons.length > 0);
  withLessons.forEach((m, i) => {
    const view = moduleView(structure, state, m.slug);
    const want = withLessons[i + 1] ?? null;
    if ((view.nextModule?.slug ?? null) !== (want?.slug ?? null)) {
      problems.push(`Module ${m.slug}: "next module" is ${view.nextModule?.slug ?? "none"}, expected ${want?.slug ?? "none"}.`);
    }
    if (!view.complete) problems.push(`Module ${m.slug} is not reported complete after all its lessons are complete.`);
    if (!want && !view.levelComplete) problems.push(`The last module (${m.slug}) doesn't report the level as complete.`);
  });

  return { ok: problems.length === 0, lessons: expected.length, visited: visited.length, problems };
}
