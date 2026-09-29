// A1 Module 10 "Was hast du gemacht?" – talking about the past, school, studies, job search
// and phone calls. Mapping (metadata only): Netzwerk neu A1 Kap. 10; Grammatik aktiv 26
// (25 revisited); prepares Goethe A1 Sprechen Teil 2 and Hören Teil 1. See
// docs/REFERENCE-ANALYSIS.md §3–4 and docs/CURRICULUM-A1.md. Following the curriculum
// decision, the Perfekt is taught receptively and with high-frequency verbs only.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { PAST_TIME, PARTICIPLES_1, SCHOOL, PARTICIPLES_2, JOB_SEARCH, PARTICIPLES_SEIN, PHONE, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m10-/, ""), e.slug));

const LESSONS = [
  {
    slug: "am-wochenende",
    order: 1,
    title: { de: "Was hast du am Wochenende gemacht?", en: "What did you do at the weekend?" },
    description: en("Understand and answer questions about yesterday and the weekend."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "On Monday morning everybody asks: Wie war dein Wochenende? Was hast du gemacht?\n\nTo talk about the past, spoken German mostly uses the Perfekt: Ich habe einen Film gesehen. It has two parts – haben in position 2 and a Partizip II (gesehen) at the end.\n\nAt A1 you don't need every verb. You learn to understand the Perfekt and to use ten very common verbs. Goal: you can understand what someone did at the weekend and say one or two sentences about your own weekend.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Talking about the past"), vocab: slugs(PAST_TIME) },
      { type: "vocabulary", key: "partizipien", title: en("Past participles (1)"), vocab: slugs(PARTICIPLES_1) },
      { type: "grammar", key: "grammatik-perfekt-haben", grammar: "m10-perfekt-mit-haben" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "schule-und-studium",
    order: 2,
    title: { de: "Schule und Studium", en: "School and studies" },
    description: en("Talk in simple terms about your school, studies and courses."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Where did you go to school? What did you study? In a German course, at the job centre or at a new job, people often ask about your education.\n\nYou also look at how the Partizip II is built: regular verbs take ge- … -t (gemacht, gelernt), verbs in -ieren take no ge- (telefoniert, studiert), and some common verbs are irregular (gegessen, geschrieben).\n\nGoal: you can understand a short text about someone's school and studies and say a few words about your own.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("School and studies"), vocab: slugs(SCHOOL) },
      { type: "vocabulary", key: "partizipien", title: en("Past participles (2)"), vocab: slugs(PARTICIPLES_2) },
      { type: "grammar", key: "grammatik-partizip-ii", grammar: "m10-partizip-ii" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "jobsuche",
    order: 3,
    title: { de: "Ich suche eine Stelle", en: "Looking for a job" },
    description: en("Read a simple job ad and write a short application."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Job ads are short and full of key words: Kellner gesucht!, Teilzeit, Erfahrung, Bewerbung mit Lebenslauf. You learn to find the important information quickly.\n\nYou also meet three verbs that form the Perfekt with sein instead of haben: ich bin gefahren, ich bin gegangen, ich bin gekommen. Learn these as chunks – the full rules come in A2.\n\nGoal: you can understand a simple job ad and write a few sentences about your work experience.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Job search"), vocab: slugs(JOB_SEARCH) },
      { type: "vocabulary", key: "partizipien", title: en("Perfekt with sein: three chunks"), vocab: slugs(PARTICIPLES_SEIN) },
      { type: "grammar", key: "grammatik-perfekt-sein", grammar: "m10-perfekt-mit-sein-chunks" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "am-telefon",
    order: 4,
    title: { de: "Am Telefon", en: "On the phone" },
    description: en("Ask for someone on the phone, leave a message and ask for a call back."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Phone calls are hard in a new language, because you can't see the other person. The good news: most calls use the same few sentences. Hier spricht … – Kann ich bitte … sprechen? – Sie ist leider nicht da. – Kann ich etwas ausrichten? – Auf Wiederhören!\n\nYou also revise war and hatte: with sein and haben, Germans usually use these forms instead of the Perfekt.\n\nGoal: you can make a simple phone call, understand a short message and note a phone number.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("On the phone"), vocab: slugs(PHONE) },
      { type: "grammar", key: "grammatik-war-hatte", grammar: "m10-praeteritum-war-hatte" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "modultest",
    order: 5,
    title: { de: "Modultest: Was hast du gemacht?", en: "Module test" },
    description: en("Check what you have learned in Goethe-style tasks: listening, reading, writing, grammar and vocabulary."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This test uses the task types of the Goethe-Zertifikat A1, with our own texts. You need 70% in each part to complete it, and you can try again as often as you like. The speaking part is practice only and is not scored.\n\nImportant: these are the app's learning targets, not official Goethe pass marks.",
        ),
      },
      ex("mini_test", "test-hoeren", "m10-test-hoeren"),
      ex("mini_test", "test-lesen", "m10-test-lesen"),
      ex("mini_test", "test-formular", "m10-test-formular"),
      ex("mastery_check", "test-grammatik", "m10-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m10-test-wortschatz"),
      ex("speaking", "test-sprechen", "m10-test-sprechen"),
    ],
  },
];

export const MODULE_10 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 10 (metadata only).",
  },
  module: {
    slug: "was-hast-du-gemacht",
    order: 10,
    title: { de: "Was hast du gemacht?", en: "What did you do?" },
    description: en("The weekend and the past, school and studies, job search and phone calls; the Perfekt (receptive) and war/hatte."),
    goals: [
      en("Understand what someone did yesterday or at the weekend, and say a few sentences about your own weekend."),
      en("Recognise the Perfekt and use it with ten common verbs; use ich bin gefahren/gegangen/gekommen as chunks."),
      en("Talk in simple terms about your school, studies and work experience."),
      en("Understand a simple job ad and write a short application."),
      en("Make a simple phone call: ask for someone, leave a message and ask for a call back."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-10", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-26", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-25", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-sprechen", note: "Task format only" },
      { ref: "goethe-start-deutsch-1-hoeren", note: "Task format only" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
