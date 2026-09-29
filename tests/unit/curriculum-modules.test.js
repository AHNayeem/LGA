import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { CURRICULUM } from "@/content/curriculum/index.js";
import { REFERENCES } from "@/content/seed/references";
import { exerciseSchema, grammarTopicSchema, lessonSchema, moduleSchema, vocabularySchema } from "@/lib/validation/content";
import { gradeExercise } from "@/lib/exercises/engine";
import { exerciseCues, uniqueCues, vocabularyCues } from "@/lib/audio/cues";
import { answersFor } from "@/tests/helpers/answers";

// Content integrity for every A1 module (Module 1 also has its own, more specific test in
// curriculum-content.test.js). Set CURRICULUM_MODULE_DIR=module-05 to check one module
// directory that isn't registered in content/curriculum/index.js yet.

const FAKE_ID = "64b7f0c2a1b2c3d4e5f60718";
const A1_DIR = new URL("../../content/curriculum/a1/", import.meta.url);

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

async function modulesUnderTest() {
  const only = process.env.CURRICULUM_MODULE_DIR;
  if (!only) return CURRICULUM;
  const mod = await import(new URL(`${only}/index.js`, A1_DIR).href);
  const def = Object.values(mod).find((v) => v && typeof v === "object" && v.module && v.lessons);
  if (!def) throw new Error(`${only}/index.js exports no module definition`);
  return [def];
}

const defs = await modulesUnderTest();

