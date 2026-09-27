import { describe, expect, it } from "vitest";
import { evaluateMastery, masteryConfigSchema, resolveMastery } from "@/lib/content/mastery";

const level = {
  skills: {
    vocabulary: { threshold: 0.8, required: true },
    listening: { threshold: 0.7, required: true },
    speaking: { threshold: 0.6, required: false },
  },
};

describe("mastery", () => {
  it("module overrides level thresholds and can remove a skill", () => {
    const rules = resolveMastery(level, { skills: { listening: { threshold: 0.6 }, speaking: null } });
    expect(rules.skills.listening).toEqual({ threshold: 0.6, required: true });
    expect(rules.skills.speaking).toBeUndefined();
    expect(rules.skills.vocabulary.threshold).toBe(0.8);
  });

  it("requires every required skill to meet its threshold", () => {
    const rules = resolveMastery(level);
    expect(evaluateMastery(rules, { vocabulary: 0.85, listening: 0.72 }).mastered).toBe(true);
    expect(evaluateMastery(rules, { vocabulary: 0.85, listening: 0.5 }).mastered).toBe(false);
  });

  it("optional skills do not block mastery", () => {
    const res = evaluateMastery(resolveMastery(level), { vocabulary: 0.9, listening: 0.9, speaking: 0.1 });
    expect(res.mastered).toBe(true);
    expect(res.skills.speaking.met).toBe(false);
  });

  it("missing scores are not mastery", () => {
    expect(evaluateMastery(resolveMastery(level), {}).mastered).toBe(false);
  });

  it("validates config", () => {
    expect(masteryConfigSchema.safeParse({ skills: { grammar: { threshold: 1.5 } } }).success).toBe(false);
    expect(masteryConfigSchema.safeParse({ skills: { dancing: { threshold: 0.5 } } }).success).toBe(false);
    expect(masteryConfigSchema.safeParse(level).success).toBe(true);
  });
});
