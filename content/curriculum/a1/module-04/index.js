// A1 Module 4 "Essen & Einkaufen".
// Mapping (metadata only): Netzwerk neu A1 Kap. 4; Grammatik aktiv 17, 6, 12;
// prepares Goethe A1 Hören Teil 1 (prices, short dialogues) and Sprechen Teil 3 (requests).
// See docs/REFERENCE-ANALYSIS.md §4 and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { FOOD, DRINKS, SHOPPING, QUANTITIES, PRICES, MEALS, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m4-/, ""), e.slug));

const LESSONS = [
  {
    slug: "essen-und-trinken",
    order: 1,
    title: { de: "Essen und Trinken", en: "Food and drinks" },
    description: en("Name everyday food and drinks and say what you eat and drink."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this lesson you learn the names of everyday food and drinks: Brot, Käse, Äpfel, Kaffee, Milch …\n\nWhen you say what you eat or drink, the food is the object of the sentence: Ich esse einen Apfel. Ich trinke keinen Kaffee. In German the object is in the accusative – and only masculine words change (der → den, ein → einen, kein → keinen).\n\nGoal: you can say what you eat and drink, and what you don't.",
        ),
      },
      { type: "vocabulary", key: "essen", title: en("Food"), vocab: slugs(FOOD) },
      { type: "vocabulary", key: "getraenke", title: en("Drinks"), vocab: slugs(DRINKS) },
      { type: "grammar", key: "grammatik-akkusativ", grammar: "m4-akkusativ" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "im-supermarkt",
    order: 2,
    title: { de: "Im Supermarkt", en: "At the supermarket" },
    description: en("Talk about quantities and packaging and write a shopping list."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Shopping for food means quantities: ein Kilo Kartoffeln, zwei Liter Milch, eine Flasche Wasser, 200 Gramm Käse.\n\nNote: after a quantity word there is no article – ein Kilo Äpfel, not “ein Kilo die Äpfel”. And after a number, Kilo and Gramm have no plural ending: zwei Kilo, 500 Gramm.\n\nGoal: you can read and write a shopping list and use verbs like kaufen, brauchen and essen with an object.",
        ),
      },
      { type: "vocabulary", key: "einkaufen", title: en("Shopping"), vocab: slugs(SHOPPING) },
      { type: "vocabulary", key: "mengen", title: en("Quantities and packaging"), vocab: slugs(QUANTITIES) },
      { type: "grammar", key: "grammatik-verben", grammar: "m4-verben-mit-akkusativ" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "was-kostet-das",
    order: 3,
    title: { de: "Was kostet das?", en: "How much is it?" },
    description: en("Understand prices, ask for products politely and use mögen and möchten."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Prices are read like this: 2,40 € = zwei Euro vierzig, 0,69 € = neunundsechzig Cent. Prices are a typical task in part 1 of the A1 listening exam, and you hear each recording twice.\n\nIn a shop you ask politely with möchten or Haben Sie …?: Ich möchte ein Kilo Tomaten, bitte. Haben Sie Bananen? These requests are part 3 of the A1 speaking exam.\n\nGoal: you can understand prices and buy food at a market stall or in a shop.",
        ),
      },
      { type: "vocabulary", key: "preise", title: en("Prices and requests"), vocab: slugs(PRICES) },
      { type: "grammar", key: "grammatik-moegen-moechten", grammar: "m4-moegen-moechten" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "guten-appetit",
    order: 4,
    title: { de: "Guten Appetit!", en: "Enjoy your meal!" },
    description: en("Talk about meals and say what you like and don't like eating."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Breakfast, lunch and dinner: das Frühstück, das Mittagessen, das Abendessen. Before a meal Germans say Guten Appetit!\n\nTo say what you like eating, put gern after the verb: Ich esse gern Fisch. Ich trinke nicht gern Kaffee.\n\nYou also practise word order: the verb is always in position 2, even when a time word comes first – Heute kaufe ich Brot.",
        ),
      },
      { type: "vocabulary", key: "woerter-mahlzeiten", title: en("Meals and at the table"), vocab: slugs(MEALS) },
      { type: "grammar", key: "grammatik-position-1", grammar: "m4-position-1" },
      { type: "grammar", key: "grammatik-gern", grammar: "m4-gern" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "modultest",
    order: 5,
    title: { de: "Modultest: Essen & Einkaufen", en: "Module test" },
    description: en("Check what you have learned in Goethe-style tasks: listening, reading, writing, grammar and vocabulary."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This test uses the task types of the Goethe-Zertifikat A1, with our own texts: short recordings with prices (played twice), a supermarket ad, an order form, grammar, vocabulary and requests for the speaking exam. You need 70% in each part to complete it, and you can try again as often as you like.\n\nImportant: these are the app's learning targets, not official Goethe pass marks.",
        ),
      },
      ex("mini_test", "test-hoeren", "m4-test-hoeren"),
      ex("mini_test", "test-lesen", "m4-test-lesen"),
      ex("mini_test", "test-formular", "m4-test-formular"),
      ex("mastery_check", "test-grammatik", "m4-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m4-test-wortschatz"),
      ex("speaking", "test-sprechen", "m4-test-sprechen"),
    ],
  },
];

export const MODULE_4 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 4 (metadata only).",
  },
  module: {
    slug: "essen-und-einkaufen",
    order: 4,
    title: { de: "Essen & Einkaufen", en: "Food & shopping" },
    description: en("Food and drinks, shopping for food, quantities and prices, meals, likes and dislikes."),
    goals: [
      en("Name everyday food and drinks."),
      en("Say what you eat, drink, buy and need – with the accusative (einen, ein, eine, keinen)."),
      en("Understand prices in euros and cents and quantities like ein Kilo or eine Flasche."),
      en("Ask for products politely: Ich möchte …, Haben Sie …?, Was kostet …?"),
      en("Say what you like and don't like: mögen, gern, nicht gern."),
      en("Keep the verb in position 2 when a time word comes first."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-4", note: "Chapter alignment only" },
      { ref: "grammatik-aktiv-17", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-6", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-12", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-hoeren", note: "Prepares Teil 1 (prices, short dialogues)" },
      { ref: "goethe-start-deutsch-1-sprechen", note: "Prepares Teil 3 (requests)" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
