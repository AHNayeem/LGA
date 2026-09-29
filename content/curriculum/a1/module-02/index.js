// A1 Module 2 "Menschen & Berufe".
// Mapping (metadata only): Netzwerk neu A1 Kap. 2; Grammatik aktiv 3, 4, 11, 14, 15;
// prepares Goethe A1 Schreiben Teil 1 (form) and Sprechen Teil 1/2. See
// docs/REFERENCE-ANALYSIS.md §4 and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { HOBBIES, JOBS, WORK_WEEK, NUMBERS_FORMS, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m2-/, ""), e.slug));

const WEEKDAYS = ["montag", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag", "sonntag", "wochenende", "frei", "doch"];
const WORKPLACES = slugs(WORK_WEEK).filter((s) => !WEEKDAYS.includes(s));
const NUMBERS = slugs(NUMBERS_FORMS).filter((s) => s.startsWith("zahl-"));
const FORMS = slugs(NUMBERS_FORMS).filter((s) => !s.startsWith("zahl-"));

const LESSONS = [
  {
    slug: "hobbys",
    order: 1,
    title: { de: "Was machst du gern?", en: "What do you like doing?" },
    description: en("Talk about your hobbies and use verbs with a vowel change: fahren, lesen, sehen."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this lesson you talk about hobbies: what you like doing in your free time.\n\nThe key word is gern. Put it after the verb: Ich schwimme gern. = I like swimming.\n\nSome verbs change their vowel with du and er/sie/es – you already know sprechen → du sprichst. Now you learn fahren → du fährst, lesen → du liest and sehen → du siehst.\n\nGoal: you can say what you like doing and ask others about their hobbies.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Hobbies"), vocab: slugs(HOBBIES) },
      { type: "grammar", key: "grammatik-vokalwechsel", grammar: "m2-verben-vokalwechsel" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "berufe",
    order: 2,
    title: { de: "Was sind Sie von Beruf?", en: "What do you do?" },
    description: en("Name jobs, say what you do and use sein and haben in all forms."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "What do you do for a living? This is one of the first questions people ask – and “Beruf” is on the keyword card in the A1 speaking exam.\n\nMost jobs have a form for men and a form for women: der Lehrer, die Lehrerin. With sein you say your job without an article: Ich bin Lehrerin.\n\nYou also learn all the forms of sein and haben, the two most important verbs in German.\n\nGoal: you can say what your job is and ask others about theirs.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Jobs"), vocab: slugs(JOBS) },
      { type: "grammar", key: "grammatik-sein-haben", grammar: "m2-sein-und-haben" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "arbeitsplatz-und-wochentage",
    order: 3,
    title: { de: "Arbeitsplätze und Wochentage", en: "Workplaces and days of the week" },
    description: en("Say where and on which days you work, ask yes/no questions and learn der, die, das."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Where do you work, and when? In this lesson you learn workplaces and the days of the week.\n\nFor days, use am: am Montag (on Monday), am Wochenende (at the weekend). Learn these as fixed phrases too: in der Schule, im Krankenhaus, bei + a company name. The grammar behind them comes in a later module.\n\nYou also learn to ask yes/no questions (Arbeitest du am Montag?) and to answer with ja, nein or doch. Finally, you see why every German noun comes with der, die or das.",
        ),
      },
      { type: "vocabulary", key: "arbeitsplaetze", title: en("Workplaces"), vocab: WORKPLACES },
      { type: "vocabulary", key: "wochentage", title: en("Days of the week"), vocab: WEEKDAYS },
      { type: "grammar", key: "grammatik-ja-nein-fragen", grammar: "m2-ja-nein-fragen" },
      { type: "grammar", key: "grammatik-artikel", grammar: "m2-bestimmter-artikel" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "zahlen-und-formulare",
    order: 4,
    title: { de: "Zahlen ab 20 und Formulare", en: "Numbers from 20 and forms" },
    description: en("Count to one hundred and beyond, give your age and address, and fill in a form."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "From 21 on, German says the ones first: einundzwanzig = one-and-twenty (21), vierunddreißig = four-and-thirty (34). Write the number as one word.\n\nThe tens end in -zig – except dreißig (30). Careful: sechzig (60) and siebzig (70) are shorter than sechs and sieben. 100 is hundert, 1000 is tausend.\n\nIn the A1 writing exam (part 1) you fill in a form with personal information: name, age, address, postcode, job. You also learn how German plurals work.",
        ),
      },
      { type: "vocabulary", key: "zahlen", title: en("30 to 100"), vocab: NUMBERS },
      { type: "vocabulary", key: "formular", title: en("On a form"), vocab: FORMS },
      { type: "grammar", key: "grammatik-plural", grammar: "m2-nomen-plural" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "modultest",
    order: 5,
    title: { de: "Modultest: Menschen & Berufe", en: "Module test" },
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
      ex("mini_test", "test-hoeren", "m2-test-hoeren"),
      ex("mini_test", "test-lesen", "m2-test-lesen"),
      ex("mini_test", "test-formular", "m2-test-formular"),
      ex("mastery_check", "test-grammatik", "m2-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m2-test-wortschatz"),
      ex("speaking", "test-sprechen", "m2-test-sprechen"),
    ],
  },
];

export const MODULE_2 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 2 (metadata only).",
  },
  module: {
    slug: "menschen-und-berufe",
    order: 2,
    title: { de: "Menschen & Berufe", en: "People and jobs" },
    description: en("Hobbies, jobs and workplaces, days of the week, numbers from 20, age and filling in forms."),
    goals: [
      en("Talk about hobbies and what you like doing."),
      en("Say what your job is and where and when you work."),
      en("Ask and answer yes/no questions."),
      en("Understand and say numbers from 20 to 100 and beyond, including ages and postcodes."),
      en("Fill in a form with personal information."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-2", note: "Chapter alignment only" },
      { ref: "grammatik-aktiv-3", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-4", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-11", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-14", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-15", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-schreiben", note: "Prepares Teil 1 (form)" },
      { ref: "goethe-start-deutsch-1-sprechen", note: "Prepares Teil 1 (self-introduction) and Teil 2 (questions on a topic)" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
