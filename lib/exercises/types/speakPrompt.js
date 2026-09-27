import { z } from "zod";
import { localizedText } from "@/lib/validation/common";
import { audioCueSchema } from "@/lib/audio/cues";
import { clientBase, itemBase } from "@/lib/exercises/types/common";

// Speaking practice without recording (recording + upload is Phase 3): the learner says
// the answer aloud, then compares with a model answer and rates themselves.
// Self-ratings are stored but never scored, so they never count towards mastery.
export const SELF_RATINGS = Object.freeze(["confident", "unsure", "not_yet"]);

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

  answerSchema: z.enum(SELF_RATINGS),

  maxScore: () => 0,

  toClient(item, ctx) {
    return { ...clientBase(item, ctx), cue: item.cue ?? null };
  },

  grade(_item, answer) {
    return { correct: null, score: 0, selfRating: answer };
  },

  reveal(item, ctx) {
    return { modelAnswer: item.modelAnswer, modelAudio: item.modelAudio ? ctx.audio(item.modelAudio) : null };
  },
};
