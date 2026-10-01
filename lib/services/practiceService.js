import { serialize } from "@/lib/db/serialize";
import { NotFoundError } from "@/lib/errors";
import { slug as slugSchema, toObjectId } from "@/lib/validation/common";
import { grammarTopicRepository, vocabularyRepository, LEARNER_VISIBLE } from "@/lib/repositories/contentRepository";
import { reviewCards } from "@/lib/services/learningService";

// Practice by topic (docs/PRACTICE.md). The topic lists and numbers come from the level
// structure (journeyService.getLevelStructure) and lib/learning/topics.js; this service
// only loads what a topic page shows besides them. Read-only, published content only, and
// only topics taught in lessons learners can open: the structure decides that, so a draft
// topic or word never shows here.

function topicSlug(param) {
  const r = slugSchema.safeParse(String(param ?? ""));
  if (!r.success) throw new NotFoundError();
  return r.data;
}

// The full explanation of a grammar topic taught in this structure's lessons.
export async function getGrammarTopicContent(structure, param) {
  const slug = topicSlug(param);
  const id = Object.entries(structure.grammar ?? {}).find(([, g]) => g.slug === slug)?.[0];
  if (!id) throw new NotFoundError();
  const g = await grammarTopicRepository.findOne({ _id: toObjectId(id), ...LEARNER_VISIBLE });
  if (!g) throw new NotFoundError();
  return serialize({ title: g.title, summary: g.summary ?? null, sections: g.sections ?? [] });
}

// Flashcards for every word of a topic (structure built with vocabTopics), in course order.
export async function getTopicWordCards(structure, param) {
  const slug = topicSlug(param);
  const ids = structure.vocabTopics?.[slug];
  if (!ids?.length) throw new NotFoundError();
  const words = await vocabularyRepository.findManyByIds(ids, LEARNER_VISIBLE);
  const byId = new Map(words.map((v) => [String(v._id), v]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  if (ordered.length === 0) throw new NotFoundError();
  return serialize({ slug, cards: await reviewCards(ordered) });
}
