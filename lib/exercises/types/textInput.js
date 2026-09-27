import { z } from "zod";
import { text } from "@/lib/validation/common";
import { clientBase, itemBase } from "@/lib/exercises/types/common";
import { matchTypedAnswer } from "@/lib/exercises/normalize";

// Typed answer, optionally as a gap inside a sentence ("Ich ___ Anna."). Used for
// conjugation, dictation (numbers, spelling) and form filling (Goethe Schreiben Teil 1).
// Accepted variants are listed explicitly; comparison is whitespace/punctuation tolerant.
export const textInput = {
  type: "text_input",
  graded: true,

  schema: z.object({
    type: z.literal("text_input"),
    ...itemBase,
    label: text(120).optional(), // e.g. a form field label "Vorname"
    before: text(300).optional(),
    after: text(300).optional(),
    accepted: z.array(text(200).pipe(z.string().min(1))).min(1).max(20),
    caseSensitive: z.boolean().default(false),
    umlautTolerant: z.boolean().default(true),
    ignoreSpaces: z.boolean().default(false), // phone numbers: "0421 55 73 18" = "042155 7318"
    inputMode: z.enum(["text", "numeric", "email"]).default("text"),
  }),

  answerSchema: z.string().max(200),

  maxScore: () => 1,

  toClient(item, ctx) {
    return {
      ...clientBase(item, ctx),
      label: item.label ?? null,
      before: item.before ?? null,
      after: item.after ?? null,
      inputMode: item.inputMode ?? "text",
    };
  },

  grade(item, answer) {
    const match = matchTypedAnswer(answer, item.accepted, {
      caseSensitive: item.caseSensitive,
      umlautTolerant: item.umlautTolerant !== false,
      ignoreSpaces: item.ignoreSpaces === true,
    });
    if (match === "exact") return { correct: true, score: 1 };
    if (match === "umlaut") return { correct: true, score: 1, feedback: "umlaut" };
    return { correct: false, score: 0 };
  },

  reveal(item) {
    return { answer: item.accepted[0] };
  },
};
