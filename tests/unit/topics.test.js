import { describe, expect, it } from "vitest";
import { applyExerciseResult, applyVocabReview, emptyLearnerState, learnerStateFromDocs } from "@/lib/learning/state";
import { levelSkills, homeView, reviewView } from "@/lib/learning/journey";
import {
  GRAMMAR_LINK,
  grammarLinkOf,
  grammarTopics,
  grammarTopicView,
  nextTopicExercise,
  practiceSummary,
  practiceView,
  weakGrammarTopics,
  wordTopics,
} from "@/lib/learning/topics";
import { returnLinkFor } from "@/lib/learning/returnLink";
import { retryState } from "@/lib/exercises/retry";
import { explanationReport } from "@/lib/content/explanationReport";
import { vocabTopicLabel } from "@/lib/content/vocabTopics";

// Practice by topic (docs/PRACTICE.md): the grammar link rule, topic numbers (the same
// calculation as the Grammar skill), word topics, the return path, Try again and the
// explanation report.

const RULES = { skills: { grammar: { threshold: 0.75, required: true }, listening: { threshold: 0.7, required: true } } };
const lesson = (id, slug, order, blocks) => ({ id, slug, order, title: { de: slug }, description: null, estimatedMinutes: 20, blocks, grammar: [] });
const STRUCTURE = {
  level: { code: "A1", title: { de: "A1" }, description: null },
  rules: RULES,
  modules: [
    {
      id: "m1",
      slug: "hallo",
      levelCode: "A1",
      order: 1,
      title: { de: "Hallo" },
      rules: RULES,
      lessons: [
        // One grammar topic: its grammar exercises practise it, listening doesn't.
        lesson("l1", "eins", 1, [
          { key: "g", type: "grammar", refId: "gA" },
          { key: "p1", type: "practice", refId: "e1" },
          { key: "p2", type: "practice", refId: "e2" },
          { key: "h", type: "listening", refId: "e3" },
        ]),
        // Two grammar topics: ambiguous, its exercise counts for neither.
        lesson("l2", "zwei", 2, [
          { key: "g1", type: "grammar", refId: "gB" },
          { key: "g2", type: "grammar", refId: "gC" },
          { key: "p", type: "practice", refId: "e4" },
        ]),
        // No grammar topic (a module review): counts for no topic.
        lesson("l3", "test", 3, [{ key: "t", type: "mini_test", refId: "e5" }]),
      ],
    },
    {
      id: "m2",
      slug: "familie",
      levelCode: "A1",
      order: 2,
      title: { de: "Familie" },
      // The module raises the Grammar target.
      rules: { skills: { ...RULES.skills, grammar: { threshold: 0.9, required: true } } },
      lessons: [
        // Topic A again in a later lesson: both lessons contribute.
        lesson("l4", "vier", 1, [
          { key: "g", type: "grammar", refId: "gA" },
          { key: "p", type: "practice", refId: "e6" },
        ]),
        lesson("l5", "fuenf", 2, [
          { key: "g", type: "grammar", refId: "gD" },
          { key: "p", type: "practice", refId: "e7" },
        ]),
      ],
    },
  ],
  exercises: {
    e1: { title: { de: "A eins" }, skill: "grammar", maxScore: 4, passThreshold: 0.6, goethe: null },
    e2: { title: { de: "A zwei" }, skill: "grammar", maxScore: 2, passThreshold: 0.6, goethe: null },
    e3: { title: { de: "Hören" }, skill: "listening", maxScore: 2, passThreshold: 0.6, goethe: "hoeren" },
    e4: { title: { de: "B und C" }, skill: "grammar", maxScore: 4, passThreshold: 0.6, goethe: null },
    e5: { title: { de: "Test" }, skill: "grammar", maxScore: 5, passThreshold: 0.6, goethe: null },
    e6: { title: { de: "A drei" }, skill: "grammar", maxScore: 4, passThreshold: 0.6, goethe: null },
    e7: { title: { de: "D" }, skill: "grammar", maxScore: 4, passThreshold: 0.6, goethe: null },
  },
  grammar: {
    gA: { slug: "akkusativ", title: { de: "Akkusativ" }, summary: { en: "den, einen" } },
    gB: { slug: "b", title: { de: "B" }, summary: null },
    gC: { slug: "c", title: { de: "C" }, summary: null },
    gD: { slug: "d", title: { de: "D" }, summary: null },
  },
  vocabTopics: { familie: ["v1", "v2", "v3"], "neues-thema": ["v4"] },
  goethe: [],
  exams: [],
};
const graded = (score, maxScore) => ({ score, maxScore, ratio: score / maxScore, graded: true, passed: score / maxScore >= 0.6 });
const NOW = new Date("2026-10-01T10:00:00Z");
const play = (state, lessonId, exerciseId, score, maxScore, at = NOW) =>
  applyExerciseResult(state, { lessonId, exerciseId, skill: "grammar", result: graded(score, maxScore), now: at });
