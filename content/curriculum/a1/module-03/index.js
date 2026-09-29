// A1 Module 3 "In der Stadt" – places, transport, directions, months and seasons, signs.
// Mapping (metadata only): Netzwerk neu A1 Kap. 3 (+ Plattform 1 review); Grammatik aktiv
// 15, 16, 9; prepares Goethe A1 Hören Teil 2 (announcements, heard once) and Lesen Teil 3
// (signs). See docs/REFERENCE-ANALYSIS.md §4 and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { PLACES, TRANSPORT, DIRECTIONS, MONTHS_SEASONS, ADJECTIVES_SIGNS, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m3-/, ""), e.slug));

const LESSONS = [
  {
    slug: "was-gibt-es-in-der-stadt",
    order: 1,
    title: { de: "Was gibt es in der Stadt?", en: "What is there in the city?" },
    description: en("Name places and buildings in a city and use ein / eine."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this lesson you learn the names of important places in a city: the station, the church, the cinema, the park and more.\n\nYou also learn the indefinite article ein / eine (“a / an”). You already know der, die and das. Now: der Bahnhof → ein Bahnhof, das Kino → ein Kino, die Kirche → eine Kirche.\n\nGoal: you can say what there is in a city – Hier gibt es ein Museum und eine Kirche.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Places in the city"), vocab: slugs(PLACES) },
      { type: "grammar", key: "grammatik-ein-eine", grammar: "m3-unbestimmter-artikel" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "mit-bus-und-bahn",
    order: 2,
    title: { de: "Mit Bus und Bahn", en: "By bus and train" },
    description: en("Talk about transport and say no with kein / keine and nicht."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "How do you get around in a German city? By bus, by underground (U-Bahn), by train – or on foot (zu Fuß).\n\nLearn mit dem Bus and mit der U-Bahn (“by bus”, “by underground”) as fixed phrases for now; you learn the grammar behind them later.\n\nYou also learn to say no: Das ist kein Bus. Der Bahnhof ist nicht weit.\n\nGoal: you can name means of transport and make negative sentences with kein / keine and nicht.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Transport"), vocab: slugs(TRANSPORT) },
      { type: "grammar", key: "grammatik-negation", grammar: "m3-negation-kein-nicht" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "wie-komme-ich-zum-bahnhof",
    order: 3,
    title: { de: "Wie komme ich zum Bahnhof?", en: "How do I get to the station?" },
    description: en("Ask for the way and give simple directions with the Sie imperative."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "You are in a new city and need to find the station. In this lesson you learn to ask for the way politely – Entschuldigung, wie komme ich zum Bahnhof? – and to understand the answer.\n\nDirections are often polite instructions (the imperative with Sie): Gehen Sie geradeaus! Nehmen Sie die U-Bahn!\n\nAnd if someone asks you and you don't know: Ich bin nicht von hier.\n\nGoal: you can ask for directions, understand simple answers and give simple directions yourself.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Directions"), vocab: slugs(DIRECTIONS) },
      { type: "grammar", key: "grammatik-imperativ", grammar: "m3-imperativ-sie" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "monate-jahreszeiten-schilder",
    order: 4,
    title: { de: "Im Sommer ist die Stadt schön", en: "Months, seasons and signs" },
    description: en("Name the months and seasons, describe places with adjectives, and understand signs and announcements."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this lesson you learn the twelve months and the four seasons. All months and seasons are der-words. To say “in May” or “in summer”, use im: im Mai, im Sommer.\n\nYou also describe places with adjectives after sein: Die Stadt ist schön. Das Museum ist geschlossen.\n\nFinally, you practise two exam tasks: reading signs (Goethe Lesen Teil 3) and understanding public announcements at the station or in a museum (Goethe Hören Teil 2). In the exam you hear announcements only once.",
        ),
      },
      { type: "vocabulary", key: "woerter-monate", title: en("Months and seasons"), vocab: slugs(MONTHS_SEASONS) },
      { type: "vocabulary", key: "woerter-schilder", title: en("Describing places and signs"), vocab: slugs(ADJECTIVES_SIGNS) },
      { type: "grammar", key: "grammatik-adjektive", grammar: "m3-adjektiv-nach-sein" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "wiederholung-1",
    order: 5,
    title: { de: "Wiederholung: Module 1–3", en: "Review: modules 1–3" },
    description: en("Revise greetings, numbers, spelling, jobs, weekdays, verbs, articles, negation and directions."),
    estimatedMinutes: 30,
    refs: [{ ref: "netzwerk-neu-a1-p1", note: "Topic alignment only" }],
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Time to review! This lesson mixes everything from Modules 1 to 3: greetings, introductions, numbers, spelling, jobs, weekdays, sein and haben, verbs with a vowel change, yes/no questions, der / die / das and plurals – and from this module ein / kein, nicht, the Sie imperative and directions.\n\nThere are no new words. If something is difficult, go back to the lesson where you learned it.",
        ),
      },
      ...exerciseBlocks(E.L5),
    ],
  },
  {
    slug: "modultest",
    order: 6,
    title: { de: "Modultest: In der Stadt", en: "Module test" },
    description: en("Check what you have learned in Goethe-style tasks: listening, reading, writing, grammar and vocabulary."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This test uses the task types of the Goethe-Zertifikat A1, with our own texts: announcements you hear only once, signs, and a form. You need 70% in each part to complete it, and you can try again as often as you like.\n\nImportant: these are the app's learning targets, not official Goethe pass marks.",
        ),
      },
      ex("mini_test", "test-hoeren", "m3-test-hoeren"),
      ex("mini_test", "test-lesen", "m3-test-lesen"),
      ex("mini_test", "test-formular", "m3-test-formular"),
      ex("mastery_check", "test-grammatik", "m3-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m3-test-wortschatz"),
      ex("speaking", "test-sprechen", "m3-test-sprechen"),
    ],
  },
];

export const MODULE_3 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 3 (metadata only).",
  },
  module: {
    slug: "in-der-stadt",
    order: 3,
    title: { de: "In der Stadt", en: "In the city" },
    description: en("Places in a city, transport, directions, months and seasons, and public signs."),
    goals: [
      en("Name places and buildings in a city and say what there is: Hier gibt es ein Kino."),
      en("Talk about transport: bus, underground, train, on foot."),
      en("Say no with kein / keine and nicht."),
      en("Ask for the way and give simple directions with the Sie imperative."),
      en("Name the months and seasons and describe places with adjectives."),
      en("Understand public signs and short announcements."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-3", note: "Chapter alignment only" },
      { ref: "netzwerk-neu-a1-p1", note: "Review lesson alignment only" },
      { ref: "grammatik-aktiv-15", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-16", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-9", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-hoeren", note: "Prepares Teil 2 (public announcements, heard once)" },
      { ref: "goethe-start-deutsch-1-lesen", note: "Prepares Teil 3 (signs and notices)" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
