import { z } from "zod";
import { mcq } from "@/lib/exercises/types/mcq";
import { trueFalse } from "@/lib/exercises/types/trueFalse";
import { textInput } from "@/lib/exercises/types/textInput";
import { match } from "@/lib/exercises/types/match";
import { orderTokens } from "@/lib/exercises/types/order";
import { speakPrompt } from "@/lib/exercises/types/speakPrompt";

// Registry of exercise item types. Adding a type = one file implementing the contract in
// ./common.js, one entry here, and one renderer in components/exercises/renderers.js.
// Lessons, attempts, scoring, progress and mastery are type-agnostic.
const TYPES = [mcq, trueFalse, textInput, match, orderTokens, speakPrompt];

export const ITEM_TYPES = Object.freeze(Object.fromEntries(TYPES.map((t) => [t.type, t])));
export const ITEM_TYPE_NAMES = Object.freeze(TYPES.map((t) => t.type));

export const itemSchema = z.discriminatedUnion(
  "type",
  TYPES.map((t) => t.schema),
);

export function itemType(name) {
  const t = Object.hasOwn(ITEM_TYPES, name) ? ITEM_TYPES[name] : null;
  if (!t) throw new Error(`Unknown exercise item type: ${name}`);
  return t;
}