const topic = (state, slug) => grammarTopics(STRUCTURE, state).find((t) => t.slug === slug);

describe("grammar link rule", () => {
  it("links a grammar exercise to its lesson's only grammar topic, and says why not otherwise", () => {
    const [l1, l2, l3] = STRUCTURE.modules[0].lessons;
    expect(grammarLinkOf(l1.blocks, "grammar")).toMatchObject({ reason: GRAMMAR_LINK.linked, block: { refId: "gA" } });
    expect(grammarLinkOf(l1.blocks, "listening")).toEqual({ reason: GRAMMAR_LINK.notGrammar, block: null });
    expect(grammarLinkOf(l2.blocks, "grammar")).toEqual({ reason: GRAMMAR_LINK.severalTopics, block: null });
    expect(grammarLinkOf(l3.blocks, "grammar")).toEqual({ reason: GRAMMAR_LINK.noTopic, block: null });
  });

  it("collects every taught topic in course order, with only the exercises the rule links", () => {
    const topics = grammarTopics(STRUCTURE, emptyLearnerState());
    expect(topics.map((t) => t.slug)).toEqual(["akkusativ", "b", "c", "d"]);
    const a = topics[0];
    // Both lessons that teach it contribute; listening (e3) and the module test (e5) don't.
    expect(a.exercises.map((e) => e.id)).toEqual(["e1", "e2", "e6"]);
    expect(a.taughtIn.lesson.slug).toBe("eins");
    expect(topics.find((t) => t.slug === "b").exercises).toEqual([]);
    expect(topics.find((t) => t.slug === "b").status).toBe("no_exercises");
  });

  it("links exercises back into their lesson step with the way back to the topic", () => {
    const a = topic(emptyLearnerState(), "akkusativ");
    expect(a.exercises[0].href).toBe("/learn/a1/hallo/eins?block=p1&from=grammar-akkusativ");
    expect(a.exercises[2].href).toBe("/learn/a1/familie/vier?block=p&from=grammar-akkusativ");
    expect(a.href).toBe("/practice/a1/grammar/akkusativ");
  });
});

