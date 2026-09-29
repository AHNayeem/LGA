// A1 Module 6 "Freizeit & Feste".
// Mapping (metadata only): Netzwerk neu A1 Kap. 6 (review lesson: Plattform 2);
// Grammatik aktiv 8, 21, 34, 25; prepares Goethe A1 Schreiben Teil 2 (short message,
// made auto-gradable here) and Lesen Teil 1 (short e-mails). See
// docs/REFERENCE-ANALYSIS.md §4 and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { DATES, BIRTHDAYS, INVITATIONS, ORDERING, PAYING, EVENTS, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m6-/, ""), e.slug));

const LESSONS = [
  {
    slug: "wann-hast-du-geburtstag",
    order: 1,
    title: { de: "Wann hast du Geburtstag?", en: "When is your birthday?" },
    description: en("Say the date with ordinal numbers and talk about birthdays and parties."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this lesson you learn to say dates: Heute ist der dritte Mai. Ich habe am dritten Mai Geburtstag.\n\nFor dates German uses ordinal numbers (first, second, third …). You also learn what to say at a birthday: Herzlichen Glückwunsch! and Alles Gute zum Geburtstag!\n\nGoal: you can ask for and give the date and say when your birthday is.",
        ),
      },
      { type: "vocabulary", key: "woerter-datum", title: en("Dates and ordinal numbers"), vocab: slugs(DATES) },
      { type: "vocabulary", key: "woerter-geburtstag", title: en("Birthdays and parties"), vocab: slugs(BIRTHDAYS) },
      { type: "grammar", key: "grammatik-datum", grammar: "m6-datum-ordinalzahlen" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "kommst-du-mit",
    order: 2,
    title: { de: "Kommst du mit?", en: "Are you coming along?" },
    description: en("Invite friends, accept and decline invitations, and use separable verbs and accusative pronouns."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Now you invite friends and answer invitations. Many important verbs here are separable: einladen → Ich lade dich ein. mitkommen → Kommst du mit?\n\nYou also learn the accusative pronouns mich, dich, ihn, sie, es, uns, euch – for sentences like Ich rufe dich an.\n\nGoal: you can write and answer a short invitation, which is a typical task in the A1 writing exam (Schreiben Teil 2).",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Invitations"), vocab: slugs(INVITATIONS) },
      { type: "grammar", key: "grammatik-trennbare-verben", grammar: "m6-trennbare-verben" },
      { type: "grammar", key: "grammatik-pronomen", grammar: "m6-personalpronomen-akkusativ" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "im-cafe",
    order: 3,
    title: { de: "Im Café", en: "In the café" },
    description: en("Order and pay in a café or restaurant, and use für + accusative."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Meeting friends often means going to a café. In this lesson you learn to ask for a seat, order, ask for the bill and pay.\n\nWhen you order for someone else, you use für + accusative: Für mich einen Kaffee, und für meine Frau einen Tee.\n\nTip: in Germany the waiter often asks Zusammen oder getrennt? – do you pay together or separately? A small tip is usual: you round up and say Stimmt so!",
        ),
      },
      { type: "vocabulary", key: "woerter-bestellen", title: en("Ordering"), vocab: slugs(ORDERING) },
      { type: "vocabulary", key: "woerter-bezahlen", title: en("Paying"), vocab: slugs(PAYING) },
      { type: "grammar", key: "grammatik-fuer", grammar: "m6-fuer-akkusativ" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "wie-war-das-fest",
    order: 4,
    title: { de: "Wie war das Fest?", en: "How was the festival?" },
    description: en("Talk about events and say how they were with war and hatte."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Concerts, exhibitions, town festivals: in this lesson you talk about events – when they take place and how they were.\n\nTo talk about the past you learn two very common forms: war (was) and hatte (had). Wie war die Party? – Sie war super! Wir hatten viel Spaß.\n\nGoal: you can understand short messages about events and say how your weekend was.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Events"), vocab: slugs(EVENTS) },
      { type: "grammar", key: "grammatik-praeteritum", grammar: "m6-praeteritum-haben-sein" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "wiederholung-2",
    order: 5,
    title: { de: "Wiederholung: Module 4–6", en: "Review: Modules 4–6" },
    description: en("Revise food and shopping, daily life and family, and parties and invitations."),
    estimatedMinutes: 25,
    refs: [{ ref: "netzwerk-neu-a1-p2", note: "Topic alignment only" }],
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Time to revise! This lesson mixes Modules 4, 5 and 6 and uses only words you already know.\n\nModule 4: the accusative (einen Kaffee), möchten and mögen, word order.\nModule 5: am, um, von … bis, possessives (mein, dein …) and müssen, können, wollen.\nModule 6: separable verbs, accusative pronouns, für + accusative, war and hatte.\n\nIf something is difficult, go back to the grammar in that module and then try again.",
        ),
      },
      ...exerciseBlocks(E.L5),
    ],
  },
  {
    slug: "modultest",
    order: 6,
    title: { de: "Modultest: Freizeit & Feste", en: "Module test" },
    description: en("Check what you have learned in Goethe-style tasks: listening, reading, writing, grammar and vocabulary."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This test uses the task types of the Goethe-Zertifikat A1, with our own texts: short recordings, an e-mail (Lesen Teil 1) and a reply to an invitation (Schreiben Teil 2). You need 70% in each part to complete it, and you can try again as often as you like.\n\nImportant: these are the app's learning targets, not official Goethe pass marks.",
        ),
      },
      ex("mini_test", "test-hoeren", "m6-test-hoeren"),
      ex("mini_test", "test-lesen", "m6-test-lesen"),
      ex("mini_test", "test-schreiben", "m6-test-schreiben"),
      ex("mastery_check", "test-grammatik", "m6-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m6-test-wortschatz"),
      ex("speaking", "test-sprechen", "m6-test-sprechen"),
    ],
  },
];

export const MODULE_6 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 6 (metadata only).",
  },
  module: {
    slug: "freizeit-und-feste",
    order: 6,
    title: { de: "Freizeit & Feste", en: "Free time & celebrations" },
    description: en("Dates and birthdays, invitations, ordering and paying in a café, events and talking about the past with war and hatte."),
    goals: [
      en("Ask for and give the date with ordinal numbers (am ersten Mai)."),
      en("Talk about birthdays and parties and congratulate someone."),
      en("Invite someone, and accept or decline an invitation."),
      en("Order and pay in a café or restaurant."),
      en("Use separable verbs, accusative pronouns and für + accusative."),
      en("Say how an event was with war and hatte."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-6", note: "Chapter alignment only" },
      { ref: "netzwerk-neu-a1-p2", note: "Review lesson alignment only" },
      { ref: "grammatik-aktiv-8", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-21", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-34", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-25", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-schreiben", note: "Prepares Teil 2 (short message: invitations and replies)" },
      { ref: "goethe-start-deutsch-1-lesen", note: "Prepares Teil 1 (short e-mails, richtig/falsch)" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
