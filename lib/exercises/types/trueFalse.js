import { z } from "zod";
import { localizedText } from "@/lib/validation/common";
import { clientBase, itemBase } from "@/lib/exercises/types/common";

// Richtig/Falsch statement (Goethe Hören Teil 2, Lesen Teil 1 and 3).
export const trueFalse = {
  type: "true_false",
  graded: true,

  schema: z.object({
    type: z.literal("true_false"),
    ...itemBase,
    statement: localizedText({ max: 500, require: ["de"] }),
    answer: z.boolean(),
  }),

  answerSchema: z.boolean(),

  maxScore: () => 1,

  toClient(item, ctx) {
    return { ...clientBase(item, ctx), statement: item.statement };
  },

  grade(item, answer) {
    const correct = answer === item.answer;
    return { correct, score: correct ? 1 : 0 };
  },

  reveal(item) {
    return { answer: item.answer };
  },
};
