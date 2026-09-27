import { z } from "zod";
import { localizedText } from "@/lib/validation/common";
import { clientBase, duplicates, itemBase, itemIdSchema } from "@/lib/exercises/types/common";

// Single-choice question (Goethe Hören Teil 1/3 use 3 options a/b/c). Options keep their
// authored order, as in the exam.
export const mcq = {
  type: "mcq",
  graded: true,

  schema: z
    .object({
      type: z.literal("mcq"),
      ...itemBase,
      options: z
        .array(z.object({ id: itemIdSchema, text: localizedText({ max: 300 }) }))
        .min(2)
        .max(6),
      answer: itemIdSchema,
    })
    .superRefine((item, ctx) => {
      const ids = item.options.map((o) => o.id);
      if (duplicates(ids).length) ctx.addIssue({ code: "custom", path: ["options"], message: "Option ids must be unique" });
      if (!ids.includes(item.answer)) ctx.addIssue({ code: "custom", path: ["answer"], message: "Answer must be one of the options" });
    }),

  answerSchema: itemIdSchema,

  maxScore: () => 1,

  toClient(item, ctx) {
    return { ...clientBase(item, ctx), options: item.options.map((o) => ({ id: o.id, text: o.text })) };
  },

  grade(item, answer) {
    const correct = answer === item.answer;
    return { correct, score: correct ? 1 : 0 };
  },

  reveal(item) {
    return { answer: item.answer };
  },
};