describe("grammar topic numbers", () => {
  it("a new learner: nothing invented, status new", () => {
    const a = topic(emptyLearnerState(), "akkusativ");
    expect(a).toMatchObject({ status: "new", attempted: 0, performance: null, progress: 0, total: 3, toImprove: 0 });
    expect(weakGrammarTopics(grammarTopics(STRUCTURE, emptyLearnerState()))).toEqual([]);
  });

  it("partial attempts: % right on attempted exercises only, progress counts the rest as 0", () => {
    let s = play(emptyLearnerState(), "l1", "e1", 1, 4); // 25 %
    const a = topic(s, "akkusativ");
    expect(a.attempted).toBe(1);
    expect(a.performance).toBeCloseTo(0.25);
    expect(a.progress).toBeCloseTo(1 / 10); // 1 of 4 + 2 + 4 points
    expect(a.status).toBe("needs_practice");
    expect(a.threshold).toBe(0.75); // the module where it is first taught
    expect(a.toImprove).toBe(1);
    s = play(s, "l1", "e2", 2, 2);
    s = play(s, "l4", "e6", 4, 4);
    const b = topic(s, "akkusativ");
    expect(b.performance).toBeCloseTo(7 / 10);
    expect(b.status).toBe("needs_practice");
  });

  it("uses the LATEST attempt, like the skills", () => {
    let s = play(emptyLearnerState(), "l1", "e1", 4, 4, NOW);
    s = play(s, "l1", "e1", 1, 4, new Date(NOW.getTime() + 1000));
    expect(topic(s, "akkusativ").performance).toBeCloseTo(0.25);
    s = play(s, "l1", "e1", 4, 4, new Date(NOW.getTime() + 2000));
    expect(topic(s, "akkusativ")).toMatchObject({ status: "on_track", toImprove: 0 });
    expect(topic(s, "akkusativ").performance).toBe(1);
  });

  it("a topic's module target applies (module rules override the level)", () => {
    const s = play(emptyLearnerState(), "l5", "e7", 3.5, 4); // 87.5 %: above 75, below 90
    expect(topic(s, "d")).toMatchObject({ threshold: 0.9, status: "needs_practice" });
  });

  it("agrees with the Grammar skill when every grammar exercise belongs to the topic", () => {
    const single = { ...STRUCTURE, modules: [{ ...STRUCTURE.modules[0], lessons: [STRUCTURE.modules[0].lessons[0]] }] };
    const s = play(play(emptyLearnerState(), "l1", "e1", 3, 4), "l1", "e2", 0, 2);
    const t = grammarTopics(single, s)[0];
    const skill = levelSkills(single, s).breakdown.grammar;
    expect(t.performance).toBeCloseTo(skill.performance);
    expect(t.progress).toBeCloseTo(skill.ratio);
  });

  it("guests (browser state) and signed-in learners (stored documents) get the same numbers", () => {
    const guest = play(play(emptyLearnerState(), "l1", "e1", 1, 4), "l4", "e6", 4, 4);
    const stored = learnerStateFromDocs({
      progress: [
        { scopeId: "l1", blocksDone: [], exercises: { e1: { skill: "grammar", attempts: 1, bestRatio: 0.25, last: { score: 1, maxScore: 4, ratio: 0.25, passed: false, at: NOW.toISOString() } } } },
        { scopeId: "l4", blocksDone: [], exercises: { e6: { skill: "grammar", attempts: 1, bestRatio: 1, passedAt: NOW.toISOString(), last: { score: 4, maxScore: 4, ratio: 1, passed: true, at: NOW.toISOString() } } } },
      ],
    });
    const strip = (list) => list.map(({ exercises, ...t }) => ({ ...t, exercises: exercises.map(({ status, last }) => ({ status, score: last?.score ?? null })) }));
    expect(strip(grammarTopics(STRUCTURE, stored))).toEqual(strip(grammarTopics(STRUCTURE, guest)));
  });

  it("weak topics come weakest first; the suggestion is the first mistake, else the first new exercise", () => {
    let s = play(emptyLearnerState(), "l1", "e1", 2, 4); // A: 50 %
    s = play(s, "l5", "e7", 1, 4); // D: 25 %
    expect(weakGrammarTopics(grammarTopics(STRUCTURE, s)).map((t) => t.slug)).toEqual(["d", "akkusativ"]);
    expect(nextTopicExercise(topic(s, "akkusativ")).id).toBe("e1");
    const fixed = play(s, "l1", "e1", 4, 4);
    expect(nextTopicExercise(topic(fixed, "akkusativ")).id).toBe("e2");
    expect(nextTopicExercise(topic(emptyLearnerState(), "b"))).toBeNull();
  });

  it("feeds the dashboard and Review only from attempted exercises", () => {
    expect(practiceSummary(STRUCTURE, emptyLearnerState())).toEqual({ grammarCount: 4, weakTopics: [] });
    const s = play(emptyLearnerState(), "l1", "e1", 0, 4);
    expect(homeView(STRUCTURE, s, { now: NOW }).practice.weakTopics.map((t) => t.slug)).toEqual(["akkusativ"]);
    expect(reviewView(STRUCTURE, s, { now: NOW }).weakTopics.map((t) => t.slug)).toEqual(["akkusativ"]);
  });
});

