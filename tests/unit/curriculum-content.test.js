import { describe, expect, it } from "vitest";
import { MODULE_1 } from "@/content/curriculum/a1/module-01/index.js";
import { CURRICULUM } from "@/content/curriculum/index.js";
import { REFERENCES } from "@/content/seed/references";
import { exerciseSchema, grammarTopicSchema, lessonSchema, moduleSchema, vocabularySchema } from "@/lib/validation/content";
import { gradeExercise } from "@/lib/exercises/engine";
import { exerciseCues, uniqueCues, vocabularyCues } from "@/lib/audio/cues";
import { answersFor } from "@/tests/helpers/answers";

// Content integrity for Module 1: every item validates, every reference resolves, every
// answer key is self-consistent, and no unreviewed Bangla or approval state is shipped.

const FAKE_ID = "64b7f0c2a1b2c3d4e5f60718";
const provenance = MODULE_1.provenance;

function walkStrings(value, fn, path = "") {
  if (typeof value === "string") fn(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, fn, `${path}[${i}]`));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walkStrings(v, fn, `${path}.${k}`);
}

function allReferenceSlugs(list = REFERENCES, out = new Set()) {
  for (const r of list) {
    out.add(r.slug);
    allReferenceSlugs(r.children ?? [], out);
  }
  return out;
}

describe("Module 1 content", () => {
  it("is registered in the curriculum and marked as AI-drafted, never approved", () => {
    expect(CURRICULUM).toContain(MODULE_1);
    expect(provenance.sourceType).toBe("ai_generated");
    const json = JSON.stringify(MODULE_1);
    expect(json).not.toMatch(/"reviewStatus"|"publishStatus"|"approved"/);
  });

  it("every vocabulary item, grammar topic and exercise validates", () => {
    const parse = (schema, v) => {
      const r = schema.safeParse({ ...v, levelCode: "A1", refs: [], ...provenance });
      if (!r.success) throw new Error(`${v.slug}: ${JSON.stringify(r.error.issues, null, 1)}`);
    };
    MODULE_1.vocabulary.forEach((v) => parse(vocabularySchema, v));
    MODULE_1.grammar.forEach((g) => parse(grammarTopicSchema, g));
    MODULE_1.exercises.forEach((e) => parse(exerciseSchema, e));
    const m = moduleSchema.safeParse({ ...MODULE_1.module, levelCode: "A1", refs: [], ...provenance });
    expect(m.success).toBe(true);
  });

  it("slugs are unique and every lesson block and reference resolves", () => {
    for (const list of [MODULE_1.vocabulary, MODULE_1.grammar, MODULE_1.exercises, MODULE_1.lessons]) {
      const s = list.map((x) => x.slug);
      expect(new Set(s).size).toBe(s.length);
    }
    const vocab = new Set(MODULE_1.vocabulary.map((v) => v.slug));
    const grammar = new Set(MODULE_1.grammar.map((g) => g.slug));
    const exercises = new Set(MODULE_1.exercises.map((e) => e.slug));
    const used = new Set();
    for (const lesson of MODULE_1.lessons) {
      for (const b of lesson.blocks) {
        if (b.vocab) b.vocab.forEach((s) => expect(vocab.has(s), s).toBe(true));
        if (b.grammar) expect(grammar.has(b.grammar), b.grammar).toBe(true);
        if (b.exercise) {
          expect(exercises.has(b.exercise), b.exercise).toBe(true);
          used.add(b.exercise);
        }
      }
      // Validate the resolved lesson shape with placeholder ids.
      const blocks = lesson.blocks.map(({ vocab: v, grammar: g, exercise: e, ...b }) =>
        v ? { ...b, vocabIds: v.map(() => FAKE_ID) } : g || e ? { ...b, refId: FAKE_ID } : b,
      );
      const r = lessonSchema.safeParse({ ...lesson, blocks, moduleId: FAKE_ID, refs: [], ...provenance });
      expect(r.success, `${lesson.slug}: ${JSON.stringify(r.error?.issues)}`).toBe(true);
    }
    expect([...exercises].filter((e) => !used.has(e))).toEqual([]); // no orphan exercises

    const refs = allReferenceSlugs();
    const all = [MODULE_1.module, ...MODULE_1.grammar, ...MODULE_1.exercises, ...MODULE_1.vocabulary];
    for (const item of all) for (const r of item.refs ?? []) expect(refs.has(r.ref), r.ref).toBe(true);
  });

  it("every answer key is self-consistent: correct answers score 100%, wrong ones don't pass", () => {
    for (const raw of MODULE_1.exercises) {
      const ex = exerciseSchema.parse({ ...raw, levelCode: "A1", refs: [], ...provenance });
      const right = gradeExercise(ex, answersFor(ex, FAKE_ID), { exerciseId: FAKE_ID });
      expect(right.passed, raw.slug).toBe(true);
      if (right.graded) {
        expect(right.ratio, raw.slug).toBe(1);
        const wrong = gradeExercise(ex, answersFor(ex, FAKE_ID, { wrong: true }), { exerciseId: FAKE_ID });
        expect(wrong.passed, `${raw.slug} should fail with wrong answers`).toBe(false);
      } else {
        expect(raw.skill, `${raw.slug}: only speaking may be ungraded`).toBe("speaking");
      }
    }
  });

  it("covers every assessable A1 skill so module mastery can be evaluated", () => {
    const skills = new Set(MODULE_1.exercises.filter((e) => e.skill !== "speaking").map((e) => e.skill));
    expect([...skills].sort()).toEqual(["grammar", "listening", "reading", "vocabulary", "writing"]);
    expect(MODULE_1.lessons).toHaveLength(6);
  });

  it("contains no Bangla text yet (Bangla must come from a reviewer, not be generated)", () => {
    walkStrings(MODULE_1, (s, path) => {
      expect(/[ঀ-৿]/.test(s), `Bangla text at ${path}`).toBe(false);
      expect(path.endsWith(".bn"), `bn key at ${path}`).toBe(false);
    });
  });

  it("all text is NFC-normalised and every German noun has an article", () => {
    walkStrings(MODULE_1, (s, path) => expect(s.normalize("NFC"), path).toBe(s));
    for (const v of MODULE_1.vocabulary.filter((x) => x.pos === "noun")) expect(v.article, v.slug).toMatch(/^(der|die|das)$/);
  });

  it("declares a bounded set of audio cues for the offline generator", () => {
    const cues = uniqueCues([...MODULE_1.exercises.flatMap(exerciseCues), ...MODULE_1.vocabulary.flatMap(vocabularyCues)]);
    expect(cues.size).toBeGreaterThan(50);
    expect(cues.size).toBeLessThan(400);
  });
});
