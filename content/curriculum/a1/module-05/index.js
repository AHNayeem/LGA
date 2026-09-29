// A1 Module 5 "Alltag & Familie".
// Mapping (metadata only): Netzwerk neu A1 Kap. 5; Grammatik aktiv 32, 19, 5;
// prepares Goethe A1 Hören Teil 3 (phone messages) and Sprechen Teil 2. See
// docs/REFERENCE-ANALYSIS.md §4 and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { TIME, ROUTINE, FAMILY, APPOINTMENTS, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m5-/, ""), e.slug));

const LESSONS = [
  {
    slug: "wie-spaet-ist-es",
    order: 1,
    title: { de: "Wie spät ist es?", en: "What time is it?" },
    description: en("Ask for and tell the time – the official way and the informal way."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this lesson you learn to tell the time in German.\n\nThere are two systems. The official time (acht Uhr fünfzehn, vierzehn Uhr dreißig) is used on the radio, at stations and in offices. In everyday conversation people say Viertel nach acht or halb drei.\n\nCareful: halb always looks ahead to the next hour. halb drei is 2:30, not 3:30.\n\nGoal: you can ask what time it is and understand and say times in both ways.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Telling the time"), vocab: slugs(TIME) },
      { type: "grammar", key: "grammatik-uhrzeit", grammar: "m5-uhrzeit" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "mein-alltag",
    order: 2,
    title: { de: "Mein Alltag", en: "My daily routine" },
    description: en("Talk about your day: parts of the day, routines and times with am, um and von … bis."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "When do you have breakfast? When do you work? In this lesson you describe your day.\n\nYou learn the parts of the day (der Morgen, der Nachmittag, der Abend …) and three small words for time: am Montag, um acht Uhr, von neun bis fünf.\n\nGoal: you can describe your daily routine and ask others about theirs.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Daily routine"), vocab: slugs(ROUTINE) },
      { type: "grammar", key: "grammatik-am-um-von-bis", grammar: "m5-temporale-praepositionen" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "meine-familie",
    order: 3,
    title: { de: "Meine Familie", en: "My family" },
    description: en("Name family members and say whose they are: mein Vater, deine Schwester, ihr Sohn."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this lesson you talk about your family: parents, children, brothers and sisters, grandparents.\n\nTo say whose family member it is, you need possessive articles: mein Bruder (my brother), deine Mutter (your mother), seine Frau (his wife). Their endings work like ein and eine.\n\nGoal: you can introduce your family and ask about someone else's.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("The family"), vocab: slugs(FAMILY) },
      { type: "grammar", key: "grammatik-possessivartikel", grammar: "m5-possessivartikel" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "termine-am-telefon",
    order: 4,
    title: { de: "Termine am Telefon", en: "Appointments on the phone" },
    description: en("Make and change appointments, understand phone messages and apologise for being late."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Can you come at eight? I have to work today. I'm sorry, I'm late! For appointments you need the modal verbs können, müssen and wollen.\n\nThe modal verb is in position 2; the second verb goes to the end: Ich muss heute arbeiten.\n\nIn part 3 of the A1 listening exam you hear short phone messages, each one twice. Listen for the day and the time.\n\nGoal: you can make an appointment, understand a voicemail message and say sorry when you are late.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Appointments"), vocab: slugs(APPOINTMENTS) },
      { type: "grammar", key: "grammatik-modalverben", grammar: "m5-modalverben" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "modultest",
    order: 5,
    title: { de: "Modultest: Alltag & Familie", en: "Module test" },
    description: en("Check what you have learned in Goethe-style tasks: listening, reading, writing, grammar and vocabulary."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This test uses the task types of the Goethe-Zertifikat A1, with our own texts: phone messages (played twice), a short note, a form, grammar and vocabulary, and a speaking practice with word cards. You need 70% in each part to complete it, and you can try again as often as you like.\n\nImportant: these are the app's learning targets, not official Goethe pass marks.",
        ),
      },
      ex("mini_test", "test-hoeren", "m5-test-hoeren"),
      ex("mini_test", "test-lesen", "m5-test-lesen"),
      ex("mini_test", "test-formular", "m5-test-formular"),
      ex("mastery_check", "test-grammatik", "m5-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m5-test-wortschatz"),
      ex("speaking", "test-sprechen", "m5-test-sprechen"),
    ],
  },
];

export const MODULE_5 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 5 (metadata only).",
  },
  module: {
    slug: "alltag-und-familie",
    order: 5,
    title: { de: "Alltag & Familie", en: "Daily life and family" },
    description: en("Telling the time, daily routine, family, appointments by phone and apologising for being late."),
    goals: [
      en("Ask for and tell the time, officially and informally."),
      en("Describe your daily routine with am, um and von … bis."),
      en("Talk about your family with mein, dein, sein, ihr …"),
      en("Make appointments with können, müssen and wollen."),
      en("Understand short phone messages and apologise for being late."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-5", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-32", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-19", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-5", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" },
      { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
