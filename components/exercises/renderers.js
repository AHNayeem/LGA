import McqItem from "@/components/exercises/items/McqItem";
import TrueFalseItem from "@/components/exercises/items/TrueFalseItem";
import TextInputItem from "@/components/exercises/items/TextInputItem";
import MatchItem from "@/components/exercises/items/MatchItem";
import OrderItem from "@/components/exercises/items/OrderItem";
import SpeakPromptItem from "@/components/exercises/items/SpeakPromptItem";

// Client renderer per item type (the server-side counterpart is lib/exercises/types).
// Each component also exposes `isAnswered(value, item)` for the submit button state, and
// optionally `prepareAnswer(value, { lessonId, exerciseId, itemId })`, which turns the UI
// value into the submitted answer (e.g. uploads a speaking recording first).
export const RENDERERS = {
  mcq: McqItem,
  true_false: TrueFalseItem,
  text_input: TextInputItem,
  match: MatchItem,
  order: OrderItem,
  speak_prompt: SpeakPromptItem,
};

export function isItemAnswered(item, value) {
  const R = RENDERERS[item.type];
  return R ? R.isAnswered(value, item) : false;
}
