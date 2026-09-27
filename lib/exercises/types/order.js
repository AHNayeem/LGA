import { z } from "zod";
import { text } from "@/lib/validation/common";
import { clientBase, itemBase } from "@/lib/exercises/types/common";
import { seededPermutation } from "@/lib/exercises/shuffle";
import { normalizeAnswer } from "@/lib/exercises/normalize";

// Build a sentence from shuffled tokens (word order: verb in position 2, W-questions).
// `tokens` are authored in a correct order; `alternatives` lists other correct sentences
// (e.g. "Aus Polen komme ich."). Answers are compared as joined text, so duplicate
// tokens and equivalent orders are handled.

const PUNCT = /^[.,!?;:]$/;

export function joinTokens(tokens) {
  return tokens.reduce((out, t) => (out && !PUNCT.test(t) ? `${out} ${t}` : `${out}${t}`), "");
}

function order(item, ctx) {
  return seededPermutation(item.tokens.length, ctx.seed);
}

export const orderTokens = {
  type: "order",
  graded: true,

  schema: z.object({
    type: z.literal("order"),
    ...itemBase,
    tokens: z.array(text(60).pipe(z.string().min(1))).min(2).max(12),
    alternatives: z.array(text(400)).max(5).default([]),
  }),

  answerSchema: z.array(z.string().regex(/^t\d{1,2}$/)).max(12),

  maxScore: () => 1,

  toClient(item, ctx) {
    const perm = order(item, ctx);
    return { ...clientBase(item, ctx), tokens: perm.map((i, k) => ({ id: `t${k}`, text: item.tokens[i] })) };
  },

  grade(item, answer, ctx) {
    const perm = order(item, ctx);
    const used = new Set(answer);
    if (answer.length !== item.tokens.length || used.size !== answer.length) return { correct: false, score: 0 };
    const words = answer.map((id) => item.tokens[perm[Number(id.slice(1))]]);
    if (words.some((w) => w === undefined)) return { correct: false, score: 0 };
    const given = normalizeAnswer(joinTokens(words));
    const accepted = [joinTokens(item.tokens), ...(item.alternatives ?? [])].map((s) => normalizeAnswer(s));
    const correct = accepted.includes(given);
    return { correct, score: correct ? 1 : 0 };
  },

  reveal(item) {
    return { answer: joinTokens(item.tokens) };
  },
};