describe("practice views", () => {
  it("groups grammar topics by module and lists word topics with labels and due words", () => {
    let s = applyVocabReview(emptyLearnerState(), { vocabId: "v1", result: "unknown", now: new Date(NOW.getTime() - 60 * 60_000) });
    s = applyVocabReview(s, { vocabId: "v2", result: "known", now: NOW });
    const view = practiceView(STRUCTURE, s, { now: NOW });
    expect(view.grammar.map((g) => [g.module.slug, g.topics.map((t) => t.slug)])).toEqual([
      ["hallo", ["akkusativ", "b", "c"]],
      ["familie", ["d"]],
    ]);
    expect(view.grammar[0].topics[0].exercises).toBeUndefined();
    expect(view.words).toEqual([
      { slug: "familie", label: { de: "Familie", en: "Family" }, count: 3, seen: 2, due: 1, href: "/practice/a1/words/familie" },
      { slug: "neues-thema", label: { de: "Neues thema" }, count: 1, seen: 0, due: 0, href: "/practice/a1/words/neues-thema" },
    ]);
  });

  it("an empty level gives empty lists, and no words without word topics", () => {
    const empty = { ...STRUCTURE, modules: [], grammar: {}, exercises: {}, vocabTopics: undefined };
    expect(practiceView(empty, emptyLearnerState())).toMatchObject({ grammar: [], grammarCount: 0, weakTopics: [], words: [] });
    expect(wordTopics({ ...STRUCTURE, vocabTopics: undefined }, null)).toEqual([]);
  });

  it("a topic page view exists only for a taught topic", () => {
    expect(grammarTopicView(STRUCTURE, emptyLearnerState(), "akkusativ")).toMatchObject({ topic: { slug: "akkusativ" }, next: { id: "e1" } });
    expect(grammarTopicView(STRUCTURE, emptyLearnerState(), "unbekannt")).toBeNull();
  });

  it("works on a structure without grammar data (older pages, no state)", () => {
    expect(grammarTopics({ ...STRUCTURE, grammar: undefined }, null)).toEqual([]);
  });

  it("labels known topics and makes unknown ones readable", () => {
    expect(vocabTopicLabel("koerper")).toEqual({ de: "Körper", en: "The body" });
    expect(vocabTopicLabel("e-mail")).toEqual({ de: "E-Mail", en: "E-mail" });
    expect(vocabTopicLabel("neues-thema")).toEqual({ de: "Neues thema" });
  });
});

describe("return path", () => {
  it("accepts Goethe parts, Practice and grammar topics; ignores anything else", () => {
    expect(returnLinkFor("goethe-hoeren", "a1")).toEqual({ href: "/goethe/a1/hoeren", label: "Back to Hören practice" });
    expect(returnLinkFor("practice", "a1")).toEqual({ href: "/practice/a1", label: "Back to Practice" });
    expect(returnLinkFor("grammar-m4-akkusativ", "a1")).toEqual({ href: "/practice/a1/grammar/m4-akkusativ", label: "Back to grammar practice" });
    for (const bad of ["goethe-xyz", "grammar-", "grammar-../admin", "grammar-A", "https://evil.example", "", null, ["practice"]]) {
      expect(returnLinkFor(bad, "a1")).toBeNull();
    }
  });
});

describe("Try again keeps the right answers", () => {
  const items = [{ id: "q1" }, { id: "q2" }, { id: "q3" }, { id: "q4" }];
  const answers = { q1: "a", q2: "b", q3: { p1: "r1" } };
  const reveal = { items: { q1: { answer: "a" }, q2: { answer: "c" }, q3: { pairs: {} } } };

  it("keeps fully right items, clears wrong, partly right and unanswered ones", () => {
    const result = {
      graded: true,
      score: 2,
      maxScore: 5,
      items: [
        { itemId: "q1", correct: true, score: 1, maxScore: 1 },
        { itemId: "q2", correct: false, score: 0, maxScore: 1 },
        { itemId: "q3", correct: false, score: 1, maxScore: 2 },
        { itemId: "q4", correct: false, score: 0, maxScore: 1, answered: false },
      ],
    };
    const next = retryState(items, result, answers, reveal);
    expect(next.answers).toEqual({ q1: "a" });
    expect(Object.keys(next.kept)).toEqual(["q1"]);
    expect(next.kept.q1).toEqual({ result: result.items[0], reveal: { answer: "a" } });
  });

  it("starts from scratch after a perfect result or ungraded practice", () => {
    const perfect = { graded: true, score: 2, maxScore: 2, items: [{ itemId: "q1", correct: true }, { itemId: "q2", correct: true }] };
    expect(retryState(items, perfect, answers, reveal)).toEqual({ answers: {}, kept: {} });
    const ungraded = { graded: false, score: 0, maxScore: 0, items: [{ itemId: "q1", correct: null }] };
    expect(retryState(items, ungraded, answers, reveal)).toEqual({ answers: {}, kept: {} });
    expect(retryState(items, null, answers, reveal)).toEqual({ answers: {}, kept: {} });
  });

  it("never keeps an item the learner didn't answer, even if the server marked it right", () => {
    const result = { graded: true, score: 1, maxScore: 2, items: [{ itemId: "q4", correct: true }, { itemId: "q2", correct: false }] };
    expect(retryState(items, result, answers, reveal)).toEqual({ answers: {}, kept: {} });
  });
});

