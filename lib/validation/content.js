import { z } from "zod";
import { levelCode, localizedText, objectIdString, slug, text } from "@/lib/validation/common";
import { masteryConfigSchema } from "@/lib/content/mastery";
import { provenanceSchema } from "@/lib/content/lifecycle";
import { SKILLS } from "@/lib/content/skills";
import { audioLineSchema } from "@/lib/audio/cues";
import { itemSchema } from "@/lib/exercises/types";
import { duplicates } from "@/lib/exercises/types/common";
import { DEFAULT_PASS_THRESHOLD, MAX_ITEMS } from "@/lib/exercises/engine";

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
// Content blocks (intro, grammar) are completed by reading them; vocabulary blocks by
// rating every card once; exercise blocks only by a graded attempt (see lib/learning/progress.js).
export const CONTENT_BLOCK_TYPES = Object.freeze(["intro", "vocabulary", "grammar"]);
export const EXERCISE_BLOCK_TYPES = Object.freeze([
  "reading",
  "listening",
  "speaking",
  "writing",
  "practice",
  "mini_test",
  "mastery_check",
]);
export const LESSON_BLOCK_TYPES = Object.freeze([...CONTENT_BLOCK_TYPES, ...EXERCISE_BLOCK_TYPES]);

// `key` is stable within a lesson so progress survives reordering and edits.
const blockCommon = { key: slug, title: localizedText({ max: 200 }).optional() };

export const lessonBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("intro"), ...blockCommon, body: localizedText({ max: 4000 }) }),
  z.object({ type: z.literal("vocabulary"), ...blockCommon, vocabIds: z.array(objectIdString).min(1).max(40) }),
  z.object({ type: z.literal("grammar"), ...blockCommon, refId: objectIdString }),
  ...EXERCISE_BLOCK_TYPES.map((type) => z.object({ type: z.literal(type), ...blockCommon, refId: objectIdString })),
]);

export const lessonSchema = z
  .object({
    moduleId: objectIdString,
    slug,
    ...base,
    estimatedMinutes: z.number().int().min(1).max(240).optional(),
    blocks: z.array(lessonBlockSchema).max(30).default([]),
    mastery: masteryConfigSchema.optional(),
  })
  .superRefine((lesson, ctx) => {
    if (duplicates(lesson.blocks.map((b) => b.key)).length) {
      ctx.addIssue({ code: "custom", path: ["blocks"], message: "Block keys must be unique within a lesson" });
    }
  })
  .and(provenanceSchema);

// --- Vocabulary ---------------------------------------------------------------

export const PARTS_OF_SPEECH = Object.freeze([
  "noun",
  "proper_noun", // countries, cities, languages; article only where German uses one (die Schweiz)
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "numeral",
  "question_word",
  "phrase",
  "interjection",
  "other",
]);

export const vocabularySchema = z
  .object({
    levelCode,
    slug,
    lemma: text(120).pipe(z.string().min(1)),
    article: z.enum(["der", "die", "das"]).nullable().default(null),
    plural: text(120).nullable().default(null), // "die Sprachen"; null when not applicable
    pos: z.enum(PARTS_OF_SPEECH),
    meanings: localizedText({ max: 300, require: ["en"] }),
    example: localizedText({ max: 300, require: ["de"] }).optional(),
    notes: localizedText({ max: 500 }).optional(),
    topics: z.array(slug).max(10).default([]),
    tags: z.array(slug).max(20).default([]),
    refs: z.array(referenceLinkSchema).max(20).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.pos === "noun" && !v.article) ctx.addIssue({ code: "custom", path: ["article"], message: "Nouns need an article" });
  })
  .and(provenanceSchema);

// --- Grammar topics -------------------------------------------------------------

const grammarSectionSchema = z.object({
  heading: localizedText({ max: 200 }).optional(),
  body: localizedText({ max: 3000 }).optional(),
  table: z
    .object({
      headers: z.array(text(80)).min(1).max(8),
      rows: z.array(z.array(text(120)).max(8)).min(1).max(20),
    })
    .optional(),
  examples: z.array(localizedText({ max: 300, require: ["de"] })).max(12).default([]),
});

export const grammarTopicSchema = z
  .object({
    levelCode,
    slug,
    title: localizedText({ max: 200, require: ["de"] }),
    summary: localizedText({ max: 500 }).optional(),
    sections: z.array(grammarSectionSchema).min(1).max(12),
    tags: z.array(slug).max(20).default([]),
    refs: z.array(referenceLinkSchema).max(20).default([]),
  })
  .and(provenanceSchema);

// --- Exercises -------------------------------------------------------------------

export const stimulusSchema = z
  .object({
    text: localizedText({ max: 4000 }).optional(), // reading text (German)
    textKind: z.enum(["message", "email", "sign", "ad", "profile", "form", "dialogue"]).optional(),
    audio: z.object({ lines: z.array(audioLineSchema).min(1).max(30) }).optional(),
    transcriptPolicy: z.enum(["after_submit", "always", "never"]).default("after_submit"),
    maxPlays: z.number().int().min(1).max(5).nullable().default(null),
  })
  .refine((s) => s.text || s.audio, "A stimulus needs text or audio");

export const exerciseSchema = z
  .object({
    levelCode,
    slug,
    skill: z.enum(SKILLS),
    title: localizedText({ max: 200, require: ["de"] }),
    instructions: localizedText({ max: 1000 }).optional(),
    stimulus: stimulusSchema.optional(),
    items: z.array(itemSchema).min(1).max(MAX_ITEMS),
    itemAudioMaxPlays: z.number().int().min(1).max(5).nullable().default(null), // Goethe Hören: 2
    passThreshold: z.number().min(0).max(1).default(DEFAULT_PASS_THRESHOLD),
    tags: z.array(slug).max(20).default([]),
    refs: z.array(referenceLinkSchema).max(20).default([]),
  })
  .superRefine((ex, ctx) => {
    if (duplicates(ex.items.map((i) => i.id)).length) {
      ctx.addIssue({ code: "custom", path: ["items"], message: "Item ids must be unique" });
    }
    if (ex.skill === "listening" && !ex.stimulus?.audio && !ex.items.some((i) => i.audio)) {
      ctx.addIssue({ code: "custom", path: ["stimulus"], message: "Listening exercises need audio" });
    }
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
