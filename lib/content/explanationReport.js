import { EXERCISE_BLOCK_TYPES } from "@/lib/content/constants";
import { grammarLinkOf, GRAMMAR_LINK } from "@/lib/learning/topics";

// Content QA: which exercise items explain WHY an answer is right, and where the learner
// at least gets the lesson's grammar rule instead ("Why?" after a wrong answer,
// lib/learning/topics.grammarLinkOf – the same rule decides both, so this report says
// exactly what learners see). Read-only; pure function of stored documents.
//
// Per exercise (as used in a lesson step):
//   graded items        items that are scored (speaking prompts are not and need nothing)
//   explained           graded items with an authored `explanation`
//   fallback            the grammar topic a wrong answer falls back to, or why there is none
//   status              ungraded | complete (every graded item explained)
//                       | fallback (some missing, the grammar rule covers them)
//                       | missing (some missing, and no rule to fall back to)
//
// "Explained" only means an explanation exists; whether it is good stays a reviewer's call.

export const EXPLANATION_STATUS = Object.freeze({ ungraded: "ungraded", complete: "complete", fallback: "fallback", missing: "missing" });
const EXERCISE_BLOCKS = new Set(EXERCISE_BLOCK_TYPES);
const isGradedItem = (item) => item.type !== "speak_prompt";

// modules: [{ _id, slug, order }]; lessons: [{ _id, moduleId, slug, order, title, blocks }];
// exercises / grammar: Map of id string → document.
export function explanationReport({ modules, lessons, exercises, grammar }) {
  const rows = [];
  const byModule = new Map(modules.map((m) => [String(m._id), m]));
  const sortedLessons = [...lessons]
    .filter((l) => byModule.has(String(l.moduleId)))
    .sort((a, b) => byModule.get(String(a.moduleId)).order - byModule.get(String(b.moduleId)).order || a.order - b.order);

  for (const lesson of sortedLessons) {
    const mod = byModule.get(String(lesson.moduleId));
    const blocks = (lesson.blocks ?? []).map((b) => ({ ...b, refId: b.refId ? String(b.refId) : undefined }));
    for (const b of blocks) {
      if (!EXERCISE_BLOCKS.has(b.type)) continue;
      const ex = exercises.get(b.refId);
      if (!ex) continue;
      const items = ex.items ?? [];
      const graded = items.filter(isGradedItem);
      const explained = graded.filter((i) => i.explanation && Object.values(i.explanation).some((t) => typeof t === "string" && t.trim()));
      const link = grammarLinkOf(blocks, ex.skill);
      const topic = link.block ? grammar.get(link.block.refId) : null;
      const reason = link.block && !topic ? GRAMMAR_LINK.noTopic : link.reason;
      const missing = graded.length - explained.length;
      const status =
        graded.length === 0
          ? EXPLANATION_STATUS.ungraded
          : missing === 0
            ? EXPLANATION_STATUS.complete
            : topic
              ? EXPLANATION_STATUS.fallback
              : EXPLANATION_STATUS.missing;
      rows.push({
        module: { slug: mod.slug, order: mod.order },
        lesson: { slug: lesson.slug, order: lesson.order, title: lesson.title },
        blockKey: b.key,
        exercise: { id: String(ex._id), slug: ex.slug, title: ex.title, skill: ex.skill },
        itemTypes: [...new Set(items.map((i) => i.type))],
        items: items.length,
        gradedItems: graded.length,
        explained: explained.length,
        missing,
        fallback: { reason, topic: topic ? { slug: topic.slug, title: topic.title } : null },
        status,
      });
    }
  }

  const count = (s) => rows.filter((r) => r.status === s).length;
  return {
    summary: {
      exercises: rows.length,
      gradedItems: rows.reduce((n, r) => n + r.gradedItems, 0),
      explainedItems: rows.reduce((n, r) => n + r.explained, 0),
      ...Object.fromEntries(Object.values(EXPLANATION_STATUS).map((s) => [s, count(s)])),
    },
    rows,
  };
}