describe("explanation report", () => {
  const ids = (n) => String(n).padStart(24, "0");
  const ex = (id, skill, items, extra = {}) => [ids(id), { _id: ids(id), slug: `ex-${id}`, title: { de: `Ex ${id}` }, skill, items, ...extra }];
  const exercises = new Map([
    ex(1, "grammar", [{ id: "a", type: "mcq", explanation: { en: "Because." } }, { id: "b", type: "text_input", explanation: { en: "  " } }]),
    ex(2, "grammar", [{ id: "a", type: "mcq", explanation: { en: "Because." } }]),
    ex(3, "reading", [{ id: "a", type: "true_false" }]),
    ex(4, "speaking", [{ id: "a", type: "speak_prompt" }]),
    ex(5, "grammar", [{ id: "a", type: "order" }]),
  ]);
  const grammar = new Map([
    [ids(91), { _id: ids(91), slug: "akkusativ", title: { de: "Akkusativ" } }],
    [ids(92), { _id: ids(92), slug: "b", title: { de: "B" } }],
  ]);
  const modules = [{ _id: "m1", slug: "hallo", order: 1 }];
  const lessons = [
    { _id: "l2", moduleId: "m1", slug: "zwei", order: 2, title: { de: "Zwei" }, blocks: [
      { key: "g1", type: "grammar", refId: ids(91) },
      { key: "g2", type: "grammar", refId: ids(92) },
      { key: "p", type: "practice", refId: ids(5) },
    ] },
    { _id: "l1", moduleId: "m1", slug: "eins", order: 1, title: { de: "Eins" }, blocks: [
      { key: "g", type: "grammar", refId: ids(91) },
      { key: "p1", type: "practice", refId: ids(1) },
      { key: "p2", type: "practice", refId: ids(2) },
      { key: "r", type: "reading", refId: ids(3) },
      { key: "s", type: "speaking", refId: ids(4) },
    ] },
  ];

  it("reports per exercise: explained items, the grammar fallback or why there is none", () => {
    const r = explanationReport({ modules, lessons, exercises, grammar });
    expect(r.rows.map((x) => [x.lesson.slug, x.blockKey, x.status, x.explained, x.gradedItems, x.fallback.reason, x.fallback.topic?.slug ?? null])).toEqual([
      ["eins", "p1", "fallback", 1, 2, "linked", "akkusativ"], // a blank explanation doesn't count
      ["eins", "p2", "complete", 1, 1, "linked", "akkusativ"],
      ["eins", "r", "missing", 0, 1, "not_grammar_skill", null],
      ["eins", "s", "ungraded", 0, 0, "not_grammar_skill", null],
      ["zwei", "p", "missing", 0, 1, "several_grammar_topics", null],
    ]);
    expect(r.summary).toEqual({ exercises: 5, gradedItems: 5, explainedItems: 2, ungraded: 1, complete: 1, fallback: 1, missing: 2 });
  });

  it("a grammar step whose topic is missing gives no fallback", () => {
    const r = explanationReport({ modules, lessons: [lessons[1]], exercises, grammar: new Map() });
    expect(r.rows[0]).toMatchObject({ blockKey: "p1", status: "missing", fallback: { reason: "no_grammar_topic", topic: null } });
  });
});
