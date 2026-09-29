import { describe, expect, it, vi } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { ROLES } from "@/lib/auth/roles";
import { getDb } from "@/lib/db/client";
import { LEVELS } from "@/content/seed/levels";
import { seedLevels } from "@/lib/services/seedService";
import { createContent, getContentForAdmin, saveContent, setPublishStatus, transitionReview, updateContent, bulkExamTransition } from "@/lib/services/contentService";
import {
  getExamAttempt,
  getExamPreview,
  getLearnerExam,
  listLearnerExams,
  previewExamSubmission,
  startExamAttempt,
  submitExamAttempt,
  SUBMIT_GRACE_MS,
} from "@/lib/services/examService";
import { submitExerciseAttempt } from "@/lib/services/learningService";
import { answersFor } from "@/tests/helpers/answers";
import { publishLevel } from "@/tests/helpers/curriculum";

setupTestDatabase();

const de = (s) => ({ de: s });
const en = (s) => ({ en: s });
const provenance = { sourceType: "original" };

const EXERCISES = {
  lesen: {
    slug: "x-lesen",
    skill: "reading",
    title: de("Lesen"),
    stimulus: { text: de("Anna wohnt in Köln. Sie ist Lehrerin."), textKind: "message" },
    items: [
      { id: "q1", type: "true_false", statement: de("Anna wohnt in Köln."), answer: true },
      { id: "q2", type: "true_false", statement: de("Anna ist Ärztin."), answer: false },
      {
        id: "q3",
        type: "mcq",
        prompt: en("Where does Anna live?"),
        options: [
          { id: "a", text: de("in Köln") },
          { id: "b", text: de("in Bonn") },
          { id: "c", text: de("in Wien") },
        ],
        answer: "a",
        explanation: en("The text says: Anna wohnt in Köln."),
      },
    ],
    ...provenance,
  },
  grammatik: {
    slug: "x-grammatik",
    skill: "grammar",
    title: de("Grammatik"),
    items: [
      { id: "q1", type: "order", tokens: ["Ich", "wohne", "in", "Berlin", "."] },
      {
        id: "q2",
        type: "match",
        pairs: [
          { id: "p1", left: de("ich"), right: de("bin") },
          { id: "p2", left: de("du"), right: de("bist") },
          { id: "p3", left: de("wir"), right: de("sind") },
        ],
      },
    ],
    ...provenance,
  },
  schreiben: {
    slug: "x-schreiben",
    skill: "writing",
    title: de("Formular"),
    stimulus: { text: de("Das ist Tom Berg aus Hamburg."), textKind: "form" },
    items: [
      { id: "q1", type: "text_input", label: "Vorname", accepted: ["Tom"] },
      { id: "q2", type: "text_input", label: "Wohnort", accepted: ["Hamburg"] },
    ],
    ...provenance,
  },
  sprechen: {
    slug: "x-sprechen",
    skill: "speaking",
    title: de("Sprechen"),
    items: [{ id: "q1", type: "speak_prompt", prompt: en("Say your name."), modelAnswer: de("Ich heiße Tom.") }],
    ...provenance,
  },
};

async function publish(admin, kind, id) {
  await transitionReview(admin, kind, { id, to: "reviewed" });
  await transitionReview(admin, kind, { id, to: "approved" });
  return setPublishStatus(admin, kind, { id, to: "published" });
}

// A1 level published, three published exercises (9 points, 7 questions) and an exam over
// them. The speaking exercise stays unpublished and is not in the exam.
async function setup({ exam: examOverrides = {}, publishExam = true } = {}) {
  const admin = await createTestUser({ role: ROLES.ADMIN });
  const learner = await createTestUser();
  await seedLevels(LEVELS);
  await publishLevel(admin);
  const ex = {};
  for (const [key, def] of Object.entries(EXERCISES)) {
    const created = await createContent(admin, "exercises", { ...def, levelCode: "A1" });
    ex[key] = created;
    if (key !== "sprechen") await publish(admin, "exercises", created.id);
  }
  const exam = await createContent(admin, "exams", {
    levelCode: "A1",
    slug: "probe",
    order: 1,
    title: { de: "Probeprüfung", en: "Practice exam" },
    durationMinutes: 30,
    passThreshold: 0.6,
    reviewPolicy: "full",
    sections: [
      { key: "lesen", title: de("Lesen"), exerciseIds: [ex.lesen.id] },
      { key: "sprachbausteine", title: de("Sprachbausteine"), exerciseIds: [ex.grammatik.id, ex.schreiben.id] },
    ],
    ...provenance,
    ...examOverrides,
  });
  if (publishExam) await publish(admin, "exams", exam.id);
  return { admin, learner, ex, exam };
}

