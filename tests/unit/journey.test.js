import { describe, expect, it } from "vitest";
import {
  applyBlockDone,
  applyExamResult,
  applyExerciseResult,
  applyProfile,
  applyVocabReview,
  emptyLearnerState,
  learnerStateFromDocs,
  normalizeLearnerState,
  LEARNER_STATE_VERSION,
} from "@/lib/learning/state";
import {
  continueAt,
  dueVocabulary,
  examResults,
  goethePrep,
  homeView,
  lessonViewWithState,
  levelOverview,
  mistakes,
  moduleView,
  summarizeModules,
  todayPlan,
  weakSkills,
} from "@/lib/learning/journey";
import { lessonCompletion } from "@/lib/learning/progress";

// A two-module level: module 1 has two lessons, module 2 one.
const RULES = { skills: { grammar: { threshold: 0.75, required: true }, listening: { threshold: 0.7, required: true }, speaking: { threshold: 0.6, required: false } } };
const lesson = (id, slug, order, blocks, extra = {}) => ({ id, slug, order, title: { de: slug }, description: null, estimatedMinutes: 20, blocks, grammar: [], ...extra });
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
        lesson(
          "l1",
          "eins",
          1,
          [
            { key: "intro", type: "intro" },
            { key: "woerter", type: "vocabulary", vocabIds: ["v1", "v2"] },
            { key: "g", type: "grammar", refId: "gr1" },
            { key: "ex-g", type: "practice", refId: "e1" },
            { key: "ex-h", type: "listening", refId: "e2" },
          ],
          { grammar: [{ de: "du oder Sie?" }] },
        ),
        lesson("l2", "zwei", 2, [
          { key: "intro", type: "intro" },
          { key: "sprechen", type: "speaking", refId: "e3" },
        ]),
      ],
    },
    {
      id: "m2",
      slug: "familie",
      levelCode: "A1",
      order: 2,
      title: { de: "Familie" },
      rules: RULES,
      lessons: [lesson("l3", "drei", 1, [{ key: "ex", type: "practice", refId: "e4" }])],
    },
  ],
  exercises: {
    e1: { title: { de: "Verben" }, skill: "grammar", maxScore: 4, passThreshold: 0.6, goethe: null },
    e2: { title: { de: "Dialog" }, skill: "listening", maxScore: 2, passThreshold: 0.6, goethe: "hoeren" },
    e3: { title: { de: "Vorstellen" }, skill: "speaking", maxScore: 0, passThreshold: 0.6, goethe: "sprechen" },
    e4: { title: { de: "Artikel" }, skill: "grammar", maxScore: 4, passThreshold: 0.6, goethe: null },
  },
  goethe: [
    { key: "hoeren", title: "Hören", minutes: 20, parts: 3, items: 15 },
    { key: "sprechen", title: "Sprechen", minutes: 15, parts: 3, items: 3 },
  ],
  exams: [{ id: "x1", slug: "probe", title: { de: "Probe" }, durationMinutes: 55, passThreshold: 0.6, questionCount: 10, sections: [{ key: "hoeren", title: { de: "Hören" } }] }],
};
const BLOCKS_L1 = STRUCTURE.modules[0].lessons[0].blocks;
const graded = (score, maxScore, threshold = 0.6) => ({ score, maxScore, ratio: score / maxScore, graded: true, passed: score / maxScore >= threshold });
const NOW = new Date("2026-09-30T10:00:00Z");

