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
// options.assessable: skills that have gradable content in this scope. When given, a
// skill outside it is "not_assessed" and never blocks mastery (e.g. a lesson with no
// listening exercise). Without it, every configured skill is expected to have a score.
// These are application learning thresholds, not official Goethe pass criteria.
export function evaluateMastery(rules, skillScores = {}, { assessable } = {}) {
  const assessableSet = assessable ? new Set(assessable) : null;
  const results = {};
  let mastered = true;
  let assessedCount = 0;
  for (const [skill, rule] of Object.entries(rules.skills)) {
    const required = rule.required !== false;
    if (assessableSet && !assessableSet.has(skill)) {
      results[skill] = { score: null, threshold: rule.threshold, required, met: null, status: "not_assessed" };
      continue;
    }
    assessedCount++;
    const score = skillScores[skill];
    const met = typeof score === "number" && score >= rule.threshold;
    results[skill] = { score: score ?? null, threshold: rule.threshold, required, met, status: met ? "met" : "not_met" };
    if (required && !met) mastered = false;
  }
  // Nothing assessable means nothing was mastered.
  if (assessedCount === 0) mastered = false;
  return { mastered, skills: results };
}
