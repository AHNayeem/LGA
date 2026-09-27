// A1 Module 1 "Hallo!" – the production validation module for the lesson engine.
// Mapping (metadata only): Netzwerk neu A1 Kap. 1; Grammatik aktiv 1, 2, 10, 12;
// prepares Goethe A1 Sprechen Teil 1 and Hören (numbers, spelling). See
// docs/REFERENCE-ANALYSIS.md §4 and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { GREETINGS, INTRODUCTIONS, ORIGIN, NUMBERS_0_10, NUMBERS_11_20, SPELLING, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m1-/, ""), e.slug));

const LESSONS = [
  {
    slug: "hallo-und-tschuess",
    order: 1,
    title: { de: "Hallo und Tschüs!", en: "Hello and goodbye" },
    description: en("Greet people and say goodbye – formally and informally."),
    estimatedMinutes: 20,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this lesson you learn how to say hello and goodbye in German.\n\nGermans choose their greeting by the time of day and by how well they know someone. With friends you say Hallo! and Tschüs!. With people you don't know, you say Guten Tag! and Auf Wiedersehen!.\n\nGoal: you can greet someone correctly in any everyday situation.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Greetings"), vocab: slugs(GREETINGS) },
      { type: "grammar", key: "du-oder-sie", grammar: "du-und-sie" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "ich-heisse",
    order: 2,
    title: { de: "Ich heiße …", en: "My name is …" },
    description: en("Say your name, ask for names, and use ich, du and Sie."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Now you introduce yourself. You need two verbs: heißen (to be called) and sein (to be).\n\nIch heiße Lena. = Ich bin Lena. Both mean “My name is Lena / I'm Lena”.\n\nGoal: you can say your name and ask someone for theirs, informally and formally.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Introducing yourself"), vocab: slugs(INTRODUCTIONS) },
      { type: "grammar", key: "verben", grammar: "verben-praesens-modul-1" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "woher-kommst-du",
    order: 3,
    title: { de: "Woher kommst du?", en: "Where are you from?" },
    description: en("Talk about where you come from, where you live and which languages you speak."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Where are you from? Where do you live? Which languages do you speak? These are the first questions people ask in a German course – and in the A1 speaking exam.\n\nYou also learn an important rule: in German statements and W-questions, the verb is always in position 2.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Countries and languages"), vocab: slugs(ORIGIN) },
      { type: "grammar", key: "satzbau", grammar: "satzbau-position-2" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "zahlen-0-bis-20",
    order: 4,
    title: { de: "Zahlen von 0 bis 20", en: "Numbers from 0 to 20" },
    description: en("Count to twenty, give your age and your phone number."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Numbers appear in every part of the A1 exam: phone numbers, ages, prices and times.\n\nThe numbers 13 to 19 are built like this: drei + zehn = dreizehn. Careful with sechzehn (16) and siebzehn (17) – they are shorter than you might expect.\n\nGerman phone numbers are usually read digit by digit or in pairs.",
        ),
      },
      { type: "vocabulary", key: "zahlen-0-10", title: en("0 to 10"), vocab: slugs(NUMBERS_0_10) },
      { type: "vocabulary", key: "zahlen-11-20", title: en("11 to 20 and more"), vocab: slugs(NUMBERS_11_20) },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "das-alphabet",
    order: 5,
    title: { de: "Das Alphabet", en: "The alphabet" },
    description: en("Spell your name and your e-mail address."),
    estimatedMinutes: 20,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In the A1 speaking exam you are often asked to spell your name. On the phone you often have to spell names and e-mail addresses too.\n\nLearn the German letter names, especially the ones that sound different from English: E, I, J, V, W, Y and Z.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Spelling"), vocab: slugs(SPELLING) },
      { type: "grammar", key: "alphabet", grammar: "das-alphabet" },
      ...exerciseBlocks(E.L5),
    ],
  },
  {
    slug: "modultest",
    order: 6,
    title: { de: "Modultest: Hallo!", en: "Module test" },
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
      ex("mini_test", "test-hoeren", "m1-test-hoeren"),
      ex("mini_test", "test-lesen", "m1-test-lesen"),
      ex("mini_test", "test-formular", "m1-test-formular"),
      ex("mastery_check", "test-grammatik", "m1-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m1-test-wortschatz"),
      ex("speaking", "test-sprechen", "m1-test-sprechen"),
    ],
  },
];

export const MODULE_1 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 1 (metadata only).",
  },
  module: {
    slug: "hallo",
    order: 1,
    title: { de: "Hallo!", en: "Hello!" },
    description: en("Greetings, introductions, countries and languages, numbers 0–20 and spelling."),
    goals: [
      en("Greet people and say goodbye, formally and informally."),
      en("Introduce yourself: name, country, city and languages."),
      en("Ask simple W-questions: Wie? Wer? Was? Woher? Wo?"),
      en("Understand and say numbers from 0 to 20 and phone numbers."),
      en("Spell your name and your e-mail address."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-1", note: "Chapter alignment only" },
      { ref: "grammatik-aktiv-1", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-2", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-10", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-12", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-sprechen", note: "Prepares Teil 1 (self-introduction, spelling, numbers)" },
      { ref: "goethe-start-deutsch-1-hoeren", note: "Prepares Teil 1 (numbers, short dialogues)" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
