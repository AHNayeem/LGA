import { z } from "zod";
import { levelCode, localizedText, objectIdString, slug, text } from "@/lib/validation/common";
import { masteryConfigSchema } from "@/lib/content/mastery";
import { provenanceSchema } from "@/lib/content/lifecycle";

// Reference links attach curriculum-alignment metadata (never book content).
export const referenceLinkSchema = z.object({
  referenceId: objectIdString,
  note: text(300).optional(),
});

const base = {
  title: localizedText({ max: 200, require: ["de"] }),
  description: localizedText({ max: 2000 }).optional(),
  order: z.number().int().min(0).max(10_000),
  tags: z.array(slug).max(20).default([]),
  refs: z.array(referenceLinkSchema).max(20).default([]),
};

export const levelSchema = z
  .object({
    code: levelCode,
    ...base,
    mastery: masteryConfigSchema.optional(),
  })
  .and(provenanceSchema);

export const moduleSchema = z
  .object({
    levelCode,
    slug,
    ...base,
    goals: z.array(localizedText({ max: 300 })).max(20).default([]),
    mastery: masteryConfigSchema.optional(),
  })
  .and(provenanceSchema);

// Lesson flow is an ordered list of blocks; lessons include only the blocks they need.
export const LESSON_BLOCK_TYPES = Object.freeze([
  "intro",
  "vocabulary",
  "grammar",
  "reading",
  "listening",
  "speaking",
  "writing",
  "practice",
  "mini_test",
  "mastery_check",
]);

export const lessonBlockSchema = z.object({
  type: z.enum(LESSON_BLOCK_TYPES),
  refId: objectIdString.optional(), // points at the vocab set / grammar topic / exercise
  title: localizedText({ max: 200 }).optional(),
});

export const lessonSchema = z
  .object({
    moduleId: objectIdString,
    slug,
    ...base,
    estimatedMinutes: z.number().int().min(1).max(240).optional(),
    blocks: z.array(lessonBlockSchema).max(30).default([]),
    mastery: masteryConfigSchema.optional(),
  })
  .and(provenanceSchema);

export const REFERENCE_KINDS = Object.freeze(["book", "chapter", "topic", "exam_spec"]);

export const referenceSchema = z
  .object({
    slug,
    kind: z.enum(REFERENCE_KINDS),
    parentId: objectIdString.nullable().default(null),
    title: text(300).pipe(z.string().min(1)),
    publisher: text(200).optional(),
    notes: text(2000).optional(),
    order: z.number().int().min(0).max(10_000).default(0),
    meta: z.record(z.string(), z.union([z.string().max(500), z.number(), z.boolean()])).default({}),
  })
  .and(provenanceSchema);

export const reviewTransitionSchema = z.object({
  id: objectIdString,
  to: z.enum(["draft", "reviewed", "approved"]),
});

export const publishTransitionSchema = z.object({
  id: objectIdString,
  to: z.enum(["unpublished", "published", "archived"]),
});
