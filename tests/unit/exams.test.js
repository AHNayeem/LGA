import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { gradeExercise, toClientExercise } from "@/lib/exercises/engine";
import { exerciseSchema, examSchema } from "@/lib/validation/content";
import { buildExamSnapshot, examReadiness, toClientExam, ungradedItems } from "@/lib/exams/exam";
import { examAnswersSchema, examResultView, gradeExam, isPassed, sanitizeExamAnswers } from "@/lib/exams/scoring";
import { answersFor } from "@/tests/helpers/answers";

const de = (s) => ({ de: s });
const prov = { sourceType: "original" };
const id = () => new ObjectId();

function exercise(body) {
  return { _id: id(), version: 3, reviewStatus: "approved", publishStatus: "published", ...exerciseSchema.parse({ levelCode: "A1", ...body, ...prov }) };
}

const orderEx = exercise({
  slug: "o",
  skill: "grammar",
  title: de("Ordnen"),
  items: [{ id: "q1", type: "order", tokens: ["Ich", "komme", "aus", "Polen", "."] }],
});
const listenEx = exercise({
  slug: "l",
  skill: "listening",
  title: de("Hören"),
  stimulus: { audio: { lines: [{ text: "Hallo, ich bin Anna.", voice: "female" }] }, transcriptPolicy: "always" },
  items: [
    { id: "q1", type: "true_false", statement: de("Sie heißt Anna."), answer: true, explanation: { en: "She says so." } },
    {
      id: "q2",
      type: "match",
      pairs: [
        { id: "p1", left: de("eins"), right: de("1") },
        { id: "p2", left: de("zwei"), right: de("2") },
        { id: "p3", left: de("drei"), right: de("3") },
      ],
    },
  ],
});
const speakEx = exercise({ slug: "s", skill: "speaking", title: de("Sprechen"), items: [{ id: "q1", type: "speak_prompt", modelAnswer: de("Hallo!") }] });

const exam = {
  _id: id(),
  version: 2,
  ...examSchema.parse({
    levelCode: "A1",
    slug: "e",
    order: 1,
    title: de("Probe"),
    passThreshold: 0.5,
    sections: [
      { key: "a", title: de("A"), exerciseIds: [String(listenEx._id)] },
      { key: "b", title: de("B"), exerciseIds: [String(orderEx._id)] },
    ],
    ...prov,
  }),
  sourceType: "ai_generated",
};
const byId = new Map([listenEx, orderEx, speakEx].map((e) => [String(e._id), e]));
const snapshot = buildExamSnapshot(exam, byId);

describe("exercise engine seedPrefix", () => {
  it("changes the shuffle only when given, and grades consistently with the same prefix", () => {
    const plain = toClientExercise(listenEx);
    const again = toClientExercise(listenEx, { seedPrefix: null });
    expect(again).toEqual(plain);
    const prefixes = ["a", "b", "c", "d", "e", "f"].map((p) => JSON.stringify(toClientExercise(listenEx, { seedPrefix: p }).items[1].right));
    expect(new Set(prefixes).size).toBeGreaterThan(1);
    const answers = answersFor(listenEx, String(listenEx._id), { seedPrefix: "secret" });
    expect(gradeExercise(listenEx, answers, { seedPrefix: "secret" }).ratio).toBe(1);
  });
});

