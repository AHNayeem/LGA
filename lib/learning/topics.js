import { EXERCISE_BLOCK_TYPES } from "@/lib/content/constants";
import { scopeMastery } from "@/lib/learning/progress";
import { isDue } from "@/lib/learning/srs";
import { vocabTopicLabel } from "@/lib/content/vocabTopics";

// Practice by topic (docs/PRACTICE.md): grammar topics and word topics of a level, with
// the learner's results. Pure functions of (structure, state) like lib/learning/journey.js,
// so the server (signed-in learners) and the browser (guests) compute the same numbers.
//
// Which exercises practise a grammar topic is DERIVED from the lessons; exercises carry
// no grammar link of their own. One rule, used for the topic numbers, the "Why?" rule
// after a wrong answer and the explanation report:
//
//   an exercise practises a grammar topic  ⇔  its skill is "grammar" AND its lesson has
//                                              exactly one grammar step, that topic
//
// A lesson with two grammar steps can't tell which one an exercise practises, so its
// exercises count for no topic (they still count for the Grammar skill). Exercises of other
// skills (reading, listening …) never count for a grammar topic.

const EXERCISE_BLOCKS = new Set(EXERCISE_BLOCK_TYPES);
export const TOPIC_SKILL = "grammar";

// Why an exercise does or doesn't practise its lesson's grammar topic.
export const GRAMMAR_LINK = Object.freeze({
  linked: "linked",
  notGrammar: "not_grammar_skill",
  noTopic: "no_grammar_topic",
  severalTopics: "several_grammar_topics",
});

// blocks: a lesson's blocks (structure blocks or lesson-view blocks, both have `type`).
// Returns { reason, block }: `block` is the lesson's grammar step when linked.
export function grammarLinkOf(blocks, skill) {
  if (skill !== TOPIC_SKILL) return { reason: GRAMMAR_LINK.notGrammar, block: null };
  const grammar = (blocks ?? []).filter((b) => b.type === "grammar");
  if (grammar.length === 0) return { reason: GRAMMAR_LINK.noTopic, block: null };
  if (grammar.length > 1) return { reason: GRAMMAR_LINK.severalTopics, block: null };
  return { reason: GRAMMAR_LINK.linked, block: grammar[0] };
}

export const practiceHref = (levelCode) => `/practice/${levelCode.toLowerCase()}`;
export const grammarTopicHref = (levelCode, slug) => `${practiceHref(levelCode)}/grammar/${slug}`;
export const wordTopicHref = (levelCode, slug) => `${practiceHref(levelCode)}/words/${slug}`;
const lessonHref = (levelCode, moduleSlug, lessonSlug, blockKey) => `/learn/${levelCode.toLowerCase()}/${moduleSlug}/${lessonSlug}?block=${blockKey}`;

const sorted = (list) => [...list].sort((a, b) => a.order - b.order);

// Every grammar topic taught in the level's lessons, in course order, with the exercises
// that practise it (rule above) and where it is taught.
function collectGrammarTopics(structure) {
  const topics = new Map();
  for (const mod of sorted(structure.modules)) {
    for (const lesson of sorted(mod.lessons)) {
      for (const b of lesson.blocks) {
        if (b.type !== "grammar") continue;
        const g = structure.grammar?.[b.refId];
        if (!g) continue;
        if (!topics.has(b.refId)) topics.set(b.refId, { id: b.refId, ...g, module: mod, taught: [], exercises: [], seen: new Set() });
        topics.get(b.refId).taught.push({ lesson, module: mod, blockKey: b.key });
      }
      const { block } = grammarLinkOf(lesson.blocks, TOPIC_SKILL);
      const topic = block && topics.get(block.refId);
      if (!topic) continue;
      for (const b of lesson.blocks) {
        const ex = EXERCISE_BLOCKS.has(b.type) ? structure.exercises[b.refId] : null;
        if (!ex || ex.skill !== TOPIC_SKILL || topic.seen.has(b.refId)) continue;
        topic.seen.add(b.refId);
        topic.exercises.push({ id: b.refId, ex, block: b, lesson, module: mod });
      }
    }
  }
  return [...topics.values()];
}

const exerciseStatus = (graded, p) =>
  !p?.attempts ? "new" : !graded ? "practised" : (p.last?.ratio ?? 0) >= 1 ? "perfect" : p.last?.passed ? "passed" : "mistakes";

