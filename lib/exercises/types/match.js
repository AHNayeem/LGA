import { z } from "zod";
import { localizedText } from "@/lib/validation/common";
import { clientBase, duplicates, itemBase, itemIdSchema } from "@/lib/exercises/types/common";
import { seededPermutation } from "@/lib/exercises/shuffle";

// Match each left entry to a right entry. Right entries are shuffled deterministically and
// given neutral ids (r0, r1, …) so the pairing isn't visible in the payload.
// Partial credit: one point per correct pair.

function rightOrder(item, ctx) {
  return seededPermutation(item.pairs.length, ctx.seed); // position k shows pairs[perm[k]].right
}

export const match = {
  type: "match",
  graded: true,

  schema: z
    .object({
      type: z.literal("match"),
      ...itemBase,
      pairs: z
        .array(z.object({ id: itemIdSchema, left: localizedText({ max: 200 }), right: localizedText({ max: 200 }) }))
        .min(2)
        .max(8),
    })
    .superRefine((item, ctx) => {
      if (duplicates(item.pairs.map((p) => p.id)).length) {
        ctx.addIssue({ code: "custom", path: ["pairs"], message: "Pair ids must be unique" });
      }
    }),

  answerSchema: z.record(itemIdSchema, z.string().regex(/^r\d{1,2}$/)),

  maxScore: (item) => item.pairs.length,

  toClient(item, ctx) {
    const perm = rightOrder(item, ctx);
    return {
      ...clientBase(item, ctx),
      left: item.pairs.map((p) => ({ id: p.id, text: p.left })),
      right: perm.map((pairIndex, k) => ({ id: `r${k}`, text: item.pairs[pairIndex].right })),
    };
  },

  grade(item, answer, ctx) {
    const perm = rightOrder(item, ctx);
    let score = 0;
    item.pairs.forEach((pair, i) => {
      const k = Number(String(answer[pair.id] ?? "").slice(1));
      if (answer[pair.id] && perm[k] === i) score++;
    });
    return { correct: score === item.pairs.length, score };
  },

  reveal(item, ctx) {
    const perm = rightOrder(item, ctx);
    const pairs = {};
    item.pairs.forEach((pair, i) => {
      pairs[pair.id] = `r${perm.indexOf(i)}`;
    });
    return { pairs };
  },
};
