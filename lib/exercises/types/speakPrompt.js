import { z } from "zod";
import { localizedText, objectIdString } from "@/lib/validation/common";
import { audioCueSchema } from "@/lib/audio/cues";
import { clientBase, itemBase } from "@/lib/exercises/types/common";

// Speaking practice: the learner says the answer aloud (optionally recording it), then
// compares with a model answer and rates themselves. Self-ratings and recordings are
// stored but never scored, so they never count towards mastery. There is no automated
// pronunciation assessment of any kind.
export const SELF_RATINGS = Object.freeze(["confident", "unsure", "not_yet"]);

// Answer formats: the Phase 2 bare rating ("confident"), or { selfRating, recordingId? }.
// The recording id is checked for ownership and target by learningService, not here.
const speakAnswerSchema = z
  .union([
    z.enum(SELF_RATINGS),
    z.object({ selfRating: z.enum(SELF_RATINGS), recordingId: objectIdString.optional() }).strict(),
  ])
  .transform((a) => (typeof a === "string" ? { selfRating: a } : a));

export function speakRecordingId(answer) {
  const parsed = speakAnswerSchema.safeParse(answer);
  return parsed.success ? (parsed.data.recordingId ?? null) : null;
}

export const speakPrompt = {
  type: "speak_prompt",
  graded: false,

  schema: z.object({
    type: z.literal("speak_prompt"),
    ...itemBase,
    cue: localizedText({ max: 300 }).optional(), // keyword card, e.g. "Name? – Land? – Wohnort?"
    modelAnswer: localizedText({ max: 600, require: ["de"] }),
    modelAudio: audioCueSchema.optional(),
  }),

  answerSchema: speakAnswerSchema,

  maxScore: () => 0,

  toClient(item, ctx) {
    return { ...clientBase(item, ctx), cue: item.cue ?? null };
  },

  grade(_item, answer) {
    return { correct: null, score: 0, selfRating: answer.selfRating };
  },

  reveal(item, ctx) {
    return { modelAnswer: item.modelAnswer, modelAudio: item.modelAudio ? ctx.audio(item.modelAudio) : null };
  },
};
