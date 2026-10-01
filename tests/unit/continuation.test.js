import { describe, expect, it } from "vitest";
import { checkContinuation, completeLessonState } from "@/lib/learning/continuation";
import { continueAt, moduleView, summarizeModules } from "@/lib/learning/journey";
import { emptyLearnerState } from "@/lib/learning/state";

// Sequencing: "Continue" and "next module" over a level structure, including the edges
// (first/last lesson, first/last module, gaps left by unpublished content).

const RULES = { skills: { grammar: { threshold: 0.75, required: true } } };
const lesson = (id, slug, order, blocks) => ({ id, slug, order, title: { de: slug }, estimatedMinutes: 10, blocks, grammar: [] });
const mod = (id, slug, order, lessons) => ({ id, slug, levelCode: "A1", order, title: { de: slug }, rules: RULES, lessons });
const ex = (key, refId) => ({ key, type: "practice", refId });

function structure(modules) {
  return {
    level: { code: "A1", title: { de: "A1" }, description: null },
    rules: RULES,
    modules,
    exercises: {
      e1: { title: { de: "e1" }, skill: "grammar", maxScore: 4, passThreshold: 0.6, goethe: null },
      e2: { title: { de: "e2" }, skill: "grammar", maxScore: 2, passThreshold: 0.6, goethe: null },
      e3: { title: { de: "e3" }, skill: "speaking", maxScore: 0, passThreshold: 0.6, goethe: "sprechen" },
    },
    goethe: [],
    exams: [],
  };
}

const FULL = structure([
  mod("m1", "hallo", 1, [lesson("l1", "eins", 1, [{ key: "intro", type: "intro" }, ex("a", "e1")]), lesson("l2", "zwei", 2, [ex("s", "e3")])]),
  mod("m2", "familie", 2, [lesson("l3", "drei", 1, [ex("b", "e2")])]),
]);

describe("level continuation", () => {
  it("visits every lesson once, in order, and ends with the level complete", () => {
    const r = checkContinuation(FULL);
    expect(r).toEqual({ ok: true, lessons: 3, visited: 3, problems: [] });
  });

  it("starts at the first lesson and ends after the final one", () => {
    let state = emptyLearnerState();
    expect(continueAt(FULL, summarizeModules(FULL, state), state).lesson.slug).toBe("eins");
    for (const l of FULL.modules.flatMap((m) => m.lessons)) state = completeLessonState(state, FULL, l);
    expect(continueAt(FULL, summarizeModules(FULL, state), state)).toBeNull();
    const last = moduleView(FULL, state, "familie");
    expect(last.nextModule).toBeNull();
    expect(last.levelComplete).toBe(true);
    const first = moduleView(FULL, state, "hallo");
    expect(first.nextModule.slug).toBe("familie");
    expect(first.nextModule.firstLesson.slug).toBe("drei");
  });

  it("a completed lesson is never offered again, and completing the last lesson of a module moves on", () => {
    let state = completeLessonState(emptyLearnerState(), FULL, FULL.modules[0].lessons[0]);
    expect(continueAt(FULL, summarizeModules(FULL, state), state).lesson.slug).toBe("zwei");
    state = completeLessonState(state, FULL, FULL.modules[0].lessons[1]);
    const c = continueAt(FULL, summarizeModules(FULL, state), state);
    expect(c.module.slug).toBe("familie");
    expect(c.lesson.slug).toBe("drei");
  });

  it("skips modules without live lessons and tolerates order gaps from unpublished lessons", () => {
    const s = structure([
      mod("m1", "hallo", 1, [lesson("l1", "eins", 1, [ex("a", "e1")]), lesson("l3", "drei", 3, [ex("b", "e2")])]),
      mod("m2", "leer", 2, []),
      mod("m3", "wohnen", 3, [lesson("l4", "vier", 1, [ex("s", "e3")])]),
    ]);
    const r = checkContinuation(s);
    expect(r.problems).toEqual([]);
    expect(r.visited).toBe(3);
    const state = emptyLearnerState();
    expect(moduleView(s, state, "hallo").nextModule.slug).toBe("wohnen");
  });

  it("an empty level has nothing to continue and no problems", () => {
    expect(checkContinuation(structure([mod("m1", "hallo", 1, [])]))).toEqual({ ok: true, lessons: 0, visited: 0, problems: [] });
  });

  it("reports a lesson that can never be completed as a loop", () => {
    const s = structure([mod("m1", "hallo", 1, [lesson("l1", "eins", 1, []), lesson("l2", "zwei", 2, [ex("a", "e1")])])]);
    const r = checkContinuation(s);
    expect(r.ok).toBe(false);
    expect(r.problems.join("\n")).toMatch(/leads back to hallo\/eins after it was completed \(loop\)/);
    expect(r.problems.join("\n")).toMatch(/never reaches 1 lesson/);
  });
});
