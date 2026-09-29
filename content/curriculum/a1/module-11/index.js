// A1 Module 11 "Kleidung & Kaufhaus".
// Mapping (metadata only): Netzwerk neu A1 Kap. 11; Grammatik aktiv 20, 21;
// prepares Goethe A1 Hören Teil 2 (announcements, heard once) and Lesen Teil 3 (signs).
// See docs/REFERENCE-ANALYSIS.md §4 and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { CLOTHES_1, CLOTHES_2, OPINIONS, SHOPPING, STORE, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m11-/, ""), e.slug));

const LESSONS = [
  {
    slug: "was-traegst-du",
    order: 1,
    title: { de: "Was trägst du?", en: "What are you wearing?" },
    description: en("Name clothes and ask which one with welcher? – dieser."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this module you go shopping for clothes. First you need the words: die Hose, das Hemd, die Jacke, die Schuhe …\n\nLearn every piece of clothing with its article. The article also helps you with a new question word: welcher? (which?). Welche Jacke? – Diese hier.\n\nGoal: you can say what you are wearing and ask which piece someone means.",
        ),
      },
      { type: "vocabulary", key: "woerter-kleidung", title: en("Clothes"), vocab: slugs(CLOTHES_1) },
      { type: "vocabulary", key: "woerter-schuhe", title: en("Shoes, accessories and pointing words"), vocab: slugs(CLOTHES_2) },
      { type: "grammar", key: "grammatik-welcher-dieser", grammar: "m11-welcher-dieser" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "die-jacke-gefaellt-mir",
    order: 2,
    title: { de: "Die Jacke gefällt mir!", en: "I like the jacket!" },
    description: en("Say what you like, what fits and what suits someone, with mir, dir, ihm …"),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "How do you say “I like the jacket” in German? Die Jacke gefällt mir. – literally “The jacket pleases me”.\n\nFor this you need the personal pronouns in the dative: mir, dir, ihm, ihr, uns, euch, ihnen, Ihnen. You also learn words for sizes and for your opinion: eng, schick, altmodisch.\n\nGoal: you can say what you like, what fits you and what suits a friend.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Opinions and sizes"), vocab: slugs(OPINIONS) },
      { type: "grammar", key: "grammatik-dativpronomen", grammar: "m11-personalpronomen-dativ" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "im-geschaeft",
    order: 3,
    title: { de: "Im Geschäft", en: "In the shop" },
    description: en("Try clothes on, ask for another size or colour, pay and exchange things."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Now you are in a clothes shop. The shop assistant asks: Kann ich Ihnen helfen? You want to try something on (anprobieren), ask for another size, pay at the checkout (die Kasse) and maybe exchange something later (umtauschen).\n\nThe verbs gefallen, passen, stehen, gehören and helfen all take the dative. Watch the verb: it agrees with the thing, not with the person.\n\nGoal: you can manage a whole conversation in a clothes shop and fill in an exchange form.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("In the shop"), vocab: slugs(SHOPPING) },
      { type: "grammar", key: "grammatik-verben-dativ", grammar: "m11-verben-mit-dativ" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "im-kaufhaus",
    order: 4,
    title: { de: "Im Kaufhaus", en: "In the department store" },
    description: en("Find your way in a department store: floors, departments, signs and announcements."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "A department store has many floors (der Stock) and departments (die Abteilung). The store directory tells you where to go, and you ask politely: Entschuldigung, wo finde ich …?\n\nIn the A1 exam you read signs like these (Lesen Teil 3) and hear short announcements only once (Hören Teil 2). Listen for the key information: where, when, what.\n\nYou will also see past forms like eingekauft or anprobiert. You only need to recognise them.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("The department store"), vocab: slugs(STORE) },
      { type: "grammar", key: "grammatik-partizip", grammar: "m11-partizip-ii-erkennen" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "modultest",
    order: 5,
    title: { de: "Modultest: Kleidung & Kaufhaus", en: "Module test" },
    description: en("Check what you have learned in Goethe-style tasks: listening, reading, writing, grammar and vocabulary."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This test uses the task types of the Goethe-Zertifikat A1, with our own texts: store announcements you hear only once, signs in a store and a form. You need 70% in each part to complete it, and you can try again as often as you like.\n\nImportant: these are the app's learning targets, not official Goethe pass marks.",
        ),
      },
      ex("mini_test", "test-hoeren", "m11-test-hoeren"),
      ex("mini_test", "test-lesen", "m11-test-lesen"),
      ex("mini_test", "test-formular", "m11-test-formular"),
      ex("mastery_check", "test-grammatik", "m11-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m11-test-wortschatz"),
      ex("speaking", "test-sprechen", "m11-test-sprechen"),
    ],
  },
];

export const MODULE_11 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 11 (metadata only).",
  },
  module: {
    slug: "kleidung-und-kaufhaus",
    order: 11,
    title: { de: "Kleidung & Kaufhaus", en: "Clothes & department store" },
    description: en("Clothes and sizes, shopping for clothes, the department store and asking for information politely."),
    goals: [
      en("Name clothes and ask which one with welcher? – dieser."),
      en("Say what you like, what fits and what suits someone, using mir, dir, ihm …"),
      en("Try clothes on, ask for another size or colour, pay and exchange things."),
      en("Find your way in a department store and ask politely for information."),
      en("Understand store announcements and signs (Goethe Hören Teil 2, Lesen Teil 3)."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-11", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-20", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-21", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" },
      { ref: "goethe-start-deutsch-1-lesen", note: "Task format only" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
