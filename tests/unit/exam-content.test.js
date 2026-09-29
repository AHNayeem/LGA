import { describe, expect, it } from "vitest";
import { EXAMS } from "@/content/exams/index.js";
import { CURRICULUM } from "@/content/curriculum/index.js";
import { REFERENCES } from "@/content/seed/references";
import { examSchema, exerciseSchema } from "@/lib/validation/content";
import { gradeExercise } from "@/lib/exercises/engine";
import { itemType } from "@/lib/exercises/types";
import { exerciseCues, uniqueCues } from "@/lib/audio/cues";
import { answersFor } from "@/tests/helpers/answers";

// Content integrity for seeded exams (content/exams). Set EXAM_FILE=a1/probepruefung-1.js
// to check one definition that isn't registered in content/exams/index.js yet.

const FAKE_ID = "64b7f0c2a1b2c3d4e5f60718";

function refSlugs(list = REFERENCES, out = new Set()) {
  for (const r of list) {
    out.add(r.slug);
    refSlugs(r.children ?? [], out);
  }
  return out;
}

async function examsUnderTest() {
  if (!process.env.EXAM_FILE) return EXAMS;
  const mod = await import(new URL(`../../content/exams/${process.env.EXAM_FILE}`, import.meta.url).href);
  return Object.values(mod).filter((v) => v && typeof v === "object" && v.exam && v.exercises);
}

const defs = await examsUnderTest();

it("has at least one exam definition", () => expect(defs.length).toBeGreaterThan(0));

describe.each(defs.map((d) => [d.exam.slug, d]))("exam %s", (_slug, def) => {
  const parse = (schema, v) => {
    const r = schema.safeParse({ ...v, levelCode: def.levelCode, refs: [], ...def.provenance });
    if (!r.success) throw new Error(`${v.slug}: ${JSON.stringify(r.error.issues, null, 1)}`);
    return r.data;
  };

  it("is AI-drafted and ships no lifecycle state", () => {
    expect(def.provenance.sourceType).toBe("ai_generated");
    expect(JSON.stringify(def)).not.toMatch(/"reviewStatus"|"publishStatus"|"approvalBasis"/);
  });

  it("the exam and every exercise validate; sections reference each exercise exactly once", () => {
    def.exercises.forEach((e) => parse(exerciseSchema, e));
    const slugs = def.exercises.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const used = def.exam.sections.flatMap((s) => s.exercises);
    expect([...used].sort()).toEqual([...slugs].sort());
    const { sections, ...exam } = def.exam;
    // Distinct placeholder ids across the whole exam (an exercise may appear only once).
    let n = 0;
    const fakeId = () => FAKE_ID.slice(0, -2) + String(n++).padStart(2, "0");
    parse(examSchema, { ...exam, sections: sections.map(({ exercises, ...s }) => ({ ...s, exerciseIds: exercises.map(fakeId) })) });
    for (const item of [def.exam, ...def.exercises]) for (const r of item.refs ?? []) expect(refSlugs().has(r.ref), r.ref).toBe(true);
  });

  it("every question is scored automatically and every answer key is self-consistent", () => {
    for (const raw of def.exercises) {
      const ex = parse(exerciseSchema, raw);
      for (const item of ex.items) expect(itemType(item.type).graded, `${raw.slug}/${item.id} must be auto-scored`).toBe(true);
      const right = gradeExercise(ex, answersFor(ex, FAKE_ID), { exerciseId: FAKE_ID });
      expect(right.ratio, raw.slug).toBe(1);
      const wrong = gradeExercise(ex, answersFor(ex, FAKE_ID, { wrong: true }), { exerciseId: FAKE_ID });
      expect(wrong.ratio, raw.slug).toBeLessThan(1);
    }
  });

  it("uses exercise slugs of its own, not the curriculum's", () => {
    const curriculum = new Set(CURRICULUM.flatMap((d) => d.exercises.map((e) => e.slug)));
    for (const e of def.exercises) expect(curriculum.has(e.slug), e.slug).toBe(false);
  });

  it("contains no Bangla and is NFC-normalised", () => {
    const walk = (v, path = "") => {
      if (typeof v === "string") {
        expect(/[ঀ-৿]/.test(v), path).toBe(false);
        expect(v.normalize("NFC"), path).toBe(v);
      } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) (expect(k).not.toBe("bn"), walk(x, `${path}.${k}`));
    };
    walk(def);
  });

  it("declares a bounded set of audio cues", () => {
    expect(uniqueCues(def.exercises.flatMap(exerciseCues)).size).toBeLessThan(400);
  });
});
