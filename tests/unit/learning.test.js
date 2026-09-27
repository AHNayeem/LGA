import { describe, expect, it } from "vitest";
import { BOX_INTERVALS_MS, isDue, MAX_BOX, reviewCard } from "@/lib/learning/srs";
import { isBlockDone, lessonCompletion, moduleCompletion, scopeMastery, skillBreakdown } from "@/lib/learning/progress";
import { evaluateMastery, resolveMastery } from "@/lib/content/mastery";
import { LEVELS } from "@/content/seed/levels";

const now = new Date("2026-09-27T10:00:00Z");

describe("vocabulary review (Leitner)", () => {
  it("first 'known' goes to box 1, then climbs; 'unknown' drops to box 1 and counts a lapse", () => {
    let s = reviewCard(null, "known", now);
    expect(s).toMatchObject({ box: 1, reps: 1, lapses: 0 });
    s = reviewCard(s, "known", now);
    expect(s.box).toBe(2);
    expect(s.dueAt.getTime() - now.getTime()).toBe(BOX_INTERVALS_MS[2]);
    s = reviewCard(s, "unknown", now);
    expect(s).toMatchObject({ box: 1, lapses: 1, reps: 3, lastResult: "unknown" });
  });

  it("does not count a lapse for a card that was never learned", () => {
    expect(reviewCard(null, "unknown", now)).toMatchObject({ box: 1, lapses: 0 });
  });

  it("caps at the last box", () => {
    let s = null;
    for (let i = 0; i < 10; i++) s = reviewCard(s, "known", now);
    expect(s.box).toBe(MAX_BOX);
  });

  it("is due only once the interval has passed", () => {
    const s = reviewCard(null, "known", now);
    expect(isDue(s, now)).toBe(false);
    expect(isDue(s, new Date(now.getTime() + BOX_INTERVALS_MS[1]))).toBe(true);
    expect(() => reviewCard(s, "maybe", now)).toThrow();
  });
});

const lesson = {
  blocks: [
    { key: "intro", type: "intro" },
    { key: "words", type: "vocabulary" },
    { key: "practice", type: "practice", refId: "e1" },
    { key: "speak", type: "speaking", refId: "e2" },
  ],
};

describe("lesson completion is based on results", () => {
  it("content blocks need acknowledgement; exercise blocks need a passing attempt", () => {
    const progress = {
      blocksDone: ["intro", "words"],
      exercises: {
        e1: { attempts: 2, bestRatio: 0.4, last: { passed: false } }, // attempted, never passed
        e2: { attempts: 1, passedAt: now },
      },
    };
    const c = lessonCompletion(lesson, progress);
    expect(c).toMatchObject({ total: 4, done: 3, complete: false });
    expect(isBlockDone(lesson.blocks[2], progress)).toBe(false);

    progress.exercises.e1.passedAt = now;
    expect(lessonCompletion(lesson, progress).complete).toBe(true);
  });

  it("an empty lesson is never complete", () => {
    expect(lessonCompletion({ blocks: [] }, {}).complete).toBe(false);
  });
});

describe("skill scores and mastery", () => {
  const entries = [
    { skill: "vocabulary", maxScore: 10, last: { score: 9, maxScore: 10 } },
    { skill: "vocabulary", maxScore: 10, last: { score: 8, maxScore: 10 } },
    { skill: "grammar", maxScore: 5, last: { score: 4, maxScore: 5 } },
    { skill: "grammar", maxScore: 5, last: null }, // unattempted counts as zero
    { skill: "speaking", maxScore: 0, last: null }, // ungraded: not assessable
  ];

  it("aggregates latest attempts and counts unattempted exercises as zero", () => {
    const b = skillBreakdown(entries);
    expect(b.vocabulary).toMatchObject({ score: 17, maxScore: 20, ratio: 0.85, exercises: 2, attempted: 2 });
    expect(b.grammar).toMatchObject({ score: 4, maxScore: 10, ratio: 0.4, attempted: 1 });
    expect(b.speaking).toBeUndefined();
  });

  it("uses A1 thresholds; skills without content are not assessed and don't block", () => {
    const rules = resolveMastery(LEVELS.find((l) => l.code === "A1").mastery);
    const m = scopeMastery(rules, entries);
    expect(m.skills.vocabulary).toMatchObject({ status: "met", threshold: 0.8 });
    expect(m.skills.grammar).toMatchObject({ status: "not_met", threshold: 0.75 });
    expect(m.skills.listening.status).toBe("not_assessed");
    expect(m.skills.speaking).toMatchObject({ status: "not_assessed", required: false });
    expect(m.mastered).toBe(false);

    const good = entries.map((e) => (e.skill === "grammar" ? { ...e, last: { score: 5, maxScore: 5 } } : e));
    expect(scopeMastery(rules, good).mastered).toBe(true);
  });

  it("the latest attempt counts, so mastery can be lost again", () => {
    const rules = resolveMastery({ skills: { grammar: { threshold: 0.75 } } });
    expect(scopeMastery(rules, [{ skill: "grammar", maxScore: 4, last: { score: 4, maxScore: 4 } }]).mastered).toBe(true);
    expect(scopeMastery(rules, [{ skill: "grammar", maxScore: 4, last: { score: 2, maxScore: 4 } }]).mastered).toBe(false);
  });

  it("nothing assessable is not mastery", () => {
    expect(evaluateMastery(resolveMastery({ skills: { grammar: { threshold: 0.5 } } }), {}, { assessable: [] }).mastered).toBe(false);
  });

  it("module completion is block-based", () => {
    expect(
      moduleCompletion([
        { total: 4, done: 4, complete: true },
        { total: 6, done: 3, complete: false },
      ]),
    ).toEqual({ lessonsTotal: 2, lessonsCompleted: 1, blocksTotal: 10, blocksDone: 7, percent: 70 });
  });
});