describe.each(defs.map((d) => [d.module.slug, d]))("A1 module %s", (_slug, def) => {
  const provenance = def.provenance;
  const parse = (schema, v, label) => {
    const r = schema.safeParse({ ...v, levelCode: "A1", refs: [], ...provenance });
    if (!r.success) throw new Error(`${label ?? v.slug}: ${JSON.stringify(r.error.issues, null, 1)}`);
    return r.data;
  };

  it("is AI-drafted, A1 and ships no lifecycle state", () => {
    expect(def.levelCode).toBe("A1");
    expect(provenance.sourceType).toBe("ai_generated");
    expect(JSON.stringify(def)).not.toMatch(/"reviewStatus"|"publishStatus"|"approvalBasis"/);
  });

  it("every word, grammar topic, exercise and the module validate", () => {
    def.vocabulary.forEach((v) => parse(vocabularySchema, v));
    def.grammar.forEach((g) => parse(grammarTopicSchema, g));
    def.exercises.forEach((e) => parse(exerciseSchema, e));
    parse(moduleSchema, def.module, "module");
  });

  it("slugs are unique, lessons are ordered, and every block and reference resolves", () => {
    for (const list of [def.vocabulary, def.grammar, def.exercises, def.lessons]) {
      const s = list.map((x) => x.slug);
      expect(new Set(s).size, "duplicate slug").toBe(s.length);
    }
    const orders = def.lessons.map((l) => l.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(orders.length);

    const vocab = new Set(def.vocabulary.map((v) => v.slug));
    const grammar = new Set(def.grammar.map((g) => g.slug));
    const exercises = new Set(def.exercises.map((e) => e.slug));
    const usedEx = new Set();
    const usedVocab = new Set();
    const usedGrammar = new Set();
    for (const lesson of def.lessons) {
      for (const b of lesson.blocks) {
        if (b.vocab) b.vocab.forEach((s) => (expect(vocab.has(s), `${lesson.slug}: word ${s}`).toBe(true), usedVocab.add(s)));
        if (b.grammar) (expect(grammar.has(b.grammar), b.grammar).toBe(true), usedGrammar.add(b.grammar));
        if (b.exercise) (expect(exercises.has(b.exercise), b.exercise).toBe(true), usedEx.add(b.exercise));
      }
      const blocks = lesson.blocks.map(({ vocab: v, grammar: g, exercise: e, ...b }) =>
        v ? { ...b, vocabIds: v.map(() => FAKE_ID) } : g || e ? { ...b, refId: FAKE_ID } : b,
      );
      const r = lessonSchema.safeParse({ ...lesson, blocks, moduleId: FAKE_ID, refs: [], ...provenance });
      expect(r.success, `${lesson.slug}: ${JSON.stringify(r.error?.issues)}`).toBe(true);
    }
    expect([...exercises].filter((e) => !usedEx.has(e)), "orphan exercises").toEqual([]);
    expect([...vocab].filter((v) => !usedVocab.has(v)), "orphan words").toEqual([]);
    expect([...grammar].filter((g) => !usedGrammar.has(g)), "orphan grammar topics").toEqual([]);

    const refs = allReferenceSlugs();
    for (const item of [def.module, ...def.grammar, ...def.exercises, ...def.vocabulary, ...def.lessons]) {
      for (const r of item.refs ?? []) expect(refs.has(r.ref), r.ref).toBe(true);
    }
  });

  it("every answer key is self-consistent: correct answers score 100%, wrong ones don't pass", () => {
    for (const raw of def.exercises) {
      const ex = parse(exerciseSchema, raw);
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

  it("covers the assessable skills and ends with a module test", () => {
    const skills = new Set(def.exercises.filter((e) => e.skill !== "speaking").map((e) => e.skill));
    for (const s of ["grammar", "listening", "reading", "vocabulary"]) expect(skills.has(s), s).toBe(true);
    const last = def.lessons.at(-1);
    expect(last.blocks.some((b) => b.type === "mini_test" || b.type === "mastery_check")).toBe(true);
  });

  it("contains no Bangla, is NFC-normalised, and every noun has an article", () => {
    walkStrings(def, (s, path) => {
      expect(/[ঀ-৿]/.test(s), `Bangla text at ${path}`).toBe(false);
      expect(path.endsWith(".bn"), `bn key at ${path}`).toBe(false);
      expect(s.normalize("NFC"), path).toBe(s);
    });
    for (const v of def.vocabulary.filter((x) => x.pos === "noun")) expect(v.article, v.slug).toMatch(/^(der|die|das)$/);
  });

  it("declares a bounded set of audio cues", () => {
    const cues = uniqueCues([...def.exercises.flatMap(exerciseCues), ...def.vocabulary.flatMap(vocabularyCues)]);
    expect(cues.size).toBeGreaterThan(20);
    expect(cues.size).toBeLessThan(400);
  });
});

describe.skipIf(Boolean(process.env.CURRICULUM_MODULE_DIR))("A1 curriculum as a whole", () => {
  it("registers every module directory, in order, with unique module slugs and orders", () => {
    const dirs = readdirSync(A1_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && /^module-\d\d$/.test(d.name));
    expect(CURRICULUM).toHaveLength(dirs.length);
    const orders = CURRICULUM.map((d) => d.module.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(CURRICULUM.map((d) => d.module.slug)).size).toBe(CURRICULUM.length);
  });

  // Slugs are unique per level in the database ({levelCode, slug}), so two modules must
  // never define the same word, grammar topic or exercise slug: the second would silently
  // reuse (or, with --update, overwrite) the first.
  it("word, grammar and exercise slugs are unique across all modules, and no word is defined twice", () => {
    for (const key of ["vocabulary", "grammar", "exercises"]) {
      const all = CURRICULUM.flatMap((d) => d[key].map((x) => `${x.slug}`));
      const dups = all.filter((s, i) => all.indexOf(s) !== i);
      expect(dups, `duplicate ${key} slugs`).toEqual([]);
    }
    const forms = CURRICULUM.flatMap((d) => d.vocabulary.map((v) => `${v.article ?? ""} ${v.lemma}`.trim().toLowerCase()));
    const dupForms = forms.filter((s, i) => forms.indexOf(s) !== i);
    expect(dupForms, "the same word in two modules").toEqual([]);
  });
});