describe("learner state reducers (guest counterparts of the progress repository)", () => {
  it("records attempts like recordExerciseResult: count, latest, best ratio, first pass", () => {
    let s = emptyLearnerState();
    s = applyExerciseResult(s, { lessonId: "l1", exerciseId: "e1", skill: "grammar", result: graded(1, 4), now: NOW });
    s = applyExerciseResult(s, { lessonId: "l1", exerciseId: "e1", skill: "grammar", result: graded(4, 4), now: new Date(NOW.getTime() + 1000) });
    s = applyExerciseResult(s, { lessonId: "l1", exerciseId: "e1", skill: "grammar", result: graded(2, 4), now: new Date(NOW.getTime() + 2000) });
    const e = s.lessons.l1.exercises.e1;
    expect(e.attempts).toBe(3);
    expect(e.bestRatio).toBe(1);
    expect(e.last).toMatchObject({ score: 2, maxScore: 4, passed: false });
    expect(e.passedAt).toBe(new Date(NOW.getTime() + 1000).toISOString());
  });

  it("marks a lesson completed once, when every block is done", () => {
    let s = emptyLearnerState();
    const args = { lessonId: "l1", blocks: BLOCKS_L1, now: NOW };
    for (const key of ["intro", "woerter", "g"]) s = applyBlockDone(s, { ...args, blockKey: key });
    s = applyBlockDone(s, { ...args, blockKey: "intro" }); // idempotent
    expect(s.lessons.l1.blocksDone).toEqual(["intro", "woerter", "g"]);
    s = applyExerciseResult(s, { ...args, exerciseId: "e1", skill: "grammar", result: graded(3, 4) });
    expect(s.lessons.l1.completedAt).toBeNull();
    s = applyExerciseResult(s, { ...args, exerciseId: "e2", skill: "listening", result: graded(2, 2) });
    expect(s.lessons.l1.completedAt).toBe(NOW.toISOString());
    const later = applyBlockDone(s, { ...args, blockKey: "g", now: new Date(NOW.getTime() + 5000) });
    expect(later.lessons.l1.completedAt).toBe(NOW.toISOString());
    expect(lessonCompletion({ blocks: BLOCKS_L1 }, s.lessons.l1).complete).toBe(true);
  });

  it("schedules words with the same Leitner rule as the server", () => {
    let s = applyVocabReview(emptyLearnerState(), { vocabId: "v1", result: "known", now: NOW });
    expect(s.vocab.v1).toMatchObject({ box: 1, reps: 1, dueAt: new Date(NOW.getTime() + 10 * 60_000).toISOString() });
    s = applyVocabReview(s, { vocabId: "v1", result: "known", now: NOW });
    expect(s.vocab.v1.box).toBe(2);
    s = applyVocabReview(s, { vocabId: "v1", result: "unknown", now: NOW });
    expect(s.vocab.v1).toMatchObject({ box: 1, lapses: 1 });
  });

  it("keeps the newest exam results first, bounded", () => {
    let s = emptyLearnerState();
    for (let i = 0; i < 12; i++) {
      s = applyExamResult(s, { examId: "x1", result: { score: i, maxScore: 10, ratio: i / 10, passed: i >= 6, passThreshold: 0.6, sections: [] }, now: new Date(NOW.getTime() + i) });
    }
    expect(s.exams.x1).toHaveLength(10);
    expect(s.exams.x1[0].score).toBe(11);
  });

  it("drops stored guest state that doesn't look right instead of repairing it", () => {
    expect(normalizeLearnerState(null)).toEqual(emptyLearnerState());
    expect(normalizeLearnerState({ version: 99, lessons: { l1: {} } })).toEqual(emptyLearnerState());
    const s = normalizeLearnerState({
      version: LEARNER_STATE_VERSION,
      lessons: { l1: { blocksDone: ["intro", 5], exercises: { e1: { attempts: 1, last: {} }, bad: "x" }, completedAt: 3 } },
      vocab: { v1: { box: 2, dueAt: NOW.toISOString() }, v2: { box: "x" } },
      exams: { x1: [{ score: 1 }, "junk"] },
      profile: { goal: "hack" },
    });
    // Phase 10: entries are checked field by field. An exercise with an unreadable last
    // result and an exam result without sections used to be kept (and crashed the views).
    expect(s.lessons.l1).toEqual({ blocksDone: ["intro"], exercises: {}, completedAt: null });
    expect(Object.keys(s.vocab)).toEqual(["v1"]);
    expect(s.exams).toEqual({});
    expect(s.profile).toBeNull();
  });

  it("keeps well-formed guest state exactly as the reducers wrote it", () => {
    let s = applyExerciseResult(emptyLearnerState(), { lessonId: "l1", exerciseId: "e1", skill: "grammar", result: { score: 3, maxScore: 4, ratio: 0.75, passed: true }, now: NOW });
    s = applyBlockDone(s, { lessonId: "l1", blockKey: "intro", now: NOW });
    s = applyVocabReview(s, { vocabId: "v1", result: "known", now: NOW });
    s = applyExamResult(s, { examId: "x1", result: { score: 5, maxScore: 10, ratio: 0.5, passed: false, passThreshold: 0.6, sections: [{ key: "hoeren", title: { de: "Hören" }, score: 2, maxScore: 5, ratio: 0.4 }] }, now: NOW });
    s = applyProfile(s, { goal: "goethe", levelCode: "A1", startModule: "hallo" });
    expect(normalizeLearnerState(JSON.parse(JSON.stringify(s)))).toEqual(JSON.parse(JSON.stringify(s)));
  });

  it("every view survives corrupted guest state", () => {
    const junk = [1, "x", null, [], {}, { score: "1" }, { attempts: -1 }, { box: 9, dueAt: "never" }, { sections: "no" }, { last: { score: 5, maxScore: 2, ratio: 2, passed: "yes" } }];
    const corrupt = [
      ...junk.map((j) => ({ version: LEARNER_STATE_VERSION, lessons: { l1: j, l2: { exercises: { e1: j, e3: j }, blocksDone: j } }, vocab: { v1: j }, exams: { x1: [j], x2: j }, profile: j })),
      { version: LEARNER_STATE_VERSION, lessons: { l1: { exercises: { e1: { attempts: 2, bestRatio: 0.5, last: { score: 1, maxScore: 4, ratio: 0.25, passed: false, at: "garbage" } } } } } },
      { version: LEARNER_STATE_VERSION, exams: { x1: [{ score: 1, maxScore: 2, ratio: 0.5, passed: false, sections: [{ key: "hoeren", title: 3, score: 1, maxScore: 2 }] }] } },
    ];
    for (const raw of corrupt) {
      const state = normalizeLearnerState(raw);
      expect(() => {
        homeView(STRUCTURE, state, { now: NOW });
        moduleView(STRUCTURE, state, "hallo");
        goethePrep(STRUCTURE, state);
        examResults(STRUCTURE, state);
        mistakes(STRUCTURE, state);
        dueVocabulary(STRUCTURE, state, NOW);
        lessonViewWithState({ available: true, blocks: [], results: [] }, state.lessons.l1);
      }, JSON.stringify(raw)).not.toThrow();
    }
  });

  it("caps the size of stored guest state", () => {
    const lessons = Object.fromEntries(Array.from({ length: 2500 }, (_, i) => [`l${i}`, { blocksDone: [], exercises: {} }]));
    expect(Object.keys(normalizeLearnerState({ version: LEARNER_STATE_VERSION, lessons }).lessons)).toHaveLength(2000);
  });

  it("builds the same shape from stored documents", () => {
    const s = learnerStateFromDocs({
      progress: [{ scopeId: "l1", blocksDone: ["intro"], exercises: { e1: { attempts: 1 } }, completedAt: null }],
      vocab: [{ vocabId: "v1", box: 3, dueAt: NOW, reps: 3, lapses: 0 }],
      examAttempts: [
        { examId: "x1", submittedAt: "2026-09-01T00:00:00Z", result: { score: 1, maxScore: 2, ratio: 0.5, passed: false, passThreshold: 0.6, sections: [] } },
        { examId: "x1", submittedAt: "2026-09-02T00:00:00Z", result: { score: 2, maxScore: 2, ratio: 1, passed: true, passThreshold: 0.6, sections: [] } },
        { examId: "x1", submittedAt: null, result: null },
      ],
      profile: { goal: "goethe" },
    });
    expect(s.lessons.l1.blocksDone).toEqual(["intro"]);
    expect(s.vocab.v1.dueAt).toBe(NOW.toISOString());
    expect(s.exams.x1.map((r) => r.score)).toEqual([2, 1]);
    expect(s.profile.goal).toBe("goethe");
  });
});

