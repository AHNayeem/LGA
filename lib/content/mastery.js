import { z } from "zod";
import { SKILLS } from "@/lib/content/skills";

// Mastery rules are configured per level and may be overridden per module and lesson.
// A skill rule: { threshold: 0..1, required: boolean }. Skills absent from the merged
// rule set are not assessed for that scope.

export const skillRuleSchema = z.object({
  threshold: z.number().min(0).max(1),
  required: z.boolean().default(true),
});

export const masteryConfigSchema = z
  .object({
    skills: z.partialRecord(z.enum(SKILLS), skillRuleSchema.nullable()).default({}),
  })
  .strict();

// Later scopes win. A `null` rule explicitly removes a skill inherited from a parent.
export function resolveMastery(...configs) {
  const merged = {};
  for (const cfg of configs) {
    for (const [skill, rule] of Object.entries(cfg?.skills ?? {})) {
      if (rule === null) delete merged[skill];
      else merged[skill] = { ...merged[skill], ...rule };
    }
  }
  return { skills: merged };
}

// skillScores: { listening: 0.72, ... } as ratios 0..1 from graded attempts.
export function evaluateMastery(rules, skillScores = {}) {
  const results = {};
  let mastered = true;
  for (const [skill, rule] of Object.entries(rules.skills)) {
    const score = skillScores[skill];
    const met = typeof score === "number" && score >= rule.threshold;
    results[skill] = { score: score ?? null, threshold: rule.threshold, required: rule.required !== false, met };
    if (rule.required !== false && !met) mastered = false;
  }
  return { mastered, skills: results };
}
