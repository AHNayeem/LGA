import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { MODULE_1 } from "@/content/curriculum/a1/module-01/index.js";
import { LEVELS } from "@/content/seed/levels";
import {
  exerciseSchema,
  grammarTopicSchema,
  lessonSchema,
  levelSchema,
  moduleSchema,
  vocabularySchema,
} from "@/lib/validation/content";
import * as P from "@/components/admin/editor/payload";
import { ITEM_TYPE_NAMES } from "@/lib/exercises/types";
import { ITEM_TYPE_LABELS } from "@/lib/content/constants";

// The admin editors must be able to load and save every piece of the real Module 1
// content without losing or changing anything: document → form state → payload must
// parse to exactly the same content as the original.

const provenance = MODULE_1.provenance;
const roundTrip = (schema, toState, toPayload, raw) => {
  const original = schema.parse(raw);
  const again = schema.parse(toPayload(toState(original)));
  expect(again).toEqual(original);
};

describe("CMS editor payloads round-trip Module 1 content", () => {
  it("levels", () => {
    for (const l of LEVELS) roundTrip(levelSchema, P.levelState, P.levelPayload, { ...l, sourceType: "system" });
  });

  it("module", () => {
    roundTrip(moduleSchema, P.moduleState, P.modulePayload, { ...MODULE_1.module, levelCode: "A1", refs: [], ...provenance });
  });

  it("vocabulary", () => {
    for (const v of MODULE_1.vocabulary) {
      roundTrip(vocabularySchema, P.vocabularyState, P.vocabularyPayload, { ...v, levelCode: "A1", refs: [], ...provenance });
    }
  });

  it("grammar topics", () => {
    for (const g of MODULE_1.grammar) {
      roundTrip(grammarTopicSchema, P.grammarState, P.grammarPayload, { ...g, levelCode: "A1", refs: [], ...provenance });
    }
  });

  it("exercises (every item type)", () => {
    const types = new Set();
    for (const e of MODULE_1.exercises) {
      e.items.forEach((i) => types.add(i.type));
      roundTrip(exerciseSchema, P.exerciseState, P.exercisePayload, { ...e, levelCode: "A1", refs: [], ...provenance });
    }
    expect([...types].sort()).toEqual(["match", "mcq", "order", "speak_prompt", "text_input", "true_false"]);
  });

  it("lessons with their blocks", () => {
    const ids = new Map();
    const id = (slug) => {
      if (!ids.has(slug)) ids.set(slug, String(new ObjectId()));
      return ids.get(slug);
    };
    for (const l of MODULE_1.lessons) {
      const blocks = l.blocks.map(({ vocab, grammar, exercise, ...b }) => {
        if (vocab) return { ...b, vocabIds: vocab.map(id) };
        if (grammar) return { ...b, refId: id(grammar) };
        if (exercise) return { ...b, refId: id(exercise) };
        return b;
      });
      roundTrip(lessonSchema, P.lessonState, P.lessonPayload, { ...l, blocks, moduleId: id("module"), refs: [], ...provenance });
    }
  });
});

describe("CMS editor payload details", () => {
  it("drops empty optional text and keeps required fields so the server can report them", () => {
    const s = P.vocabularyState();
    s.lemma = "Haus";
    const p = P.vocabularyPayload(s);
    expect(p).toMatchObject({ lemma: "Haus", article: null, plural: null, meanings: {}, pos: "noun" });
    expect(p).not.toHaveProperty("example");
    expect(p).not.toHaveProperty("slug");
    const r = vocabularySchema.safeParse(p);
    expect(r.success).toBe(false);
    const paths = r.error.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["slug", "meanings.en"]));

    // Once the rest is valid, a noun without an article is still rejected.
    const noun = vocabularySchema.safeParse(P.vocabularyPayload({ ...s, slug: "haus", meanings: P.locState({ en: "house" }) }));
    expect(noun.success).toBe(false);
    expect(noun.error.issues.map((i) => i.path.join("."))).toEqual(["article"]);
  });

  it("mastery: inherit, set and remove", () => {
    const state = P.masteryState({ skills: { reading: { threshold: 0.7, required: true }, speaking: null } });
    expect(state.reading).toEqual({ mode: "set", threshold: "70", required: true });
    expect(state.speaking.mode).toBe("remove");
    expect(state.writing.mode).toBe("inherit");
    expect(P.masteryPayload(state)).toEqual({ skills: { reading: { threshold: 0.7, required: true }, speaking: null } });
    expect(P.masteryPayload(P.masteryState(undefined))).toBeUndefined();
  });

  it("switching an item's type keeps the shared fields", () => {
    const s = P.itemState({ type: "mcq", id: "q3", prompt: { de: "Wie heißt du?" }, options: [{ id: "a", text: { de: "Anna" } }], answer: "a" });
    const asText = P.itemPayload({ ...s, type: "text_input", accepted: "Anna" });
    expect(asText).toEqual({ type: "text_input", id: "q3", prompt: { de: "Wie heißt du?" }, accepted: ["Anna"], caseSensitive: false, umlautTolerant: true, ignoreSpaces: false, inputMode: "text" });
  });

  it("the editor offers exactly the registered item types", () => {
    expect(Object.keys(ITEM_TYPE_LABELS).sort()).toEqual([...ITEM_TYPE_NAMES].sort());
  });

  it("slugs, ids and block keys", () => {
    expect(P.slugify("Grüß Gott, Straße!")).toBe("gruess-gott-strasse");
    expect(P.nextId("q", ["q1", "q2"])).toBe("q3");
    expect(P.nextOptionId(["a", "b"])).toBe("c");
    expect(P.suggestBlockKey("mini_test", ["mini-test"])).toBe("mini-test-2");
  });
});
