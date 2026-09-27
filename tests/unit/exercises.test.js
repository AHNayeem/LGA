import { describe, expect, it } from "vitest";
import { exerciseSchema } from "@/lib/validation/content";
import { gradeExercise, revealExercise, toClientExercise, exerciseMaxScore } from "@/lib/exercises/engine";
import { matchTypedAnswer, normalizeAnswer } from "@/lib/exercises/normalize";
import { seededPermutation } from "@/lib/exercises/shuffle";
import { ITEM_TYPE_NAMES } from "@/lib/exercises/types";

const EX_ID = "64b7f0c2a1b2c3d4e5f60718";

function exercise(items, extra = {}) {
  return exerciseSchema.parse({
    levelCode: "A1",
    slug: "test-exercise",
    skill: "grammar",
    title: { de: "Test" },
    items,
    sourceType: "ai_generated",
    ...extra,
  });
}

const mcqItem = {
  id: "q1",
  type: "mcq",
  prompt: { de: "Es ist 8 Uhr morgens. Was sagen Sie?" },
  options: [
    { id: "a", text: { de: "Guten Abend!" } },
    { id: "b", text: { de: "Guten Morgen!" } },
    { id: "c", text: { de: "Gute Nacht!" } },
  ],
  answer: "b",
  explanation: { en: "Guten Morgen is used until about 10–11 a.m." },
};
const tfItem = { id: "q2", type: "true_false", statement: { de: "Anna kommt aus Wien." }, answer: false };
const textItem = { id: "q3", type: "text_input", before: "Ich", after: "Anna.", accepted: ["heiße", "heisse"] };
const matchItem = {
  id: "q4",
  type: "match",
  pairs: [
    { id: "p1", left: { de: "drei" }, right: { de: "3" } },
    { id: "p2", left: { de: "sieben" }, right: { de: "7" } },
    { id: "p3", left: { de: "zwölf" }, right: { de: "12" } },
  ],
};
const orderItem = {
  id: "q5",
  type: "order",
  tokens: ["Woher", "kommst", "du", "?"],
};
const speakItem = {
  id: "q6",
  type: "speak_prompt",
  prompt: { en: "Say your name." },
  modelAnswer: { de: "Ich heiße Lena." },
};

// Helper: find the client id for a match right side / order token by its text.
function rightIdFor(client, itemId, text) {
  return client.items.find((i) => i.id === itemId).right.find((r) => r.text.de === text).id;
}
function tokenIds(client, itemId, words) {
  const tokens = [...client.items.find((i) => i.id === itemId).tokens];
  return words.map((w) => {
    const idx = tokens.findIndex((t) => t && t.text === w);
    const id = tokens[idx].id;
    tokens[idx] = null;
    return id;
  });
}

describe("exercise schema", () => {
  it("rejects an mcq whose answer is not an option", () => {
    expect(() => exercise([{ ...mcqItem, answer: "z" }])).toThrow();
  });
  it("rejects duplicate item ids and unknown item types", () => {
    expect(() => exercise([mcqItem, { ...tfItem, id: "q1" }])).toThrow();
    expect(() => exercise([{ id: "x", type: "essay" }])).toThrow();
  });
  it("requires audio for listening exercises", () => {
    expect(() => exercise([mcqItem], { skill: "listening" })).toThrow(/audio/);
    expect(() => exercise([{ ...mcqItem, audio: { text: "Guten Morgen!" } }], { skill: "listening" })).not.toThrow();
  });
  it("registers every Module 1 item type", () => {
    expect(ITEM_TYPE_NAMES).toEqual(["mcq", "true_false", "text_input", "match", "order", "speak_prompt"]);
  });
});

