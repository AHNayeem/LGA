import { describe, expect, it } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { generateModule1Audio, publishLevel, publishModule, seedModule1 } from "@/tests/helpers/curriculum";
import { answersFor } from "@/tests/helpers/answers";
import { ROLES } from "@/lib/auth/roles";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";
import { COLLECTIONS } from "@/lib/db/collections";
import * as curriculum from "@/lib/services/curriculumService";
import * as learning from "@/lib/services/learningService";
import * as journey from "@/lib/services/journeyService";
import { getGrammarTopicContent, getTopicWordCards } from "@/lib/services/practiceService";
import { getExplanationReport } from "@/lib/services/explanationReportService";
import { setPublishStatus } from "@/lib/services/contentService";
import { exerciseRepository, lessonRepository } from "@/lib/repositories/contentRepository";
import { applyExerciseResult, emptyLearnerState } from "@/lib/learning/state";
import { grammarTopics, practiceView } from "@/lib/learning/topics";
import { MODULE_1 } from "@/content/curriculum/a1/module-01/index.js";

// Practice by topic on real (Module 1) content: what the structure exposes, the topic
// pages' reads, identical numbers for guests and signed-in learners, and the explanation
// report on draft content. Practice only reads: no new write path exists.

setupTestDatabase();

const MODULE = { level: "a1", module: "hallo" };
const GUEST = { ip: "203.0.113.9" };

async function publishedModule1() {
  const admin = await createTestUser({ role: ROLES.ADMIN });
  const seeded = await seedModule1();
  await generateModule1Audio();
  await publishModule(admin, seeded.moduleId);
  await publishLevel(admin);
  return { admin, seeded };
}

// The exercises of a lesson, answered (optionally wrong) by a guest and by a signed-in
// learner through their own services.
async function answerLesson(lessonSlug, { user = null, wrongFor = [] } = {}) {
  const lesson = await curriculum.getLearnerLesson(user, { ...MODULE, lesson: lessonSlug });
  const blocks = lesson.blocks.map((b) => ({ key: b.key, type: b.type, ...(b.exercise ? { refId: b.exercise.id } : {}) }));
  let state = emptyLearnerState();
  for (const b of lesson.blocks.filter((x) => x.exercise)) {
    const ex = await exerciseRepository.findById(b.exercise.id);
    const answers = answersFor(ex, b.exercise.id, { wrong: wrongFor.includes(ex.slug) });
    if (user) await learning.submitExerciseAttempt(user, { lessonId: lesson.lesson.id, exerciseId: b.exercise.id, answers });
    else {
      const graded = await learning.gradeExerciseAsGuest(GUEST, { lessonId: lesson.lesson.id, exerciseId: b.exercise.id, answers });
      state = applyExerciseResult(state, { lessonId: lesson.lesson.id, exerciseId: b.exercise.id, skill: graded.skill, result: graded.result, blocks });
    }
  }
  return state;
}