// Correct (or deliberately wrong) answers for every question, built from the attempt's
// snapshot and secret seed the way a learner would pick them in the exam UI.
async function correctAnswers(attempt, exercisesByKey, { wrongKeys = [] } = {}) {
  const db = await getDb();
  const stored = await db.collection("examAttempts").findOne({ _id: new (await import("mongodb")).ObjectId(attempt.id) });
  const out = {};
  for (const ex of stored.snapshot.sections.flatMap((s) => s.exercises)) {
    const key = Object.entries(exercisesByKey).find(([, v]) => v.id === String(ex._id))[0];
    out[String(ex._id)] = answersFor(ex, String(ex._id), { seedPrefix: stored.seed, wrong: wrongKeys.includes(key) });
  }
  return out;
}

const collectionsSnapshot = async () => {
  const db = await getDb();
  const out = {};
  for (const c of await db.collections()) out[c.collectionName] = await c.find({}).sort({ _id: 1 }).toArray();
  return JSON.stringify(out);
};

describe("exam definitions (CMS)", () => {
  it("needs content:write and exam:configure; learners and anonymous callers are rejected", async () => {
    const learner = await createTestUser();
    const input = { kind: "exams", data: { levelCode: "A1", slug: "x", order: 1, title: de("X"), ...provenance } };
    await expect(saveContent(learner, input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(saveContent(null, input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getContentForAdmin(learner, "exams", "64b7f0c2a1b2c3d4e5f60718")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("stores exercise ids, checks they exist, and can't be published with ungraded or unpublished questions", async () => {
    const { admin, ex } = await setup({ publishExam: false });
    const bad = saveContent(admin, {
      kind: "exams",
      data: { levelCode: "A1", slug: "bad", order: 2, title: de("X"), sections: [{ key: "a", title: de("A"), exerciseIds: ["64b7f0c2a1b2c3d4e5f60718"] }], ...provenance },
    });
    await expect(bad).rejects.toMatchObject({ code: "VALIDATION", fieldErrors: { "sections.0.exerciseIds": expect.any(Array) } });

    const withSpeaking = await createContent(admin, "exams", {
      levelCode: "A1",
      slug: "mit-sprechen",
      order: 3,
      title: de("Mit Sprechen"),
      sections: [{ key: "a", title: de("A"), exerciseIds: [ex.lesen.id, ex.sprechen.id] }],
      ...provenance,
    });
    const db = await getDb();
    const stored = await db.collection("exams").findOne({ slug: "mit-sprechen" });
    expect(stored.sections[0].exerciseIds[0]).toBeInstanceOf((await import("mongodb")).ObjectId);
    await transitionReview(admin, "exams", { id: withSpeaking.id, to: "reviewed" });
    await transitionReview(admin, "exams", { id: withSpeaking.id, to: "approved" });
    await expect(setPublishStatus(admin, "exams", { id: withSpeaking.id, to: "published" })).rejects.toThrow(/can't be scored automatically|not published/);

    const view = await getContentForAdmin(admin, "exams", withSpeaking.id);
    expect(view.checks.ready).toBe(false);
    expect(view.checks.questionCount).toBe(4);
    expect(Object.keys(view.related)).toHaveLength(2);

    const empty = await createContent(admin, "exams", { levelCode: "A1", slug: "leer", order: 4, title: de("Leer"), ...provenance });
    await transitionReview(admin, "exams", { id: empty.id, to: "reviewed" });
    await transitionReview(admin, "exams", { id: empty.id, to: "approved" });
    await expect(setPublishStatus(admin, "exams", { id: empty.id, to: "published" })).rejects.toThrow(/at least one exercise/);
  });

  it("rejects duplicate section keys and an exercise used twice", async () => {
    const { admin, ex } = await setup({ publishExam: false });
    const base = { levelCode: "A1", order: 5, title: de("X"), ...provenance };
    await expect(
      createContent(admin, "exams", { ...base, slug: "dup-key", sections: [{ key: "a", title: de("A") }, { key: "a", title: de("B") }] }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      createContent(admin, "exams", { ...base, slug: "dup-ex", sections: [{ key: "a", title: de("A"), exerciseIds: [ex.lesen.id] }, { key: "b", title: de("B"), exerciseIds: [ex.lesen.id] }] }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("bulk review publishes the exam's exercises before the exam", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    await seedLevels(LEVELS);
    const e = await createContent(admin, "exercises", { ...EXERCISES.lesen, levelCode: "A1" });
    const exam = await createContent(admin, "exams", { levelCode: "A1", slug: "bulk", order: 1, title: de("B"), sections: [{ key: "a", title: de("A"), exerciseIds: [e.id] }], ...provenance });
    for (const step of ["review", "approve", "publish"]) {
      const r = await bulkExamTransition(admin, exam.id, step);
      expect(r.failed).toEqual([]);
      expect(r.changed).toBe(2);
    }
    const learner = await createTestUser();
    await expect(bulkExamTransition(learner, exam.id, "review")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("learner visibility", () => {
  it("lists and opens only published exams whose level and exercises are published", async () => {
    const { admin, learner, exam, ex } = await setup();
    const list = await listLearnerExams(learner, "a1");
    expect(list.map((e) => e.slug)).toEqual(["probe"]);
    expect(list[0].questionCount).toBe(7);
    const page = await getLearnerExam(learner, { level: "a1", exam: "probe" });
    expect(page.exam.durationMinutes).toBe(30);
    expect(page.history).toEqual([]);

    // Unpublishing one exercise hides the exam (fail closed).
    await setPublishStatus(admin, "exercises", { id: ex.lesen.id, to: "unpublished" });
    expect(await listLearnerExams(learner, "A1")).toEqual([]);
    await expect(getLearnerExam(learner, { level: "a1", exam: "probe" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(startExamAttempt(learner, { examId: exam.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("a draft exam is invisible and can't be started, even by an admin", async () => {
    const { admin, learner, exam } = await setup({ publishExam: false });
    expect(await listLearnerExams(learner, "A1")).toEqual([]);
    await expect(startExamAttempt(learner, { examId: exam.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(startExamAttempt(admin, { examId: exam.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(startExamAttempt(null, { examId: exam.id })).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
});

describe("taking an exam", () => {
  it("starts once, resumes the open attempt, and sends no answer keys", async () => {
    const { learner, exam } = await setup();
    const a = await startExamAttempt(learner, { examId: exam.id });
    expect(a.resumed).toBe(false);
    const b = await startExamAttempt(learner, { examId: exam.id });
    expect(b).toEqual({ attemptId: a.attemptId, resumed: true });

    const view = await getExamAttempt(learner, a.attemptId);
    expect(view.status).toBe("in_progress");
    expect(view.paper.questionCount).toBe(7);
    expect(view.paper.sections.map((s) => s.key)).toEqual(["lesen", "sprachbausteine"]);
    expect(view.paper.sections[1].exercises[0].firstNumber).toBe(4);
    const json = JSON.stringify(view);
    expect(json).not.toMatch(/"answer"|"accepted"|"explanation"|"seed"|"pairs"/);
    expect(json).not.toContain("The text says");
    expect(new Date(view.deadlineAt) - new Date(view.startedAt)).toBe(30 * 60_000);
  });

  it("scores on the server: all correct passes, unanswered questions score 0, the threshold is inclusive", async () => {
    const { learner, exam, ex } = await setup();
    const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
    const answers = await correctAnswers({ id: attemptId }, ex);
    const done = await submitExamAttempt(learner, { attemptId, answers });
    expect(done.status).toBe("submitted");
    expect(done.view.result).toMatchObject({ score: 9, maxScore: 9, ratio: 1, passed: true, questionCount: 7, answeredCount: 7 });
    expect(done.view.result.sections.map((s) => [s.key, s.score, s.maxScore])).toEqual([
      ["lesen", 3, 3],
      ["sprachbausteine", 6, 6],
    ]);

    // Second attempt: only the reading section answered (3 of 9 points) fails; unanswered count as 0.
    const second = await startExamAttempt(learner, { examId: exam.id });
    expect(second.resumed).toBe(false);
    const partial = await correctAnswers({ id: second.attemptId }, ex);
    const onlyReading = { [ex.lesen.id]: partial[ex.lesen.id] };
    const r2 = await submitExamAttempt(learner, { attemptId: second.attemptId, answers: onlyReading });
    expect(r2.view.result).toMatchObject({ score: 3, maxScore: 9, passed: false, answeredCount: 3 });
  });

  it("pass/fail uses the configured threshold exactly (6 of 9 at 2/3 passes, 5 of 9 fails)", async () => {
    const { learner, exam, ex } = await setup({ exam: { passThreshold: 2 / 3 } });
    const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
    const answers = await correctAnswers({ id: attemptId }, ex);
    // Points: reading 3, grammar 4 (order 1 + match 3), form 2. Six points: reading + match.
    const six = { [ex.lesen.id]: answers[ex.lesen.id], [ex.grammatik.id]: { q2: answers[ex.grammatik.id].q2 } };
    const r = await submitExamAttempt(learner, { attemptId, answers: six });
    expect(r.view.result).toMatchObject({ score: 6, maxScore: 9, passed: true });

    const next = await startExamAttempt(learner, { examId: exam.id });
    const a2 = await correctAnswers({ id: next.attemptId }, ex);
    const five = { [ex.lesen.id]: a2[ex.lesen.id], [ex.schreiben.id]: a2[ex.schreiben.id] };
    const r2 = await submitExamAttempt(learner, { attemptId: next.attemptId, answers: five });
    expect(r2.view.result).toMatchObject({ score: 5, maxScore: 9, passed: false });
  });

  it("ignores forged fields, unknown exercises and unknown items; malformed answers count as wrong", async () => {
    const { learner, exam, ex } = await setup();
    const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
    const forged = {
      attemptId,
      score: 999,
      passed: true,
      answers: {
        [ex.lesen.id]: { q1: true, q2: "yes", q3: { evil: 1 }, zz: true },
        [ex.sprechen.id]: { q1: "confident" },
        "64b7f0c2a1b2c3d4e5f60718": { q1: "a" },
      },
    };
    const r = await submitExamAttempt(learner, forged);
    expect(r.view.result).toMatchObject({ score: 1, maxScore: 9, passed: false, answeredCount: 1 });
    const db = await getDb();
    const stored = await db.collection("examAttempts").findOne({ status: "submitted" });
    expect(Object.keys(stored.answers)).toEqual([ex.lesen.id]);
    expect(Object.keys(stored.answers[ex.lesen.id]).sort()).toEqual(["q1", "q2", "q3"]);

    await expect(submitExamAttempt(learner, { attemptId, answers: "nope" })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("a submitted attempt is immutable: a second submission is rejected and changes nothing", async () => {
    const { learner, exam, ex } = await setup();
    const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
    await submitExamAttempt(learner, { attemptId, answers: {} });
    const before = await collectionsSnapshot();
    const answers = await correctAnswers({ id: attemptId }, ex);
    await expect(submitExamAttempt(learner, { attemptId, answers })).rejects.toMatchObject({ code: "CONFLICT" });
    // Only the rate-limit counter moves.
    const after = JSON.parse(await collectionsSnapshot());
    const b = JSON.parse(before);
    expect(after.examAttempts).toEqual(b.examAttempts);
  });

  it("concurrent submissions: exactly one wins", async () => {
    const { learner, exam, ex } = await setup();
    const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
    const answers = await correctAnswers({ id: attemptId }, ex);
    const results = await Promise.allSettled([
      submitExamAttempt(learner, { attemptId, answers }),
      submitExamAttempt(learner, { attemptId, answers: {} }),
      submitExamAttempt(learner, { attemptId, answers }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected").every((r) => r.reason.code === "CONFLICT")).toBe(true);
  });

  it("another learner can't read, submit or resume someone else's attempt", async () => {
    const { learner, exam } = await setup();
    const other = await createTestUser();
    const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
    await expect(getExamAttempt(other, attemptId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(submitExamAttempt(other, { attemptId, answers: {} })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getExamAttempt(null, attemptId)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(getExamAttempt(learner, "not-an-id")).rejects.toMatchObject({ code: "NOT_FOUND" });
    const own = await startExamAttempt(other, { examId: exam.id });
    expect(own.attemptId).not.toBe(attemptId);
    expect((await getExamAttempt(learner, attemptId)).status).toBe("in_progress");
  });

  it("timer: submissions within the grace period count; later ones close the attempt as expired without a score", async () => {
    const { learner, exam, ex } = await setup();
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const start = new Date("2026-09-29T10:00:00Z");
      vi.setSystemTime(start);
      const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
      const answers = await correctAnswers({ id: attemptId }, ex);
      vi.setSystemTime(new Date(start.getTime() + 30 * 60_000 + SUBMIT_GRACE_MS - 1000));
      const ok = await submitExamAttempt(learner, { attemptId, answers, reason: "timer" });
      expect(ok.view.result.passed).toBe(true);
      expect(ok.view.submitReason).toBe("timer");

      vi.setSystemTime(new Date(start.getTime() + 60 * 60_000));
      const late = await startExamAttempt(learner, { examId: exam.id });
      vi.setSystemTime(new Date(start.getTime() + 60 * 60_000 + 30 * 60_000 + SUBMIT_GRACE_MS + 1000));
      await expect(submitExamAttempt(learner, { attemptId: late.attemptId, answers })).rejects.toMatchObject({ code: "CONFLICT" });
      const view = await getExamAttempt(learner, late.attemptId);
      expect(view.status).toBe("expired");
      expect(view.view.result).toBeNull();

      // A stale open attempt is expired when the learner starts again.
      const third = await startExamAttempt(learner, { examId: exam.id });
      vi.setSystemTime(new Date(start.getTime() + 10 * 60 * 60_000));
      const fourth = await startExamAttempt(learner, { examId: exam.id });
      expect(fourth.attemptId).not.toBe(third.attemptId);
      expect((await getExamAttempt(learner, third.attemptId)).status).toBe("expired");
      const history = await getLearnerExam(learner, { level: "a1", exam: "probe" });
      expect(history.history.map((h) => h.status)).toEqual(["in_progress", "expired", "expired", "submitted"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("an untimed exam has no deadline", async () => {
    const { learner, exam } = await setup({ exam: { durationMinutes: null } });
    const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
    expect((await getExamAttempt(learner, attemptId)).deadlineAt).toBeNull();
  });

  it("the snapshot keeps an attempt stable when the exam's exercises are edited later", async () => {
    const { admin, learner, exam, ex } = await setup();
    const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
    const answers = await correctAnswers({ id: attemptId }, ex);
    const current = await getContentForAdmin(admin, "exercises", ex.lesen.id);
    // Flip the answer key and republish.
    const edited = { ...EXERCISES.lesen, levelCode: "A1", items: EXERCISES.lesen.items.map((i) => (i.id === "q1" ? { ...i, answer: false } : i)) };
    await updateContent(admin, "exercises", ex.lesen.id, current.item.version, edited);
    await publish(admin, "exercises", ex.lesen.id);
    const r = await submitExamAttempt(learner, { attemptId, answers });
    expect(r.view.result.score).toBe(9);
  });
});

describe("result and review policies", () => {
  async function submitted(policy) {
    const { learner, exam, ex } = await setup({ exam: { reviewPolicy: policy } });
    const { attemptId } = await startExamAttempt(learner, { examId: exam.id });
    const answers = await correctAnswers({ id: attemptId }, ex, { wrongKeys: ["lesen"] });
    await submitExamAttempt(learner, { attemptId, answers });
    return { view: await getExamAttempt(learner, attemptId), ex };
  }

  it("summary: totals and sections only", async () => {
    const { view } = await submitted("summary");
    expect(view.view.result.sections).toHaveLength(2);
    expect(view.view.review).toBeNull();
    expect(JSON.stringify(view)).not.toMatch(/"correct"|"answer"|"explanation"|"itemId"/);
  });

  it("marks: right/wrong per question and the learner's own answers, but no answer keys", async () => {
    const { view, ex } = await submitted("marks");
    const reading = view.view.review[0].exercises[0];
    expect(reading.items.map((i) => i.correct)).toEqual([false, false, false]);
    expect(reading.answers).toMatchObject({ q1: false });
    expect(reading.reveal).toBeUndefined();
    const json = JSON.stringify(view);
    expect(json).not.toMatch(/"accepted"|"explanation"|"answer":/);
    expect(json).not.toContain("The text says");
    expect(view.view.review[1].exercises.map((e) => e.exercise.id)).toEqual([ex.grammatik.id, ex.schreiben.id]);
  });

  it("full: correct answers, explanations and the transcript policy", async () => {
    const { view } = await submitted("full");
    const reading = view.view.review[0].exercises[0];
    expect(reading.reveal.items.q3).toMatchObject({ answer: "a", explanation: { en: "The text says: Anna wohnt in Köln." } });
  });

  it("exam results are kept apart from lesson attempts, progress and mastery", async () => {
    await submitted("full");
    const db = await getDb();
    expect(await db.collection("attempts").countDocuments()).toBe(0);
    expect(await db.collection("userProgress").countDocuments()).toBe(0);
    expect(await db.collection("userVocabulary").countDocuments()).toBe(0);
    // Lesson submissions still require a lesson: exam exercises can't be submitted as practice.
    const learner = await createTestUser();
    await expect(
      submitExerciseAttempt(learner, { lessonId: "64b7f0c2a1b2c3d4e5f60718", exerciseId: "64b7f0c2a1b2c3d4e5f60718", answers: {} }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("CMS exam preview", () => {
  it("previews a draft exam with the full review and writes nothing at all", async () => {
    const { admin, learner, exam, ex } = await setup({ publishExam: false, exam: { reviewPolicy: "summary" } });
    await expect(getExamPreview(learner, exam.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(previewExamSubmission(learner, { examId: exam.id, answers: {} })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getExamPreview(null, exam.id)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(getExamPreview(admin, "64b7f0c2a1b2c3d4e5f60718")).rejects.toMatchObject({ code: "NOT_FOUND" });

    const before = await collectionsSnapshot();
    const p = await getExamPreview(admin, exam.id);
    expect(p.preview).toMatchObject({ reviewStatus: "draft", learnerVisible: false });
    expect(p.questionCount).toBe(7);
    expect(JSON.stringify(p.paper)).not.toMatch(/"answer"|"accepted"/);

    // Answer through the payload the preview served (its own shuffle seed).
    const { ObjectId } = await import("mongodb");
    const db = await getDb();
    const answers = {};
    for (const key of ["lesen", "grammatik", "schreiben"]) {
      const doc = await db.collection("exercises").findOne({ _id: new ObjectId(ex[key].id) });
      answers[ex[key].id] = answersFor(doc, ex[key].id, { seedPrefix: `preview:${exam.id}:${exam.version}` });
    }
    const r = await previewExamSubmission(admin, { examId: exam.id, answers });
    expect(r.learnerPolicy).toBe("summary");
    expect(r.view.result).toMatchObject({ score: 9, maxScore: 9, passed: true });
    expect(r.view.review[0].exercises[0].reveal.items.q3.answer).toBe("a");
    expect(await collectionsSnapshot()).toBe(before);
    expect(await db.collection("examAttempts").countDocuments()).toBe(0);
    expect(await db.collection("rateLimits").countDocuments()).toBe(0);
  });

  it("previews an exam with unpublished and ungraded exercises and reports why learners can't see it", async () => {
    const { admin, ex } = await setup({ publishExam: false });
    const exam = await createContent(admin, "exams", {
      levelCode: "A1",
      slug: "entwurf",
      order: 2,
      title: de("Entwurf"),
      sections: [{ key: "a", title: de("A"), exerciseIds: [ex.lesen.id, ex.sprechen.id] }],
      ...provenance,
    });
    const p = await getExamPreview(admin, exam.id);
    expect(p.preview.problems.join(" ")).toMatch(/not published/);
    expect(p.preview.problems.join(" ")).toMatch(/scored automatically/);
  });
});