describe("journey views", () => {
  it("a new learner: nothing started, no invented numbers, first lesson next", () => {
    const o = levelOverview(STRUCTURE, emptyLearnerState());
    expect(o.lessons).toEqual({ completed: 0, total: 3 });
    expect(o.continueAt).toMatchObject({ started: false, href: "/learn/a1/hallo/eins", module: { slug: "hallo" } });
    for (const s of ["grammar", "listening"]) expect(o.skills.breakdown[s].attempted).toBe(0);
    expect(weakSkills(o.skills)).toEqual([]);
    expect(o.skills.ungraded.speaking).toEqual({ exercises: 1, practised: 0 });
    const plan = todayPlan(STRUCTURE, emptyLearnerState(), { now: NOW });
    expect(plan.items.map((i) => i.kind)).toEqual(["lesson"]);
    expect(plan.items[0].minutes).toBe(20);
  });

  it("level skills use the latest attempt per exercise, unattempted exercises count as 0", () => {
    let s = applyExerciseResult(emptyLearnerState(), { lessonId: "l1", exerciseId: "e1", skill: "grammar", result: graded(4, 4) });
    const o = levelOverview(STRUCTURE, s);
    expect(o.skills.breakdown.grammar).toMatchObject({ attempted: 1, exercises: 2, ratio: 0.5 }); // e4 not attempted
    expect(o.skills.skills.grammar.status).toBe("not_met");
    // Not done yet is not weak: everything attempted so far was right.
    expect(o.skills.breakdown.grammar.performance).toBe(1);
    expect(weakSkills(o.skills)).toEqual([]);
    const poor = applyExerciseResult(s, { lessonId: "l1", exerciseId: "e2", skill: "listening", result: graded(1, 2) });
    expect(weakSkills(levelOverview(STRUCTURE, poor).skills)).toEqual([{ skill: "listening", performance: 0.5, attempted: 1, threshold: 0.7 }]);
    s = applyExerciseResult(s, { lessonId: "l3", exerciseId: "e4", skill: "grammar", result: graded(4, 4) });
    expect(levelOverview(STRUCTURE, s).skills.skills.grammar.status).toBe("met");
  });

  it("mistakes are exercises whose latest attempt is below 100%, and lead back to the step", () => {
    let s = applyExerciseResult(emptyLearnerState(), { lessonId: "l1", exerciseId: "e1", skill: "grammar", result: graded(3, 4) });
    s = applyExerciseResult(s, { lessonId: "l1", exerciseId: "e2", skill: "listening", result: graded(2, 2) });
    s = applyExerciseResult(s, { lessonId: "l2", exerciseId: "e3", skill: "speaking", result: { score: 0, maxScore: 0, ratio: null, graded: false, passed: true } });
    const list = mistakes(STRUCTURE, s);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ exerciseId: "e1", score: 3, maxScore: 4, href: "/learn/a1/hallo/eins?block=ex-g", lesson: { grammar: [{ de: "du oder Sie?" }] } });
    s = applyExerciseResult(s, { lessonId: "l1", exerciseId: "e1", skill: "grammar", result: graded(4, 4) });
    expect(mistakes(STRUCTURE, s)).toEqual([]);
  });

  it("continues at the chosen starting module, then goes back to earlier ones", () => {
    let s = applyProfile(emptyLearnerState(), { goal: "improve", levelCode: "A1", startModule: "familie" });
    const summaries = () => summarizeModules(STRUCTURE, s);
    expect(continueAt(STRUCTURE, summaries(), s).module.slug).toBe("familie");
    s = applyExerciseResult(s, { lessonId: "l3", exerciseId: "e4", skill: "grammar", result: graded(4, 4), blocks: STRUCTURE.modules[1].lessons[0].blocks });
    expect(continueAt(STRUCTURE, summaries(), s).module.slug).toBe("hallo");
  });

  it("due words, the plan and Goethe practice follow the state", () => {
    let s = applyVocabReview(emptyLearnerState(), { vocabId: "v1", result: "unknown", now: NOW });
    s = applyExerciseResult(s, { lessonId: "l1", exerciseId: "e2", skill: "listening", result: graded(1, 2) });
    s = applyProfile(s, { goal: "goethe", levelCode: "A1", startModule: null });
    const later = new Date(NOW.getTime() + 11 * 60_000);
    expect(dueVocabulary(STRUCTURE, s, later)).toEqual({ count: 1, ids: ["v1"] });
    expect(dueVocabulary(STRUCTURE, s, NOW).count).toBe(0);
    const plan = todayPlan(STRUCTURE, s, { now: later });
    expect(plan.items.map((i) => i.kind)).toEqual(["lesson", "review", "mistake", "goethe"]);
    expect(plan.knownMinutes).toBe(20); // only lessons carry a time estimate
    const hoeren = goethePrep(STRUCTURE, s).find((g) => g.key === "hoeren");
    expect(hoeren).toMatchObject({ total: 1, practised: 1, ratio: 0.5, toImprove: 1 });
    expect(goethePrep(STRUCTURE, s).find((g) => g.key === "sprechen")).toMatchObject({ graded: false, practised: 0, ratio: null });
  });

  it("suggests one exercise per Goethe part by fixed rules, with the reason", () => {
    const part = (state, key) => goethePrep(STRUCTURE, state).find((g) => g.key === key);
    let s = emptyLearnerState();
    // Nothing done: the first exercise in course order, linked back to the part.
    expect(part(s, "hoeren").next).toMatchObject({ exercise: { id: "e2" }, reason: { kind: "order" } });
    expect(part(s, "hoeren").next.exercise.href).toBe("/learn/a1/hallo/eins?block=ex-h&from=goethe-hoeren");
    expect(part(s, "hoeren")).toMatchObject({ lessons: 1, perfect: 0, exam: null });
    // A started lesson comes first among the new ones.
    s = applyBlockDone(s, { lessonId: "l2", blockKey: "intro", now: NOW });
    expect(part(s, "sprechen").next.reason).toEqual({ kind: "started" });
    // A mistake beats everything, with the last score as the reason.
    s = applyExerciseResult(s, { lessonId: "l1", exerciseId: "e2", skill: "listening", result: graded(1, 2, 0.6), now: NOW });
    expect(part(s, "hoeren").next).toMatchObject({ exercise: { id: "e2" }, reason: { kind: "mistake", score: 1, maxScore: 2 } });
    // Fully right: nothing left to suggest for the part.
    s = applyExerciseResult(s, { lessonId: "l1", exerciseId: "e2", skill: "listening", result: graded(2, 2), now: NOW });
    expect(part(s, "hoeren")).toMatchObject({ next: null, perfect: 1, toImprove: 0 });
    // The latest practice exam's result for the part is shown with it.
    s = applyExamResult(s, { examId: "x1", result: { score: 2, maxScore: 5, ratio: 0.4, passed: false, passThreshold: 0.6, sections: [{ key: "hoeren", title: { de: "Hören" }, score: 2, maxScore: 5, ratio: 0.4 }] }, now: NOW });
    expect(part(s, "hoeren").exam).toMatchObject({ ratio: 0.4, belowTarget: true });
    expect(part(s, "sprechen").exam).toBeNull();
  });

  it("exam results link weak sections to the practice of that Goethe part", () => {
    const s = applyExamResult(emptyLearnerState(), {
      examId: "x1",
      result: { score: 3, maxScore: 10, ratio: 0.3, passed: false, passThreshold: 0.6, sections: [{ key: "hoeren", title: { de: "Hören" }, score: 3, maxScore: 10, ratio: 0.3 }] },
    });
    const [exam] = examResults(STRUCTURE, s);
    expect(exam.latest.sections[0]).toMatchObject({ belowTarget: true, practiceHref: "/goethe/a1/hoeren" });
    expect(exam.taken).toBe(1);
  });

  it("a finished module points to the next module; the last lesson view gets the guest's state", () => {
    let s = emptyLearnerState();
    for (const [lid, blocks] of STRUCTURE.modules[0].lessons.map((l) => [l.id, l.blocks])) {
      for (const b of blocks) {
        s = b.refId && b.type !== "grammar"
          ? applyExerciseResult(s, { lessonId: lid, exerciseId: b.refId, skill: STRUCTURE.exercises[b.refId].skill, result: STRUCTURE.exercises[b.refId].maxScore ? graded(1, 1) : { score: 0, maxScore: 0, ratio: null, graded: false, passed: true }, blocks })
          : applyBlockDone(s, { lessonId: lid, blockKey: b.key, blocks });
      }
    }
    const view = moduleView(STRUCTURE, s, "hallo");
    expect(view.complete).toBe(true);
    expect(view.nextModule).toMatchObject({ slug: "familie", href: "/learn/a1/familie/drei" });
    expect(view.levelComplete).toBe(false);
    expect(homeView(STRUCTURE, s, { now: NOW }).overview.continueAt.module.slug).toBe("familie");

    const data = {
      available: true,
      lesson: { id: "l2" },
      blocks: [
        { key: "intro", type: "intro", done: false },
        { key: "sprechen", type: "speaking", done: false, exercise: { id: "e3" }, stats: null },
      ],
      completion: { total: 2, done: 0, complete: false },
      results: [{ blockKey: "sprechen", exerciseId: "e3", attempts: 0, last: null }],
    };
    const withState = lessonViewWithState(data, s.lessons.l2);
    expect(withState.blocks.map((b) => b.done)).toEqual([true, true]);
    expect(withState.completion.complete).toBe(true);
    expect(withState.results[0].attempts).toBe(1);
  });
});