// Topic numbers use the Grammar skill's rules (docs/LEARNER.md, "Metrics"), on the topic's
// exercises only:
//   performance  latest scores ÷ points on the ATTEMPTED exercises ("% right"), or null
//   progress     latest scores ÷ points of ALL its exercises, unattempted = 0 (scopeMastery)
//   threshold    the Grammar target of the topic's module (level rules, module overrides)
//   status       no_exercises | new (nothing attempted) | needs_practice (performance below
//                the target) | on_track
function topicStats(structure, topic, state) {
  const code = structure.level.code;
  const exercises = topic.exercises.map((o) => {
    const p = state?.lessons?.[o.lesson.id]?.exercises?.[o.id] ?? null;
    const graded = o.ex.maxScore > 0;
    return {
      id: o.id,
      title: o.ex.title,
      maxScore: o.ex.maxScore,
      graded,
      status: exerciseStatus(graded, p),
      last: p?.last ?? null,
      lesson: { id: o.lesson.id, slug: o.lesson.slug, title: o.lesson.title },
      module: { slug: o.module.slug, title: o.module.title, order: o.module.order },
      href: `${lessonHref(code, o.module.slug, o.lesson.slug, o.block.key)}&from=grammar-${topic.slug}`,
    };
  });
  const gradedOnes = exercises.filter((e) => e.graded);
  const rules = topic.module.rules ?? structure.rules;
  const mastery = scopeMastery(rules, gradedOnes.map((e) => ({ skill: TOPIC_SKILL, maxScore: e.maxScore, last: e.last })));
  const breakdown = mastery.breakdown[TOPIC_SKILL] ?? null;
  // The same formula as levelSkills' `performance` (latest attempt, scaled to the
  // exercise's current points).
  let score = 0;
  let max = 0;
  for (const e of gradedOnes) {
    if (!e.last?.maxScore) continue;
    score += (e.last.score / e.last.maxScore) * e.maxScore;
    max += e.maxScore;
  }
  const attempted = gradedOnes.filter((e) => e.last?.maxScore).length;
  const performance = max > 0 ? score / max : null;
  const threshold = mastery.skills[TOPIC_SKILL]?.threshold ?? null;
  const status =
    gradedOnes.length === 0 ? "no_exercises" : attempted === 0 ? "new" : threshold != null && performance < threshold ? "needs_practice" : "on_track";
  const taught = topic.taught[0];
  return {
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    summary: topic.summary ?? null,
    href: grammarTopicHref(code, topic.slug),
    module: { slug: topic.module.slug, title: topic.module.title, order: topic.module.order },
    taughtIn: {
      lesson: { id: taught.lesson.id, slug: taught.lesson.slug, title: taught.lesson.title },
      module: { slug: taught.module.slug, title: taught.module.title, order: taught.module.order },
      href: `${lessonHref(code, taught.module.slug, taught.lesson.slug, taught.blockKey)}&from=grammar-${topic.slug}`,
    },
    exercises,
    total: gradedOnes.length,
    attempted,
    performance,
    progress: breakdown?.ratio ?? null,
    threshold,
    toImprove: exercises.filter((e) => e.status === "mistakes").length,
    status,
  };
}

export function grammarTopics(structure, state) {
  return collectGrammarTopics(structure).map((t) => topicStats(structure, t, state));
}

// Topics whose "% right" so far is below the Grammar target, weakest first. Like weak
// skills, topics with no attempt are never weak.
export function weakGrammarTopics(topics) {
  return topics.filter((t) => t.status === "needs_practice").sort((a, b) => a.performance - b.performance);
}

// The one exercise to start with on a topic page, first match wins: the first one whose
// latest attempt wasn't fully right; the first one not practised yet; the first one.
export function nextTopicExercise(topic) {
  return (
    topic.exercises.find((e) => e.status === "mistakes") ??
    topic.exercises.find((e) => e.status === "new") ??
    topic.exercises.find((e) => e.graded) ??
    topic.exercises[0] ??
    null
  );
}

// Word topics: the level's words grouped by their `topics`, in course order (the lesson
// where a topic's first word is taught). Only words of live lessons.
export function wordTopics(structure, state, now = new Date()) {
  const code = structure.level.code;
  return Object.entries(structure.vocabTopics ?? {}).map(([slug, ids]) => {
    const states = ids.map((id) => state?.vocab?.[id]).filter(Boolean);
    return {
      slug,
      label: vocabTopicLabel(slug),
      count: ids.length,
      seen: states.length,
      due: states.filter((s) => isDue(s, now)).length,
      href: wordTopicHref(code, slug),
    };
  });
}

// --- Page views -------------------------------------------------------------------------

export function practiceView(structure, state, { now = new Date() } = {}) {
  const topics = grammarTopics(structure, state);
  const byModule = [];
  for (const t of topics) {
    const last = byModule[byModule.length - 1];
    if (last?.module.slug === t.module.slug) last.topics.push(t);
    else byModule.push({ module: t.module, topics: [t] });
  }
  return {
    level: structure.level,
    grammar: byModule.map((g) => ({ ...g, topics: g.topics.map(({ exercises, ...t }) => t) })),
    grammarCount: topics.length,
    weakTopics: weakGrammarTopics(topics).map(({ exercises, ...t }) => t),
    words: wordTopics(structure, state, now),
  };
}

export function grammarTopicView(structure, state, slug) {
  const topic = grammarTopics(structure, state).find((t) => t.slug === slug);
  if (!topic) return null;
  return { level: structure.level, topic, next: nextTopicExercise(topic) };
}

// For the dashboard and Review: how many topics there are and the weakest ones.
export function practiceSummary(structure, state) {
  const topics = grammarTopics(structure, state);
  return { grammarCount: topics.length, weakTopics: weakGrammarTopics(topics).slice(0, 3).map(({ exercises, ...t }) => t) };
}