describe("client payload never leaks the answer key", () => {
  const ex = exercise([mcqItem, tfItem, textItem, matchItem, orderItem, speakItem], {
    stimulus: { audio: { lines: [{ text: "Hallo, ich bin Anna." }] } },
  });
  const client = toClientExercise(ex, { exerciseId: EX_ID });
  const json = JSON.stringify(client);

  it("strips answers, accepted variants, explanations, model answers and transcript", () => {
    expect(json).not.toMatch(/"answer"|accepted|explanation|modelAnswer/);
    expect(json).not.toContain("heisse");
    expect(json).not.toContain("Ich heiße Lena");
    expect(json).not.toContain("Hallo, ich bin Anna"); // transcript hidden until submit
    expect(client.stimulus.transcript).toBeNull();
  });

  it("shuffles match/order sides with neutral ids", () => {
    const m = client.items.find((i) => i.id === "q4");
    expect(m.right.map((r) => r.id)).toEqual(["r0", "r1", "r2"]);
    expect(m.right.map((r) => r.text.de)).not.toEqual(["3", "7", "12"]);
    const o = client.items.find((i) => i.id === "q5");
    expect(o.tokens.map((t) => t.text)).not.toEqual(["Woher", "kommst", "du", "?"]);
  });

  it("is stable for the same exercise (server can grade without per-learner state)", () => {
    expect(toClientExercise(ex, { exerciseId: EX_ID })).toEqual(client);
  });
});

describe("grading", () => {
  const ex = exercise([mcqItem, tfItem, textItem, matchItem, orderItem, speakItem]);
  const client = toClientExercise(ex, { exerciseId: EX_ID });
  const correctAnswers = {
    q1: "b",
    q2: false,
    q3: " heiße ",
    q4: { p1: rightIdFor(client, "q4", "3"), p2: rightIdFor(client, "q4", "7"), p3: rightIdFor(client, "q4", "12") },
    q5: tokenIds(client, "q5", ["Woher", "kommst", "du", "?"]),
    q6: "confident",
  };

  it("scores a fully correct submission; ungraded speaking adds no points", () => {
    const r = gradeExercise(ex, correctAnswers, { exerciseId: EX_ID });
    expect(exerciseMaxScore(ex)).toBe(1 + 1 + 1 + 3 + 1 + 0);
    expect(r).toMatchObject({ score: 7, maxScore: 7, ratio: 1, graded: true, passed: true });
    const speak = r.items.find((i) => i.itemId === "q6");
    expect(speak).toMatchObject({ correct: null, score: 0, maxScore: 0, selfRating: "confident" });
  });

  it("marks wrong answers wrong and gives partial credit for match", () => {
    const wrong = {
      ...correctAnswers,
      q1: "a",
      q2: true,
      q3: "heißt",
      q4: { ...correctAnswers.q4, p1: correctAnswers.q4.p2, p2: correctAnswers.q4.p1 },
      q5: tokenIds(client, "q5", ["du", "kommst", "Woher", "?"]),
    };
    const r = gradeExercise(ex, wrong, { exerciseId: EX_ID });
    const by = Object.fromEntries(r.items.map((i) => [i.itemId, i]));
    expect(by.q1.correct).toBe(false);
    expect(by.q2.correct).toBe(false);
    expect(by.q3.correct).toBe(false);
    expect(by.q4).toMatchObject({ correct: false, score: 1, maxScore: 3 });
    expect(by.q5.correct).toBe(false);
    expect(r.score).toBe(1);
    expect(r.passed).toBe(false);
  });

  it("treats missing or malformed answers as unanswered, never as errors", () => {
    const r = gradeExercise(ex, { q1: 42, q3: { $gt: "" }, q5: ["t0", "t0", "t1", "t2"], __proto__: "x" }, { exerciseId: EX_ID });
    expect(r.score).toBe(0);
    expect(r.items.find((i) => i.itemId === "q1").answered).toBe(false);
    expect(r.items.find((i) => i.itemId === "q3").answered).toBe(false);
    // Reusing a token is answered-but-wrong.
    expect(r.items.find((i) => i.itemId === "q5")).toMatchObject({ answered: true, correct: false });
  });

  it("accepts umlaut transliteration with feedback", () => {
    const ex2 = exercise([{ id: "u", type: "text_input", accepted: ["Tschüs"] }]);
    const r = gradeExercise(ex2, { u: "tschues!" }, { exerciseId: EX_ID });
    expect(r.items[0]).toMatchObject({ correct: true, feedback: "umlaut" });
  });

  it("applies the pass threshold", () => {
    const ex3 = exercise([mcqItem, { ...mcqItem, id: "q1b" }, { ...mcqItem, id: "q1c" }], { passThreshold: 0.6 });
    expect(gradeExercise(ex3, { q1: "b", q1b: "b", q1c: "a" }, { exerciseId: EX_ID }).passed).toBe(true);
    expect(gradeExercise(ex3, { q1: "b", q1b: "a", q1c: "a" }, { exerciseId: EX_ID }).passed).toBe(false);
  });

  it("accepts alternative word orders", () => {
    const ex4 = exercise([{ id: "o", type: "order", tokens: ["Ich", "komme", "aus", "Polen", "."], alternatives: ["Aus Polen komme ich."] }]);
    const c = toClientExercise(ex4, { exerciseId: EX_ID });
    // Tokens keep their authored case; comparison is case-insensitive.
    const r = gradeExercise(ex4, { o: tokenIds(c, "o", ["aus", "Polen", "komme", "Ich", "."]) }, { exerciseId: EX_ID });
    expect(r.items[0].correct).toBe(true);
    const wrong = gradeExercise(ex4, { o: tokenIds(c, "o", ["Polen", "aus", "komme", "Ich", "."]) }, { exerciseId: EX_ID });
    expect(wrong.items[0].correct).toBe(false);
  });

  it("reveals expected answers and transcript only in the post-submit payload", () => {
    const ex5 = exercise([mcqItem, matchItem], { stimulus: { audio: { lines: [{ speaker: "A", text: "Guten Morgen!" }] } } });
    const reveal = revealExercise(ex5, { exerciseId: EX_ID });
    expect(reveal.items.q1).toMatchObject({ answer: "b", explanation: mcqItem.explanation });
    expect(reveal.transcript).toEqual([{ speaker: "A", text: "Guten Morgen!" }]);
    const c = toClientExercise(ex5, { exerciseId: EX_ID });
    expect(reveal.items.q4.pairs.p3).toBe(rightIdFor(c, "q4", "12"));
    const hidden = revealExercise({ ...ex5, stimulus: { ...ex5.stimulus, transcriptPolicy: "never" } }, { exerciseId: EX_ID });
    expect(hidden.transcript).toBeNull();
  });
});