describe("exam structure", () => {
  it("snapshots bodies with ids and versions, without lifecycle fields", () => {
    expect(snapshot.sections[0].exercises[0]).toMatchObject({ _id: listenEx._id, version: 3, slug: "l" });
    expect(snapshot.sections[0].exercises[0]).not.toHaveProperty("reviewStatus");
    expect(snapshot).toMatchObject({ passThreshold: 0.5, reviewPolicy: "full", durationMinutes: null, aiGenerated: true });
  });

  it("the client paper numbers questions across the exam and hides keys and transcripts", () => {
    const paper = toClientExam(snapshot, { seedPrefix: "x" });
    expect(paper.questionCount).toBe(3);
    expect(paper.sections[1].exercises[0].firstNumber).toBe(3);
    const json = JSON.stringify(paper);
    expect(json).not.toMatch(/"answer"|"explanation"|"passThreshold":0\.6/);
    expect(paper.sections[0].exercises[0].stimulus.transcript).toBeNull(); // policy "always" is overridden in exams
  });

  it("readiness: speaking and unpublished exercises block publishing", () => {
    expect(ungradedItems(speakEx)).toEqual(["q1"]);
    expect(examReadiness(exam, byId, { isLive: () => true }).ready).toBe(true);
    const withSpeaking = { ...exam, sections: [{ key: "a", exerciseIds: [speakEx._id] }] };
    expect(examReadiness(withSpeaking, byId).problems.join()).toMatch(/scored automatically/);
    expect(examReadiness(exam, byId, { isLive: (e) => e !== orderEx }).problems.join()).toMatch(/1 exercise\(s\) are not published/);
    expect(examReadiness({ ...exam, sections: [] }, byId).ready).toBe(false);
  });
});

describe("exam scoring", () => {
  const seed = "s3cr3t";
  const right = Object.fromEntries([listenEx, orderEx].map((e) => [String(e._id), answersFor(e, String(e._id), { seedPrefix: seed })]));

  it("sums sections and applies the pass mark (inclusive, float-safe)", () => {
    const r = gradeExam(snapshot, right, { seedPrefix: seed });
    expect(r).toMatchObject({ score: 5, maxScore: 5, ratio: 1, passed: true, questionCount: 3, answeredCount: 3, correctCount: 3 });
    expect(r.sections.map((s) => [s.key, s.score, s.maxScore])).toEqual([
      ["a", 4, 4],
      ["b", 1, 1],
    ]);
    expect(isPassed(21, 35, 0.6)).toBe(true);
    expect(isPassed(20, 35, 0.6)).toBe(false);
    expect(isPassed(0, 0, 0)).toBe(false);
  });

  it("the wrong seed can't reproduce the answers of a match/order question", () => {
    const r = gradeExam(snapshot, right, { seedPrefix: "other" });
    expect(r.score).toBeLessThan(5);
  });

  it("unanswered and malformed answers score 0; unknown keys are dropped", () => {
    const answers = { [String(listenEx._id)]: { q1: "yes", zz: 1 }, [String(id())]: { q1: true } };
    const kept = sanitizeExamAnswers(snapshot, answers);
    expect(kept).toEqual({ [String(listenEx._id)]: { q1: "yes" } });
    const r = gradeExam(snapshot, kept, { seedPrefix: seed });
    expect(r).toMatchObject({ score: 0, answeredCount: 0, passed: false });
    expect(examAnswersSchema.safeParse({ notAnId: {} }).success).toBe(false);
  });

  it("the review follows the policy", () => {
    const result = gradeExam(snapshot, right, { seedPrefix: seed });
    const attempt = { status: "submitted", startedAt: new Date(), submittedAt: new Date(), answers: right, result };
    const summary = examResultView(snapshot, attempt, { policy: "summary", seedPrefix: seed });
    expect(summary.review).toBeNull();
    expect(summary.result).not.toHaveProperty("exercises");
    const marks = examResultView(snapshot, attempt, { policy: "marks", seedPrefix: seed });
    expect(marks.review[0].exercises[0].items.every((i) => i.correct)).toBe(true);
    expect(marks.review[0].exercises[0].reveal).toBeUndefined();
    expect(JSON.stringify(marks)).not.toContain("She says so");
    expect(JSON.stringify(marks)).not.toContain("Hallo, ich bin Anna"); // no transcript
    const full = examResultView(snapshot, attempt, { policy: "full", seedPrefix: seed });
    expect(full.review[0].exercises[0].reveal.items.q1).toMatchObject({ answer: true, explanation: { en: "She says so." } });
    expect(full.review[0].exercises[0].reveal.transcript).toHaveLength(1);
    expect(examResultView(snapshot, { status: "expired", startedAt: new Date(), result: null }).result).toBeNull();
  });
});
