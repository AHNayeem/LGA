import { describe, expect, it } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { generateModule1Audio, publishLevel, publishModule, seedModule1 } from "@/tests/helpers/curriculum";
import { answersFor } from "@/tests/helpers/answers";
import { MODULE_1 } from "@/content/curriculum/a1/module-01/index.js";
import { ROLES } from "@/lib/auth/roles";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError, AuthenticationError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";
import * as content from "@/lib/services/contentService";
import * as curriculum from "@/lib/services/curriculumService";
import * as learning from "@/lib/services/learningService";
import { seedCurriculumModule } from "@/lib/services/seedService";
import { exerciseRepository } from "@/lib/repositories/contentRepository";
import { exerciseSchema } from "@/lib/validation/content";

setupTestDatabase();

const MODULE = { level: "a1", module: "hallo" };

async function publishedModule1() {
  const admin = await createTestUser({ role: ROLES.ADMIN });
  const seeded = await seedModule1();
  await generateModule1Audio();
  const results = await publishModule(admin, seeded.moduleId);
  await publishLevel(admin);
  return { admin, seeded, results };
}

async function exerciseDoc(slug) {
  return exerciseRepository.findOne({ levelCode: "A1", slug });
}

// Plays a lesson the way the UI does: read content blocks, rate every card, answer exercises.
async function completeLesson(learner, lessonSlug, { wrongFor = [] } = {}) {
  const lesson = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: lessonSlug });
  for (const block of lesson.blocks) {
    if (block.type === "vocabulary") {
      for (const card of block.cards) await learning.reviewVocabulary(learner, { vocabId: card.id, result: "known" });
      await learning.completeContentBlock(learner, { lessonId: lesson.lesson.id, blockKey: block.key });
    } else if (block.type === "intro" || block.type === "grammar") {
      await learning.completeContentBlock(learner, { lessonId: lesson.lesson.id, blockKey: block.key });
    } else {
      const ex = await exerciseRepository.findById(block.exercise.id);
      const wrong = wrongFor.includes(ex.slug);
      await learning.submitExerciseAttempt(learner, {
        lessonId: lesson.lesson.id,
        exerciseId: block.exercise.id,
        answers: answersFor(ex, block.exercise.id, { wrong }),
      });
    }
  }
  return curriculum.getLearnerLesson(learner, { ...MODULE, lesson: lessonSlug });
}

describe("Module 1 seeding", () => {
  it("creates everything as AI-drafted drafts and is idempotent", async () => {
    const first = await seedModule1();
    const total = MODULE_1.vocabulary.length + MODULE_1.grammar.length + MODULE_1.exercises.length + 1 + MODULE_1.lessons.length;
    expect(first.inserted).toBe(total);

    const db = await getDb();
    for (const col of ["vocabulary", "grammarTopics", "exercises", "modules", "lessons"]) {
      const statuses = await db.collection(col).distinct("reviewStatus");
      expect(statuses, col).toEqual(["draft"]);
      expect(await db.collection(col).distinct("publishStatus"), col).toEqual(["unpublished"]);
      expect(await db.collection(col).distinct("sourceType"), col).toEqual(["ai_generated"]);
    }

    const again = await seedModule1();
    expect(again).toMatchObject({ inserted: 0, updated: 0, unchanged: total });
  });

  it("--update sends only changed items back to draft", async () => {
    await publishedModule1();
    const changed = structuredClone(MODULE_1);
    changed.exercises[0].title = { de: "Was sagen Sie? (neu)", en: "What do you say?" };
    const res = await seedCurriculumModule(changed, { update: true });
    expect(res).toMatchObject({ inserted: 0, updated: 1 });

    const ex = await exerciseDoc(changed.exercises[0].slug);
    expect(ex).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished", version: 2 });
    const other = await exerciseDoc(changed.exercises[1].slug);
    expect(other).toMatchObject({ reviewStatus: "approved", publishStatus: "published", version: 1 });
  });
});

