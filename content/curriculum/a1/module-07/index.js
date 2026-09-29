// A1 Module 7 "Arbeit & Büro".
// Mapping (metadata only): Netzwerk neu A1 Kap. 7; Grammatik aktiv 44, 18, 33, 35;
// prepares Goethe A1 Lesen Teil 1 (e-mails, richtig/falsch) and Lesen Teil 2 (a or b?).
// See docs/REFERENCE-ANALYSIS.md §4 and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { OFFICE, EQUIPMENT, EMAILS, COLLEAGUES, BUILDING, BANK, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m7-/, ""), e.slug));

const LESSONS = [
  {
    slug: "im-buero",
    order: 1,
    title: { de: "Im Büro", en: "At the office" },
    description: en("Talk about the people and things in an office, and connect sentences with und, oder and aber."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Welcome to the office! In this module you learn the German you need at work: colleagues, office equipment, e-mails, small talk and a visit to the bank.\n\nIn this lesson you learn the words for the people and things in an office – der Chef, die Kollegin, der Drucker, der Computer – and how to say that something doesn't work: Der Drucker ist kaputt.\n\nYou also learn to join two sentences with und, oder and aber. Good news: the word order doesn't change after them.\n\nGoal: you can describe your office and a small problem at work.",
        ),
      },
      { type: "vocabulary", key: "woerter-buero", title: en("People and places in the office"), vocab: slugs(OFFICE) },
      { type: "vocabulary", key: "woerter-technik", title: en("Office equipment – and oder, aber"), vocab: slugs(EQUIPMENT) },
      { type: "grammar", key: "grammatik-und-oder-aber", grammar: "m7-und-oder-aber" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "e-mails-im-buero",
    order: 2,
    title: { de: "E-Mails im Büro", en: "E-mails at work" },
    description: en("Read and write short work e-mails, and use the dative for the person who receives something."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "At work you read and write e-mails every day. A formal e-mail starts with Sehr geehrte Frau … / Sehr geehrter Herr … and ends with Mit freundlichen Grüßen.\n\nWhen you send or write something to someone, that person is in the dative: Ich schicke dem Chef die Datei. You learn the dative articles dem, der, dem, den.\n\nIn the Goethe A1 exam (Lesen Teil 1) you read short e-mails and decide if sentences are richtig or falsch. You practise that here.\n\nGoal: you can understand a short work e-mail and write a simple reply.",
        ),
      },
      { type: "vocabulary", key: "woerter-e-mail", title: en("E-mails"), vocab: slugs(EMAILS) },
      { type: "grammar", key: "grammatik-dativ", grammar: "m7-dativ-artikel" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "mittagspause",
    order: 3,
    title: { de: "Mittagspause mit Kollegen", en: "Lunch break with colleagues" },
    description: en("Make small talk with colleagues and say who you do things with – mit + dative."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "At lunchtime, many German colleagues greet each other with Mahlzeit! and eat together in the canteen (die Kantine).\n\nIn this lesson you learn short small-talk phrases: Ich habe viel zu tun. Die Woche ist stressig. Wann hast du Feierabend?\n\nYou also learn the preposition mit. After mit you always use the dative: mit dem Chef, mit meiner Kollegin, mit dem Bus.\n\nGoal: you can have a short, friendly chat with a colleague.",
        ),
      },
      { type: "vocabulary", key: "woerter-kollegen", title: en("Colleagues and breaks"), vocab: slugs(COLLEAGUES) },
      { type: "grammar", key: "grammatik-mit", grammar: "m7-mit-dativ" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "wo-ist-das",
    order: 4,
    title: { de: "Wo ist …? Im Gebäude und in der Bank", en: "Where is …? In the building and at the bank" },
    description: en("Say where people and things are, find information, and manage a simple visit to the bank."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Where is the printer? Where is Ms Klein? To answer, you use a preposition with the dative: im Flur, auf dem Schreibtisch, neben dem Eingang, bei Frau Klein.\n\nYou also visit a bank: open an account, sign a form and find the cash machine.\n\nIn the Goethe A1 exam (Lesen Teil 2) you read a situation and choose between two short texts, a or b: where do you find the information? You practise that here too.\n\nGoal: you can ask and say where something is, and handle a simple bank visit.",
        ),
      },
      { type: "vocabulary", key: "woerter-gebaeude", title: en("In the building"), vocab: slugs(BUILDING) },
      { type: "vocabulary", key: "woerter-bank", title: en("At the bank"), vocab: slugs(BANK) },
      { type: "grammar", key: "grammatik-wo", grammar: "m7-wo-praepositionen-dativ" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "modultest",
    order: 5,
    title: { de: "Modultest: Arbeit & Büro", en: "Module test" },
    description: en("Check what you have learned in Goethe-style tasks: listening, reading, writing, grammar and vocabulary."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This test uses the task types of the Goethe-Zertifikat A1, with our own texts: short recordings, an e-mail (richtig/falsch), “a or b?” texts, a short written reply, grammar and vocabulary. You need 70% in each part to complete it, and you can try again as often as you like.\n\nImportant: these are the app's learning targets, not official Goethe pass marks.",
        ),
      },
      ex("mini_test", "test-hoeren", "m7-test-hoeren"),
      ex("mini_test", "test-lesen", "m7-test-lesen"),
      ex("mini_test", "test-lesen-quellen", "m7-test-lesen-quellen"),
      ex("mini_test", "test-schreiben", "m7-test-schreiben"),
      ex("mastery_check", "test-grammatik", "m7-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m7-test-wortschatz"),
      ex("speaking", "test-sprechen", "m7-test-sprechen"),
    ],
  },
];

export const MODULE_7 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 7 (metadata only).",
  },
  module: {
    slug: "arbeit-und-buero",
    order: 7,
    title: { de: "Arbeit & Büro", en: "Work and the office" },
    description: en("Office routine and equipment, work e-mails, small talk with colleagues, where things are, and a simple bank visit."),
    goals: [
      en("Name people, rooms and equipment in an office and describe a small problem."),
      en("Connect sentences with und, oder and aber."),
      en("Understand and write short formal and informal work e-mails."),
      en("Use the dative: dem, der, dem, den; mit + dative."),
      en("Say where people and things are with in, an, auf, neben and bei."),
      en("Open a bank account and ask for a cash machine."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-7", note: "Chapter alignment only" },
      { ref: "grammatik-aktiv-44", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-18", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-33", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-35", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-lesen", note: "Prepares Teil 1 (e-mails, richtig/falsch) and Teil 2 (a or b?)" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