describe("answer normalisation", () => {
  it("normalises case, whitespace, trailing punctuation and Unicode form", () => {
    expect(normalizeAnswer("  Ich   HEIßE  Anna. ")).toBe("ich heiße anna");
    expect(normalizeAnswer("heiße")).toBe(normalizeAnswer("heiße"));
    expect(matchTypedAnswer("Müller", ["Müller"])).toBe("exact"); // combining diaeresis
  });
  it("respects case sensitivity when configured", () => {
    expect(matchTypedAnswer("berlin", ["Berlin"], { caseSensitive: true })).toBeNull();
    expect(matchTypedAnswer("Berlin", ["Berlin"], { caseSensitive: true })).toBe("exact");
  });
  it("does not accept empty input", () => {
    expect(matchTypedAnswer("   ", ["a"])).toBeNull();
  });
});

describe("seeded permutation", () => {
  it("is deterministic, a real permutation, and never the identity", () => {
    for (let n = 2; n <= 8; n++) {
      for (const seed of ["a", "b", "x:y", "64b7:q1"]) {
        const p = seededPermutation(n, seed);
        expect(p).toEqual(seededPermutation(n, seed));
        expect([...p].sort((a, b) => a - b)).toEqual([...Array(n).keys()]);
        expect(p.every((v, i) => v === i)).toBe(false);
      }
    }
  });
});