describe("review workflow and publish readiness", () => {
  it("a USER cannot review, bulk-publish or read the module review", async () => {
    const user = await createTestUser();
    const { moduleId } = await seedModule1();
    await expect(content.bulkModuleTransition(user, moduleId, "review")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.bulkModuleTransition(user, moduleId, "publish")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.getModuleReview(user, moduleId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("bulk steps never skip a stage", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const { moduleId } = await seedModule1();
    expect((await content.bulkModuleTransition(admin, moduleId, "approve")).changed).toBe(0); // nothing is reviewed yet
    expect((await content.bulkModuleTransition(admin, moduleId, "publish")).changed).toBe(0); // nothing is approved yet
    const reviewed = await content.bulkModuleTransition(admin, moduleId, "review");
    expect(reviewed.failed).toEqual([]);
    const db = await getDb();
    expect(await db.collection("exercises").distinct("reviewStatus")).toEqual(["reviewed"]);
    await expect(content.bulkModuleTransition(admin, moduleId, "delete-all")).rejects.toBeInstanceOf(ValidationError);
  });

  it("listening exercises need generated audio and lessons need published content", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const { moduleId } = await seedModule1();
    await content.bulkModuleTransition(admin, moduleId, "review");
    await content.bulkModuleTransition(admin, moduleId, "approve");

    const blocked = await content.bulkModuleTransition(admin, moduleId, "publish");
    const failedKinds = new Set(blocked.failed.map((f) => f.kind));
    expect(failedKinds).toEqual(new Set(["exercises", "lessons"]));
    expect(blocked.failed.find((f) => f.kind === "exercises").message).toMatch(/audio/);
    expect(blocked.failed.find((f) => f.kind === "lessons").message).toMatch(/not published/);
    const review = await content.getModuleReview(admin, moduleId);
    expect(review.exercises.filter((e) => e.missingAudio > 0).length).toBeGreaterThan(0);

    const audio = await generateModule1Audio();
    expect(audio.failed).toEqual([]);
    const retry = await content.bulkModuleTransition(admin, moduleId, "publish");
    expect(retry.failed).toEqual([]);
    const after = await content.getModuleReview(admin, moduleId);
    expect(after.exercises.every((e) => e.missingAudio === 0 && e.publishStatus === "published")).toBe(true);
    expect(after.lessons.every((l) => l.publishStatus === "published")).toBe(true);
  });
});

describe("learner visibility", () => {
  it("unpublished content is invisible and cannot be submitted to", async () => {
    const learner = await createTestUser();
    await seedModule1();
    await expect(curriculum.getLearnerModule(learner, "a1", "hallo")).rejects.toBeInstanceOf(NotFoundError);
    const ex = await exerciseDoc("m1-gruessen-situationen");
    const lessonId = String((await (await getDb()).collection("lessons").findOne({}))._id);
    await expect(
      learning.submitExerciseAttempt(learner, { lessonId, exerciseId: String(ex._id), answers: {} }),
    ).rejects.toBeInstanceOf(NotFoundError);
    const dash = await learning.getLearnerDashboard(learner);
    expect(dash.current).toBeNull();
  });

  it("the whole chain must be live: an unpublished level hides published modules", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const learner = await createTestUser();
    const { moduleId } = await seedModule1();
    await generateModule1Audio();
    await publishModule(admin, moduleId);
    await expect(curriculum.getLearnerModule(learner, "a1", "hallo")).rejects.toBeInstanceOf(NotFoundError);
    await publishLevel(admin);
    await expect(curriculum.getLearnerModule(learner, "a1", "hallo")).resolves.toBeTruthy();
  });

  it("editing an approved exercise hides its lesson until re-approved (fail closed)", async () => {
    const { admin } = await publishedModule1();
    const learner = await createTestUser();
    const ex = await exerciseDoc("m1-gruessen-situationen");
    const raw = MODULE_1.exercises.find((e) => e.slug === ex.slug);
    const input = { ...exerciseSchema.parse({ ...raw, levelCode: "A1", refs: [], ...MODULE_1.provenance }) };
    await content.updateContent(admin, "exercises", String(ex._id), ex.version, { ...input, title: { de: "Neu" } });

    const lesson = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: "hallo-und-tschuess" });
    expect(lesson.available).toBe(false);
    expect(lesson.blocks).toEqual([]);
    const mod = await curriculum.getLearnerModule(learner, "a1", "hallo");
    expect(mod.lessons.map((l) => l.slug)).not.toContain("hallo-und-tschuess");
    await expect(
      learning.submitExerciseAttempt(learner, { lessonId: lesson.lesson.id, exerciseId: String(ex._id), answers: {} }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("the learner payload contains no answer keys, and audio comes from generated assets", async () => {
    await publishedModule1();
    const learner = await createTestUser();
    const lesson = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: "zahlen-0-bis-20" });
    const json = JSON.stringify(lesson);
    expect(json).not.toMatch(/"answer"|"accepted"|"modelAnswer"|"explanation"|"alternatives"/);
    // The dictation audio says the number; its text must not leak (production-style resolver).
    const listening = lesson.blocks.find((b) => b.key === "zahlen-hoeren");
    expect(listening.exercise.items.every((i) => i.audio.type === "asset" && i.audio.url.startsWith("/api/media/"))).toBe(true);
    expect(listening.exercise.itemAudioMaxPlays).toBe(2);
  });
});

describe("Module 1 learner journey", () => {
  it("attempts, lesson completion, module progress, mastery and vocabulary state", async () => {
    await publishedModule1();
    const learner = await createTestUser();

    // Start: nothing done, nothing mastered.
    let mod = await curriculum.getLearnerModule(learner, "a1", "hallo");
    expect(mod.lessons).toHaveLength(6);
    expect(mod.completion).toMatchObject({ lessonsCompleted: 0, percent: 0 });
    expect(mod.mastery.mastered).toBe(false);
    expect(mod.nextLesson.slug).toBe("hallo-und-tschuess");

    const l1 = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: "hallo-und-tschuess" });
    const lessonId = l1.lesson.id;
    const vocabBlock = l1.blocks.find((b) => b.type === "vocabulary");
    const exBlock = l1.blocks.find((b) => b.type === "practice");

    // Exercise blocks can't be ticked off; vocabulary needs every card rated.
    await expect(learning.completeContentBlock(learner, { lessonId, blockKey: exBlock.key })).rejects.toBeInstanceOf(ConflictError);
    await expect(learning.completeContentBlock(learner, { lessonId, blockKey: vocabBlock.key })).rejects.toBeInstanceOf(ConflictError);
    await expect(learning.completeContentBlock(learner, { lessonId, blockKey: "nope" })).rejects.toBeInstanceOf(NotFoundError);

    // Vocabulary review state.
    const first = await learning.reviewVocabulary(learner, { vocabId: vocabBlock.cards[0].id, result: "unknown" });
    expect(first).toMatchObject({ box: 1, reps: 1, lapses: 0 });
    for (const card of vocabBlock.cards) await learning.reviewVocabulary(learner, { vocabId: card.id, result: "known" });
    const again = await learning.reviewVocabulary(learner, { vocabId: vocabBlock.cards[1].id, result: "known" });
    expect(again.box).toBe(2);
    const vocabDone = await learning.completeContentBlock(learner, { lessonId, blockKey: vocabBlock.key });
    expect(vocabDone.lesson.done).toBe(1);

    // Wrong answers: attempt stored, block not done.
    const ex = await exerciseRepository.findById(exBlock.exercise.id);
    const wrong = await learning.submitExerciseAttempt(learner, {
      lessonId,
      exerciseId: exBlock.exercise.id,
      answers: answersFor(ex, exBlock.exercise.id, { wrong: true }),
    });
    expect(wrong.result).toMatchObject({ score: 0, passed: false });
    expect(wrong.blockDone).toBe(false);
    expect(wrong.reveal.items.q1.answer).toBe("a"); // expected answers only after submitting

    // Correct answers: passes, best/last tracked.
    const right = await learning.submitExerciseAttempt(learner, {
      lessonId,
      exerciseId: exBlock.exercise.id,
      answers: answersFor(ex, exBlock.exercise.id),
    });
    expect(right.result).toMatchObject({ score: 6, maxScore: 6, ratio: 1, passed: true });
    expect(right.blockDone).toBe(true);
    expect(right.stats).toMatchObject({ attempts: 2, bestRatio: 1 });

    const db = await getDb();
    const attempts = await db.collection("attempts").find({ exerciseId: ex._id }).sort({ createdAt: 1 }).toArray();
    expect(attempts).toHaveLength(2);
    expect(attempts.map((a) => a.passed)).toEqual([false, true]);
    expect(attempts[1]).toMatchObject({ exerciseVersion: 1, skill: "vocabulary", blockKey: exBlock.key, levelCode: "A1" });
    expect(String(attempts[1].userId)).toBe(learner.id);

    // Finish lesson 1.
    const done1 = await completeLesson(learner, "hallo-und-tschuess");
    expect(done1.completion.complete).toBe(true);
    expect(done1.completedAt).toBeTruthy();
    mod = await curriculum.getLearnerModule(learner, "a1", "hallo");
    expect(mod.completion.lessonsCompleted).toBe(1);
    expect(mod.nextLesson.slug).toBe("ich-heisse");
    expect(mod.mastery.mastered).toBe(false); // other lessons' exercises count as 0

    // Finish the module.
    for (const l of MODULE_1.lessons.slice(1)) {
      const r = await completeLesson(learner, l.slug);
      expect(r.completion.complete, l.slug).toBe(true);
    }
    mod = await curriculum.getLearnerModule(learner, "a1", "hallo");
    expect(mod.completion).toMatchObject({ lessonsCompleted: 6, percent: 100 });
    expect(mod.nextLesson).toBeNull();
    expect(mod.mastery.mastered).toBe(true);
    for (const s of ["vocabulary", "grammar", "reading", "listening"]) expect(mod.mastery.skills[s].status, s).toBe("met");
    expect(mod.mastery.skills.writing).toMatchObject({ status: "met", required: false });
    expect(mod.mastery.skills.speaking).toMatchObject({ status: "not_assessed", required: false });

    // A later, poor attempt lowers mastery (latest attempt counts) but not completion.
    const grammarTest = await exerciseDoc("m1-test-grammatik");
    const testLesson = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: "modultest" });
    await learning.submitExerciseAttempt(learner, {
      lessonId: testLesson.lesson.id,
      exerciseId: String(grammarTest._id),
      answers: answersFor(grammarTest, String(grammarTest._id), { wrong: true }),
    });
    mod = await curriculum.getLearnerModule(learner, "a1", "hallo");
    expect(mod.completion.lessonsCompleted).toBe(6);
    expect(mod.mastery.skills.grammar.status).toBe("met"); // still ≥ 75% across all grammar exercises
    const breakdownBefore = mod.mastery.breakdown.grammar.ratio;
    expect(breakdownBefore).toBeLessThan(1);

    // Progress is per lesson, not one growing user document.
    expect(await db.collection("userProgress").countDocuments({ userId: attempts[1].userId })).toBe(6);

    // Dashboard.
    const dash = await learning.getLearnerDashboard(learner);
    expect(dash.current.level.code).toBe("A1");
    expect(dash.current.modules[0].completion.percent).toBe(100);
    expect(dash.continueAt).toBeNull();
  });

  it("module mastery needs coverage and the thresholds, not just completion", async () => {
    await publishedModule1();
    const learner = await createTestUser();
    // Complete everything, then make a poor final attempt at the vocabulary test.
    for (const l of MODULE_1.lessons) await completeLesson(learner, l.slug);
    const vocabTest = await exerciseDoc("m1-test-wortschatz");
    const testLesson = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: "modultest" });
    await learning.submitExerciseAttempt(learner, {
      lessonId: testLesson.lesson.id,
      exerciseId: String(vocabTest._id),
      answers: answersFor(vocabTest, String(vocabTest._id), { wrong: true }),
    });
    const mod = await curriculum.getLearnerModule(learner, "a1", "hallo");
    expect(mod.completion.lessonsCompleted).toBe(6); // completion keeps the best result
    expect(mod.mastery.skills.vocabulary.status).toBe("not_met"); // latest attempt drops below 80%
    expect(mod.mastery.mastered).toBe(false);
  });

  it("learner data is isolated between users", async () => {
    await publishedModule1();
    const a = await createTestUser();
    const b = await createTestUser();
    await completeLesson(a, "hallo-und-tschuess");
    const modB = await curriculum.getLearnerModule(b, "a1", "hallo");
    expect(modB.completion.blocksDone).toBe(0);
    const lessonB = await curriculum.getLearnerLesson(b, { ...MODULE, lesson: "hallo-und-tschuess" });
    expect(lessonB.blocks.every((x) => !x.done)).toBe(true);
    expect(lessonB.blocks.find((x) => x.type === "vocabulary").cards.every((c) => c.review === null)).toBe(true);
  });

  it("rejects mismatched, malformed and anonymous submissions", async () => {
    await publishedModule1();
    const learner = await createTestUser();
    const l1 = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: "hallo-und-tschuess" });
    const l2 = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: "ich-heisse" });
    const l2Exercise = l2.blocks.find((b) => b.exercise).exercise.id;

    // An exercise from another lesson can't be submitted under this lesson.
    await expect(
      learning.submitExerciseAttempt(learner, { lessonId: l1.lesson.id, exerciseId: l2Exercise, answers: {} }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      learning.submitExerciseAttempt(learner, { lessonId: "not-an-id", exerciseId: l2Exercise, answers: {} }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      learning.submitExerciseAttempt(learner, { lessonId: { $ne: null }, exerciseId: l2Exercise, answers: {} }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(learning.submitExerciseAttempt(null, { lessonId: l1.lesson.id, exerciseId: l2Exercise, answers: {} })).rejects.toBeInstanceOf(
      AuthenticationError,
    );
    await expect(learning.reviewVocabulary(learner, { vocabId: l2Exercise, result: "known" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(learning.reviewVocabulary(learner, { vocabId: l2Exercise, result: "perfect" })).rejects.toBeInstanceOf(ValidationError);
    await expect(curriculum.getLearnerModule(learner, "a1", "../../etc")).rejects.toBeInstanceOf(NotFoundError);
    await expect(curriculum.getLearnerModule(learner, "Z9", "hallo")).rejects.toBeInstanceOf(NotFoundError);

    // Unknown answer keys are dropped before storage; the attempt stays bounded.
    const exId = l1.blocks.find((b) => b.exercise).exercise.id;
    await learning.submitExerciseAttempt(learner, { lessonId: l1.lesson.id, exerciseId: exId, answers: { q1: "a", evil: "x".repeat(1000) } });
    const stored = await (await getDb()).collection("attempts").findOne({});
    expect(Object.keys(stored.answers)).toEqual(["q1"]);
  });

  it("the review queue shows due, still-published words only", async () => {
    const { admin } = await publishedModule1();
    const learner = await createTestUser();
    const l1 = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: "hallo-und-tschuess" });
    const [c1, c2] = l1.blocks.find((b) => b.type === "vocabulary").cards;
    await learning.reviewVocabulary(learner, { vocabId: c1.id, result: "known" });
    await learning.reviewVocabulary(learner, { vocabId: c2.id, result: "known" });
    expect((await learning.getReviewQueue(learner)).dueCount).toBe(0); // due in 10 minutes, not now

    const db = await getDb();
    await db.collection("userVocabulary").updateMany({}, { $set: { dueAt: new Date(Date.now() - 1000) } });
    let queue = await learning.getReviewQueue(learner);
    expect(queue.dueCount).toBe(2);
    expect(queue.cards[0]).toMatchObject({ display: expect.any(String), review: { box: 1 } });
    expect(JSON.stringify(queue)).not.toContain("userId");

    await content.setPublishStatus(admin, "vocabulary", { id: c1.id, to: "unpublished" });
    queue = await learning.getReviewQueue(learner);
    expect(queue.cards.map((c) => c.id)).toEqual([c2.id]);
  });
});
