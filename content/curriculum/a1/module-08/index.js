// A1 Module 8 "Gesundheit".
// Mapping (metadata only): Netzwerk neu A1 Kap. 8; Grammatik aktiv 9, 7;
// prepares Goethe A1 Hören Teil 3 (phone messages) and Sprechen Teil 3 (requests).
// See docs/REFERENCE-ANALYSIS.md §4 and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it. Health content is generic and is not
// medical advice.

import { BODY, FEELING, PRACTICE, ADVICE, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m8-/, ""), e.slug));

const LESSONS = [
  {
    slug: "der-koerper",
    order: 1,
    title: { de: "Der Körper", en: "The body" },
    description: en("Name the parts of the body, with their articles and plurals."),
    estimatedMinutes: 20,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This module is about health: the body, feeling ill, the doctor's practice and the pharmacy.\n\nFirst you learn the parts of the body. Always learn each word with its article and plural: der Fuß – die Füße, die Hand – die Hände.\n\nGoal: you can name the main parts of the body and understand simple instructions like Machen Sie bitte den Mund auf!",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Parts of the body"), vocab: slugs(BODY) },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "mir-geht-es-nicht-gut",
    order: 2,
    title: { de: "Mir geht es nicht gut", en: "I don't feel well" },
    description: en("Say how you feel and what hurts."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "When you are ill, you need a few important sentences: Mir geht es nicht gut. Ich habe Kopfschmerzen. Mein Bauch tut weh.\n\nMost of them are fixed expressions – learn them as whole sentences.\n\nGoal: you can say what is wrong and understand the question Was fehlt Ihnen?",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Feeling ill"), vocab: slugs(FEELING) },
      { type: "grammar", key: "grammatik-was-fehlt-ihnen", grammar: "m8-was-fehlt-ihnen" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "in-der-arztpraxis",
    order: 3,
    title: { de: "In der Arztpraxis", en: "At the doctor's practice" },
    description: en("Talk at the reception and understand the doctor's instructions."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "At a German practice you first go to the reception (die Anmeldung). You say your name and show your health insurance card (die Gesundheitskarte). Then you wait in the waiting room.\n\nDoctors give instructions with the imperative. You already know the Sie form. Now you also learn the du and ihr forms, for tips to friends and children: Trink viel Wasser! Bleibt zu Hause!\n\nGoal: you can manage the reception, understand instructions and give simple tips.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("At the practice"), vocab: slugs(PRACTICE) },
      { type: "grammar", key: "grammatik-imperativ", grammar: "m8-imperativ" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "gute-besserung",
    order: 4,
    title: { de: "Gute Besserung!", en: "Get well soon!" },
    description: en("Understand advice, rules and phone messages; buy things at the pharmacy."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "What should you do, what must you do and what are you not allowed to do? For this you need the modal verbs sollen, müssen and dürfen: Sie sollen viel schlafen. Sie dürfen keinen Sport machen.\n\nYou also practise phone messages from a practice or a pharmacy – a typical task in the A1 listening exam (Hören Teil 3).\n\nThe tips in this lesson are simple everyday language examples, not medical advice.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Advice and the pharmacy"), vocab: slugs(ADVICE) },
      { type: "grammar", key: "grammatik-modalverben", grammar: "m8-modalverben-sollen-muessen-duerfen" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "modultest",
    order: 5,
    title: { de: "Modultest: Gesundheit", en: "Module test" },
    description: en("Check what you have learned in Goethe-style tasks: listening, reading, writing, grammar and vocabulary."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This test uses the task types of the Goethe-Zertifikat A1, with our own texts. You need 70% in each part to complete it, and you can try again as often as you like.\n\nImportant: these are the app's learning targets, not official Goethe pass marks.",
        ),
      },
      ex("mini_test", "test-hoeren", "m8-test-hoeren"),
      ex("mini_test", "test-lesen", "m8-test-lesen"),
      ex("mini_test", "test-formular", "m8-test-formular"),
      ex("mastery_check", "test-grammatik", "m8-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m8-test-wortschatz"),
      ex("speaking", "test-sprechen", "m8-test-sprechen"),
    ],
  },
];

export const MODULE_8 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 8 (metadata only).",
  },
  module: {
    slug: "gesundheit",
    order: 8,
    title: { de: "Gesundheit", en: "Health" },
    description: en("The body, feeling ill, the doctor's practice, instructions, simple advice and the pharmacy."),
    goals: [
      en("Name the main parts of the body."),
      en("Say how you feel and what hurts."),
      en("Make an appointment and manage the reception at a doctor's practice."),
      en("Understand and give instructions and tips with the imperative (du, ihr, Sie)."),
      en("Understand advice and rules with sollen, müssen and dürfen."),
      en("Understand phone messages from a practice or a pharmacy."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-8", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-9", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-7", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" },
      { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