describe("practice structure", () => {
  it("exposes the taught grammar topics and the words by topic of live lessons only", async () => {
    await publishedModule1();
    const structure = await journey.getLevelStructure("a1", { vocabTopics: true });
    const slugs = Object.values(structure.grammar).map((g) => g.slug);
    expect(slugs.sort()).toEqual(["das-alphabet", "du-und-sie", "satzbau-position-2", "verben-praesens-modul-1"]);
    expect(Object.keys(structure.vocabTopics).sort()).toEqual(["alphabet", "begruessung", "fragen", "herkunft", "kurs", "laender", "personen", "sprachen", "vorstellung", "zahlen"]);
    expect(structure.vocabTopics.zahlen).toHaveLength(MODULE_1.vocabulary.filter((v) => v.topics.includes("zahlen")).length);
    // The default structure (dashboard, review) doesn't carry the word lists.
    expect((await journey.getLevelStructure("a1")).vocabTopics).toBeUndefined();

    const view = practiceView(structure, emptyLearnerState());
    const topics = view.grammar.flatMap((g) => g.topics);
    expect(topics.map((t) => t.slug)).toEqual(["du-und-sie", "verben-praesens-modul-1", "satzbau-position-2", "das-alphabet"]);
    expect(topics.find((t) => t.slug === "verben-praesens-modul-1")).toMatchObject({ total: 2, status: "new", performance: null });
    expect(topics.find((t) => t.slug === "das-alphabet")).toMatchObject({ total: 0, status: "no_exercises" });
    // The module test's grammar exercise belongs to no topic (its lesson teaches none).
    const linked = grammarTopics(structure, null).flatMap((t) => t.exercises.map((e) => e.id));
    const testEx = await exerciseRepository.findOne({ slug: "m1-test-grammatik" });
    expect(linked).not.toContain(String(testEx._id));
  });

  it("a lesson taken offline takes its grammar topic and its own words with it", async () => {
    const { admin } = await publishedModule1();
    const lesson = await lessonRepository.findOne({ slug: "das-alphabet" });
    await setPublishStatus(admin, "lessons", { id: String(lesson._id), to: "unpublished" });
    const structure = await journey.getLevelStructure("a1", { vocabTopics: true });
    expect(Object.values(structure.grammar).map((g) => g.slug)).not.toContain("das-alphabet");
    expect(structure.vocabTopics.alphabet).toBeUndefined();
    await expect(getGrammarTopicContent(structure, "das-alphabet")).rejects.toBeInstanceOf(NotFoundError);
    await expect(getTopicWordCards(structure, "alphabet")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("nothing is exposed while the content is draft", async () => {
    await seedModule1();
    await expect(journey.getLevelStructure("a1", { vocabTopics: true })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("topic pages", () => {
  it("a grammar topic's full explanation; unknown and malformed slugs are 404", async () => {
    await publishedModule1();
    const structure = await journey.getLevelStructure("a1");
    const content = await getGrammarTopicContent(structure, "du-und-sie");
    const def = MODULE_1.grammar.find((g) => g.slug === "du-und-sie");
    expect(content.title).toEqual(def.title);
    expect(content.sections).toHaveLength(def.sections.length);
    for (const bad of ["unbekannt", "../admin", "", null]) await expect(getGrammarTopicContent(structure, bad)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("a word topic's flashcards: every word in course order, with article, audio and no learner data", async () => {
    await publishedModule1();
    const structure = await journey.getLevelStructure("a1", { vocabTopics: true });
    const { slug, cards } = await getTopicWordCards(structure, "begruessung");
    expect(slug).toBe("begruessung");
    expect(cards.map((c) => c.id)).toEqual(structure.vocabTopics.begruessung);
    expect(cards.every((c) => c.audio && c.meanings?.en)).toBe(true);
    expect(cards.every((c) => c.review === null)).toBe(true);
    const nouns = cards.filter((c) => c.pos === "noun");
    expect(nouns.every((c) => ["der", "die", "das"].includes(c.article) && c.display.startsWith(`${c.article} `))).toBe(true);
    await expect(getTopicWordCards(structure, "gibt-es-nicht")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rating a topic word goes into the same review schedule as everywhere else", async () => {
    await publishedModule1();
    const user = await createTestUser();
    const structure = await journey.getLevelStructure("a1", { vocabTopics: true });
    const { cards } = await getTopicWordCards(structure, "zahlen");
    await learning.reviewVocabulary(user, { vocabId: cards[0].id, result: "unknown" });
    const state = await journey.loadLearnerState(user, structure);
    expect(state.vocab[cards[0].id]).toMatchObject({ box: 1, lastResult: "unknown" });
    expect(practiceView(structure, state).words.find((w) => w.slug === "zahlen")).toMatchObject({ seen: 1 });
  });
});

describe("topic numbers for guests and signed-in learners", () => {
  it("are identical for the same answers, and only attempted exercises make a topic weak", async () => {
    await publishedModule1();
    const user = await createTestUser();
    const wrongFor = ["m1-heissen-sein"];
    const guestState = await answerLesson("ich-heisse", { wrongFor });
    await answerLesson("ich-heisse", { user, wrongFor });

    const structure = await journey.getLevelStructure("a1");
    const userState = await journey.loadLearnerState(user, structure);
    const pick = (state) => grammarTopics(structure, state).map(({ slug, status, attempted, total, performance, progress, toImprove }) => ({ slug, status, attempted, total, performance, progress, toImprove }));
    expect(pick(userState)).toEqual(pick(guestState));

    const praesens = pick(userState).find((t) => t.slug === "verben-praesens-modul-1");
    expect(praesens).toMatchObject({ attempted: 2, total: 2, toImprove: 1, status: "needs_practice" });
    expect(praesens.performance).toBeLessThan(0.75);
    // Topics of lessons not touched stay "new", never weak.
    expect(pick(userState).find((t) => t.slug === "satzbau-position-2")).toMatchObject({ status: "new", performance: null });
  });

  it("practice reads write nothing", async () => {
    await publishedModule1();
    const db = await getDb();
    const before = await Promise.all([COLLECTIONS.attempts, COLLECTIONS.userProgress, COLLECTIONS.userVocabulary].map((c) => db.collection(c).countDocuments()));
    const structure = await journey.getLevelStructure("a1", { vocabTopics: true });
    await getGrammarTopicContent(structure, "du-und-sie");
    await getTopicWordCards(structure, "zahlen");
    practiceView(structure, emptyLearnerState());
    const after = await Promise.all([COLLECTIONS.attempts, COLLECTIONS.userProgress, COLLECTIONS.userVocabulary].map((c) => db.collection(c).countDocuments()));
    expect(after).toEqual(before);
  });
});

describe("explanation report", () => {
  it("covers draft content, for content reviewers only", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const learner = await createTestUser();
    await seedModule1();
    await expect(getExplanationReport(learner, "a1")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getExplanationReport(admin, "zz")).rejects.toBeInstanceOf(NotFoundError);

    const r = await getExplanationReport(admin, "a1");
    expect(r.rows).toHaveLength(MODULE_1.lessons.flatMap((l) => l.blocks.filter((b) => b.exercise)).length);
    const graded = MODULE_1.exercises.flatMap((e) => e.items).filter((i) => i.type !== "speak_prompt");
    expect(r.summary.gradedItems).toBe(graded.length);
    expect(r.summary.explainedItems).toBe(graded.filter((i) => i.explanation).length);
    expect(r.summary.ungraded + r.summary.complete + r.summary.fallback + r.summary.missing).toBe(r.summary.exercises);

    const row = (slug) => r.rows.find((x) => x.exercise.slug === slug);
    expect(row("m1-heissen-sein").fallback).toEqual({ reason: "linked", topic: { slug: "verben-praesens-modul-1", title: MODULE_1.grammar.find((g) => g.slug === "verben-praesens-modul-1").title } });
    expect(row("m1-test-grammatik").fallback).toEqual({ reason: "no_grammar_topic", topic: null });
    expect(row("m1-begruessung-hoeren").fallback.reason).toBe("not_grammar_skill");
    expect(row("m1-vorstellen-sprechen").status).toBe("ungraded");
  });
});
