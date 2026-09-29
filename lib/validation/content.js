import { z } from "zod";
import { levelCode, localizedText, objectIdString, slug, text } from "@/lib/validation/common";
import { masteryConfigSchema } from "@/lib/content/mastery";
import { provenanceSchema } from "@/lib/content/lifecycle";
import { SKILLS } from "@/lib/content/skills";
import { stimulusAudioSchema } from "@/lib/audio/cues";
import { itemSchema } from "@/lib/exercises/types";
import { duplicates } from "@/lib/exercises/types/common";
import { DEFAULT_PASS_THRESHOLD, MAX_ITEMS } from "@/lib/exercises/engine";
import {
  ARTICLES,
  CONTENT_BLOCK_TYPES,
  EXAM_LIMITS,
  EXAM_REVIEW_POLICIES,
  EXERCISE_BLOCK_TYPES,
  LESSON_BLOCK_TYPES,
  PARTS_OF_SPEECH,
  STIMULUS_TEXT_KINDS,
  TRANSCRIPT_POLICIES,
} from "@/lib/content/constants";

export { CONTENT_BLOCK_TYPES, EXERCISE_BLOCK_TYPES, LESSON_BLOCK_TYPES, PARTS_OF_SPEECH };

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

// Block types are defined in lib/content/constants.js. `key` is stable within a lesson so
// progress survives reordering and edits.
const blockCommon = { key: slug, title: localizedText({ max: 200 }).optional() };

// An image from the media library (lib/media/imageRefs.js). The id must be an active
// curriculum image (checked on save); alt text is required, in at least one language.
export const imageRefSchema = z.object({
  mediaId: objectIdString,
  alt: localizedText({ max: 250 }),
  caption: localizedText({ max: 300 }).optional(),
});

export const lessonBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("intro"), ...blockCommon, body: localizedText({ max: 4000 }), image: imageRefSchema.optional() }),
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

export const vocabularySchema = z
  .object({
    levelCode,
    slug,
    lemma: text(120).pipe(z.string().min(1)),
    article: z.enum(ARTICLES).nullable().default(null),
    plural: text(120).nullable().default(null), // "die Sprachen"; null when not applicable
    pos: z.enum(PARTS_OF_SPEECH),
    meanings: localizedText({ max: 300, require: ["en"] }),
    example: localizedText({ max: 300, require: ["de"] }).optional(),
    notes: localizedText({ max: 500 }).optional(),
    image: imageRefSchema.optional(),
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
    textKind: z.enum(STIMULUS_TEXT_KINDS).optional(),
    audio: stimulusAudioSchema.optional(),
    image: imageRefSchema.optional(), // picture shown with the text/audio (e.g. a sign)
    transcriptPolicy: z.enum(TRANSCRIPT_POLICIES).default("after_submit"),
    maxPlays: z.number().int().min(1).max(5).nullable().default(null),
  })
  .refine((s) => s.text || s.audio || s.image, "A stimulus needs text, audio or an image");

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

// --- Exams -------------------------------------------------------------------------
// An exam is lifecycle-managed content like a lesson: ordered sections that reference
// exercises from the library by id. Its questions are those exercises' items. Sections may
// be empty while authoring; publishing requires questions (contentService.assertPublishable).

export const examSectionSchema = z.object({
  key: slug,
  title: localizedText({ max: 200, require: ["de"] }),
  instructions: localizedText({ max: 1000 }).optional(),
  exerciseIds: z.array(objectIdString).max(EXAM_LIMITS.exercisesPerSection).default([]),
});

export const examSchema = z
  .object({
    levelCode,
    slug,
    title: localizedText({ max: 200, require: ["de"] }),
    description: localizedText({ max: 2000 }).optional(),
    instructions: localizedText({ max: 2000 }).optional(),
    order: z.number().int().min(0).max(10_000),
    durationMinutes: z.number().int().min(1).max(240).nullable().default(null), // null = untimed
    passThreshold: z.number().min(0).max(1).default(0.6), // share of the auto-scored points
    reviewPolicy: z.enum(EXAM_REVIEW_POLICIES).default("full"),
    sections: z.array(examSectionSchema).max(EXAM_LIMITS.sections).default([]),
    tags: z.array(slug).max(20).default([]),
    refs: z.array(referenceLinkSchema).max(20).default([]),
  })
  .superRefine((exam, ctx) => {
    if (duplicates(exam.sections.map((s) => s.key)).length) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "Section keys must be unique within an exam" });
    }
    const ids = exam.sections.flatMap((s) => s.exerciseIds.map((id) => id.toLowerCase()));
    if (duplicates(ids).length) ctx.addIssue({ code: "custom", path: ["sections"], message: "An exercise can only appear once in an exam" });
    if (ids.length > EXAM_LIMITS.exercises) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: `An exam can have at most ${EXAM_LIMITS.exercises} exercises` });
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

// --- Admin (CMS) inputs --------------------------------------------------------------

// Content kinds the admin editors may create and update. References are seeded metadata
// and are not edited in the CMS.
export const EDITABLE_KINDS = Object.freeze(["levels", "modules", "lessons", "vocabulary", "grammarTopics", "exercises", "exams"]);

export const saveContentSchema = z.object({
  kind: z.enum(EDITABLE_KINDS),
  id: objectIdString.optional(),
  version: z.number().int().min(1).optional(),
  data: z.record(z.string(), z.unknown()),
}).refine((v) => !v.id || v.version, { path: ["version"], message: "The version is required to update content" });

// Attach (mediaId) or remove (null) a recording on one listening target of an exercise:
// "stimulus" or an item id.
export const exerciseAudioMediaSchema = z.object({
  exerciseId: objectIdString,
  version: z.number().int().min(1),
  target: z.string().min(1).max(40),
  mediaId: objectIdString.nullable(),
});

// Admin list filters come from the URL, so anything invalid is ignored rather than rejected.
const param = (schema) =>
  z.preprocess((v) => {
    const first = Array.isArray(v) ? v[0] : v;
    return first === "" || first == null ? undefined : first;
  }, schema.optional()).catch(undefined);

export const ADMIN_PUBLISH_FILTERS = Object.freeze(["active", "unpublished", "published", "archived", "any"]);

export const adminListQuerySchema = z.object({
  q: param(z.string().trim().max(100)),
  level: param(levelCode),
  moduleId: param(objectIdString),
  skill: param(z.enum(SKILLS)),
  topic: param(slug),
  pos: param(z.enum(PARTS_OF_SPEECH)),
  review: param(z.enum(["draft", "reviewed", "approved"])),
  // "active" (default) hides archived content; "any" includes it.
  publish: param(z.enum(ADMIN_PUBLISH_FILTERS)),
  page: param(z.coerce.number().int().min(1).max(10_000)),
  pageSize: param(z.coerce.number().int().min(1).max(100)),
});
