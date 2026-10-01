import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { generateModule1Audio, publishLevel, publishModule, seedModule1 } from "@/tests/helpers/curriculum";
import { answersFor } from "@/tests/helpers/answers";
import { ROLES } from "@/lib/auth/roles";
import { AuthenticationError, ConflictError, NotFoundError, RateLimitError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";
import { COLLECTIONS } from "@/lib/db/collections";
import * as curriculum from "@/lib/services/curriculumService";
import * as learning from "@/lib/services/learningService";
import * as exams from "@/lib/services/examService";
import * as journey from "@/lib/services/journeyService";
import { canReadMedia, openMedia } from "@/lib/services/mediaService";
import { createContent, setPublishStatus, transitionReview } from "@/lib/services/contentService";
import { exerciseRepository, examRepository } from "@/lib/repositories/contentRepository";
import { GUEST_RATE_LIMITS } from "@/lib/security/guestRateLimit";
import { applyBlockDone, applyExerciseResult, applyVocabReview, emptyLearnerState } from "@/lib/learning/state";
import { homeView, levelOverview, mistakes } from "@/lib/learning/journey";

// Guest learning: the same published content and server grading as for signed-in
// learners, with nothing stored for the guest. The only write a guest causes is the
// per-IP rate-limit counter.

setupTestDatabase();

const MODULE = { level: "a1", module: "hallo" };
const GUEST = { ip: "203.0.113.7" };

async function publishedModule1() {
  const admin = await createTestUser({ role: ROLES.ADMIN });
  const seeded = await seedModule1();
  await generateModule1Audio();
  await publishModule(admin, seeded.moduleId);
  await publishLevel(admin);
  return { admin, seeded };
}

// Every collection, rate limits aside (the one thing a guest may write).
async function snapshot() {
  const db = await getDb();
  const out = {};
  for (const c of await db.collections()) {
    if (c.collectionName === COLLECTIONS.rateLimits) continue;
    out[c.collectionName] = await c.find({}).sort({ _id: 1 }).toArray();
  }
  return JSON.parse(JSON.stringify(out));
}

// Plays a lesson the way a guest's browser does: reads come from the server with no
// state, grading comes from the server, and the browser applies it to its own state.
async function playLessonAsGuest(lessonSlug, state = emptyLearnerState(), { wrongFor = [] } = {}) {
  const lesson = await curriculum.getLearnerLesson(null, { ...MODULE, lesson: lessonSlug });
  const lessonId = lesson.lesson.id;
  const blocks = lesson.blocks.map((b) => ({ key: b.key, type: b.type, ...(b.exercise ? { refId: b.exercise.id } : {}) }));
  for (const block of lesson.blocks) {
    if (block.type === "vocabulary") {
      for (const card of block.cards) state = applyVocabReview(state, { vocabId: card.id, result: "known" });
      state = applyBlockDone(state, { lessonId, blockKey: block.key, blocks });
    } else if (block.type === "intro" || block.type === "grammar") {
      state = applyBlockDone(state, { lessonId, blockKey: block.key, blocks });
    } else {
      const ex = await exerciseRepository.findById(block.exercise.id);
      const graded = await learning.gradeExerciseAsGuest(GUEST, {
        lessonId,
        exerciseId: block.exercise.id,
        answers: answersFor(ex, block.exercise.id, { wrong: wrongFor.includes(ex.slug) }),
      });
      state = applyExerciseResult(state, { lessonId, exerciseId: block.exercise.id, skill: graded.skill, result: graded.result, blocks });
    }
  }
  return { lesson, state };
}

// The same lesson through the signed-in services.
async function playLessonAsUser(user, lessonSlug, { wrongFor = [] } = {}) {
  const lesson = await curriculum.getLearnerLesson(user, { ...MODULE, lesson: lessonSlug });
  for (const block of lesson.blocks) {
    if (block.type === "vocabulary") {
      for (const card of block.cards) await learning.reviewVocabulary(user, { vocabId: card.id, result: "known" });
      await learning.completeContentBlock(user, { lessonId: lesson.lesson.id, blockKey: block.key });
    } else if (block.type === "intro" || block.type === "grammar") {
      await learning.completeContentBlock(user, { lessonId: lesson.lesson.id, blockKey: block.key });
    } else {
      const ex = await exerciseRepository.findById(block.exercise.id);
      await learning.submitExerciseAttempt(user, { lessonId: lesson.lesson.id, exerciseId: block.exercise.id, answers: answersFor(ex, block.exercise.id, { wrong: wrongFor.includes(ex.slug) }) });
    }
  }
}

describe("guests read the same published content", () => {
  it("level, module and lesson are readable without an account and carry no learner state", async () => {
    await publishedModule1();
    const level = await curriculum.getLearnerLevel(null, "a1");
    expect(level.modules.map((m) => m.module.slug)).toEqual(["hallo"]);
    expect(level.modules[0].completion.blocksDone).toBe(0);
    const lesson = await curriculum.getLearnerLesson(null, { ...MODULE, lesson: "hallo-und-tschuess" });
    expect(lesson.available).toBe(true);
    expect(lesson.blocks.every((b) => !b.done)).toBe(true);
    expect(lesson.blocks.filter((b) => b.exercise).every((b) => b.stats === null)).toBe(true);
    // No answer keys in the guest payload either.
    expect(JSON.stringify(lesson)).not.toMatch(/"answer"|"accepted"|"modelAnswer"/);
  });

  it("drafts stay invisible to guests", async () => {
    await seedModule1();
    await expect(curriculum.getLearnerLevel(null, "a1")).rejects.toBeInstanceOf(NotFoundError);
    await expect(curriculum.getLearnerLesson(null, { ...MODULE, lesson: "hallo-und-tschuess" })).rejects.toBeInstanceOf(NotFoundError);
    const db = await getDb();
    const lesson = await db.collection("lessons").findOne({ slug: "hallo-und-tschuess" });
    const block = lesson.blocks.find((b) => b.refId);
    await expect(learning.gradeExerciseAsGuest(GUEST, { lessonId: String(lesson._id), exerciseId: String(block.refId), answers: {} })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("writes still require an account", async () => {
    await publishedModule1();
    const lesson = await curriculum.getLearnerLesson(null, { ...MODULE, lesson: "hallo-und-tschuess" });
    await expect(learning.completeContentBlock(null, { lessonId: lesson.lesson.id, blockKey: "intro" })).rejects.toBeInstanceOf(AuthenticationError);
    await expect(learning.submitExerciseAttempt(null, { lessonId: lesson.lesson.id, exerciseId: lesson.blocks.find((b) => b.exercise).exercise.id, answers: {} })).rejects.toBeInstanceOf(AuthenticationError);
  });
});

describe("guest grading", () => {
  it("grades on the server like a signed-in submission and stores nothing but the rate-limit counter", async () => {
    await publishedModule1();
    const before = await snapshot();
    const { state } = await playLessonAsGuest("hallo-und-tschuess", emptyLearnerState(), { wrongFor: ["m1-formell-informell"] });
    const cards = await learning.getVocabularyCardsAsGuest(GUEST, { vocabIds: Object.keys(state.vocab).slice(0, 3) });
    expect(cards.cards).toHaveLength(3);
    expect(await snapshot()).toEqual(before);

    const db = await getDb();
    const counters = await db.collection(COLLECTIONS.rateLimits).find({ key: { $regex: `^guest:ip:${GUEST.ip}:` } }).toArray();
    expect(counters).toHaveLength(1);
    expect(counters[0].count).toBeGreaterThan(0);
    // No learner documents of any kind exist.
    for (const c of [COLLECTIONS.attempts, COLLECTIONS.userProgress, COLLECTIONS.userVocabulary, COLLECTIONS.examAttempts]) {
      expect(await db.collection(c).countDocuments({}), c).toBe(0);
    }
  });

  it("returns the reveal and the correct score; malformed answers count as wrong", async () => {
    await publishedModule1();
    const lesson = await curriculum.getLearnerLesson(null, { ...MODULE, lesson: "hallo-und-tschuess" });
    const block = lesson.blocks.find((b) => b.exercise && b.exercise.maxScore > 0);
    const ex = await exerciseRepository.findById(block.exercise.id);
    const right = await learning.gradeExerciseAsGuest(GUEST, { lessonId: lesson.lesson.id, exerciseId: block.exercise.id, answers: answersFor(ex, block.exercise.id) });
    expect(right.result).toMatchObject({ ratio: 1, passed: true });
    expect(right.reveal.items).toBeTruthy();
    expect(right.attemptId).toBeNull();
    const junk = await learning.gradeExerciseAsGuest(GUEST, { lessonId: lesson.lesson.id, exerciseId: block.exercise.id, answers: { q1: { forged: true }, score: 100 } });
    expect(junk.result.score).toBe(0);
  });

  it("an exercise must belong to the lesson it is graded under", async () => {
    await publishedModule1();
    const l1 = await curriculum.getLearnerLesson(null, { ...MODULE, lesson: "hallo-und-tschuess" });
    const l2 = await curriculum.getLearnerLesson(null, { ...MODULE, lesson: "ich-heisse" });
    const foreign = l2.blocks.find((b) => b.exercise).exercise.id;
    await expect(learning.gradeExerciseAsGuest(GUEST, { lessonId: l1.lesson.id, exerciseId: foreign, answers: {} })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("is rate-limited per IP", async () => {
    await publishedModule1();
    const lesson = await curriculum.getLearnerLesson(null, { ...MODULE, lesson: "hallo-und-tschuess" });
    const exerciseId = lesson.blocks.find((b) => b.exercise).exercise.id;
    const policy = GUEST_RATE_LIMITS.learningByIp;
    const windowStart = Math.floor(Date.now() / policy.windowMs) * policy.windowMs;
    const db = await getDb();
    await db.collection(COLLECTIONS.rateLimits).insertOne({ key: `${policy.prefix}:${GUEST.ip}:${windowStart}`, count: policy.limit, expiresAt: new Date(windowStart + policy.windowMs) });
    await expect(learning.gradeExerciseAsGuest(GUEST, { lessonId: lesson.lesson.id, exerciseId, answers: {} })).rejects.toBeInstanceOf(RateLimitError);
    await expect(learning.getVocabularyCardsAsGuest(GUEST, { vocabIds: [new ObjectId().toHexString()] })).rejects.toBeInstanceOf(RateLimitError);
    // Another IP is unaffected.
    await expect(learning.gradeExerciseAsGuest({ ip: "198.51.100.1" }, { lessonId: lesson.lesson.id, exerciseId, answers: {} })).resolves.toBeTruthy();
  });

  it("the guest's own numbers are the server's numbers for the same results", async () => {
    await publishedModule1();
    const user = await createTestUser();
    const wrongFor = ["m1-formell-informell"];
    await playLessonAsUser(user, "hallo-und-tschuess", { wrongFor });
    const { state: guestState } = await playLessonAsGuest("hallo-und-tschuess", emptyLearnerState(), { wrongFor });

    const structure = await journey.getLevelStructure("a1");
    const userState = await journey.loadLearnerState(user, structure);
    const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (["at", "completedAt", "passedAt", "dueAt"].includes(k) ? undefined : v)));
    const u = levelOverview(structure, userState);
    const g = levelOverview(structure, guestState);
    expect(strip(g.modules)).toEqual(strip(u.modules));
    expect(strip(g.skills)).toEqual(strip(u.skills));
    expect(g.continueAt).toEqual(u.continueAt);
    expect(strip(mistakes(structure, guestState))).toEqual(strip(mistakes(structure, userState)));
    expect(mistakes(structure, userState).length).toBeGreaterThan(0);
    // And the signed-in module page (curriculumService) agrees with the journey view.
    const mod = await curriculum.getLearnerModule(user, "a1", "hallo");
    expect(mod.completion).toEqual(u.modules[0].completion);
    expect(mod.mastery).toEqual(u.modules[0].mastery);
    expect(homeView(structure, guestState).overview.lessons).toEqual(homeView(structure, userState).overview.lessons);
  });
});

describe("guest practice exams", () => {
  const de = (s) => ({ de: s });
  async function publish(admin, kind, id) {
    await transitionReview(admin, kind, { id, to: "reviewed" });
    await transitionReview(admin, kind, { id, to: "approved" });
    return setPublishStatus(admin, kind, { id, to: "published" });
  }
  async function publishedExam() {
    const { admin } = await publishedModule1();
    const ex = await createContent(admin, "exercises", {
      levelCode: "A1",
      slug: "x-lesen",
      skill: "reading",
      title: de("Lesen"),
      sourceType: "original",
      stimulus: { text: de("Anna wohnt in Köln."), textKind: "message" },
      items: [
        { id: "q1", type: "true_false", statement: de("Anna wohnt in Köln."), answer: true },
        { id: "q2", type: "match", pairs: [{ id: "p1", left: de("ich"), right: de("bin") }, { id: "p2", left: de("du"), right: de("bist") }] },
      ],
    });
    await publish(admin, "exercises", ex.id);
    const exam = await createContent(admin, "exams", {
      levelCode: "A1",
      slug: "probe",
      order: 1,
      title: de("Probe"),
      durationMinutes: 30,
      passThreshold: 0.6,
      reviewPolicy: "marks",
      sourceType: "original",
      sections: [{ key: "lesen", title: de("Lesen"), exerciseIds: [ex.id] }],
    });
    await publish(admin, "exams", exam.id);
    return { admin, exam, ex };
  }

  it("takes and grades a published exam without storing an attempt", async () => {
    const { exam } = await publishedExam();
    const before = await snapshot();
    const overview = await exams.getLearnerExam(null, { level: "a1", exam: "probe" });
    expect(overview.history).toEqual([]);
    const { examId, version, paper } = await exams.getGuestExamPaper({ level: "a1", exam: "probe" });
    expect(examId).toBe(exam.id);
    expect(JSON.stringify(paper)).not.toMatch(/"answer"|"accepted"/);
    const stored = await examRepository.findById(examId);
    const exDoc = await exerciseRepository.findOne({ slug: "x-lesen" });
    const answers = { [String(exDoc._id)]: answersFor(exDoc, String(exDoc._id), { seedPrefix: `guest:${examId}:${stored.version}` }) };
    const graded = await exams.gradeExamAsGuest(GUEST, { examId, version, answers });
    expect(graded.view.result).toMatchObject({ score: 3, maxScore: 3, passed: true });
    // The exam's own review policy applies: "marks" shows right/wrong but no answer key.
    expect(graded.view.reviewPolicy).toBe("marks");
    expect(JSON.stringify(graded.view.review)).not.toMatch(/"reveal"/);
    expect(await snapshot()).toEqual(before);
  });

  it("a paper from an older version of the exam is rejected, drafts are not available", async () => {
    const { exam } = await publishedExam();
    const { version } = await exams.getGuestExamPaper({ level: "a1", exam: "probe" });
    await expect(exams.gradeExamAsGuest(GUEST, { examId: exam.id, version: version + 1, answers: {} })).rejects.toBeInstanceOf(ConflictError);
    const db = await getDb();
    await db.collection("exams").updateOne({ _id: new ObjectId(exam.id) }, { $set: { publishStatus: "unpublished" } });
    await expect(exams.getGuestExamPaper({ level: "a1", exam: "probe" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(exams.gradeExamAsGuest(GUEST, { examId: exam.id, version, answers: {} })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("media for guests", () => {
  it("guests hear curriculum audio but never a learner's private recording", async () => {
    await publishedModule1();
    const owner = await createTestUser();
    const db = await getDb();
    const tts = await db.collection(COLLECTIONS.mediaAssets).findOne({ source: "tts" });
    expect(await canReadMedia(null, tts)).toBe(true);
    await expect(openMedia(null, String(tts._id))).resolves.toBeTruthy();

    const { insertedId } = await db.collection(COLLECTIONS.mediaAssets).insertOne({
      kind: "audio",
      mime: "audio/webm",
      source: "learner",
      visibility: "private",
      ownerId: new ObjectId(owner.id),
      storage: { driver: "memory", key: "rec-1" },
      recording: { status: "attached" },
      createdAt: new Date(),
    });
    const recording = await db.collection(COLLECTIONS.mediaAssets).findOne({ _id: insertedId });
    expect(await canReadMedia(null, recording)).toBe(false);
    expect(await canReadMedia({ id: new ObjectId().toHexString(), role: ROLES.USER }, recording)).toBe(false);
    expect(await canReadMedia({ id: owner.id, role: ROLES.USER }, recording)).toBe(true);
    await expect(openMedia(null, String(insertedId))).rejects.toBeInstanceOf(NotFoundError);

    // A linked upload no live content uses stays closed to guests too.
    const linked = { visibility: "linked", status: "active", _id: new ObjectId() };
    expect(await canReadMedia(null, linked)).toBe(false);
  });
});
