import { z } from "zod";
import { localizedText } from "@/lib/validation/common";
import { audioCueSchema } from "@/lib/audio/cues";

// Shared building blocks for exercise item types.
//
// Item type contract (see ./index.js):
//   type        string discriminator
//   graded      false for practice-only types (no points, never counted for mastery)
//   schema      Zod schema for the authored item (includes the answer key)
//   answerSchema Zod schema for what a learner submits for this item
//   maxScore(item)
//   toClient(item, ctx)  learner payload BEFORE submission: never contains the answer key
//   grade(item, answer, ctx) -> { correct: boolean|null, score, feedback?: string }
//   reveal(item, ctx)    what the learner may see AFTER submission (expected answer)
//
// ctx = { seed, audio(cue) -> client audio source }

export const itemIdSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,39}$/, "Use a short lowercase id");

export const itemBase = {
  id: itemIdSchema,
  prompt: localizedText({ max: 500 }).optional(),
  audio: audioCueSchema.optional(),
  explanation: localizedText({ max: 1000 }).optional(),
};

export function clientBase(item, ctx) {
  return {
    id: item.id,
    type: item.type,
    prompt: item.prompt ?? null,
    audio: item.audio ? ctx.audio(item.audio) : null,
  };
}

export function duplicates(values) {
  const seen = new Set();
  const dups = new Set();
  for (const v of values) (seen.has(v) ? dups : seen).add(v);
  return [...dups];
}
