// A1 Module 9 "Wohnen".
// Mapping (metadata only): Netzwerk neu A1 Kap. 9 (review lesson: Plattform 3);
// Grammatik aktiv 34, 35; prepares Goethe A1 Lesen Teil 2 (ads) and Teil 3 (notices).
// See docs/REFERENCE-ANALYSIS.md and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { ROOMS, DESCRIBING, HOUSE, FURNITURE, POSITION, FLAT_SEARCH, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m9-/, ""), e.slug));

const LESSONS = [
  {
    slug: "meine-wohnung",
    order: 1,
    title: { de: "Meine Wohnung", en: "My flat" },
    description: en("Name the rooms of a flat and describe them: big, small, bright, cosy – and colourful."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "In this module you talk about where you live. First you learn the rooms of a flat: die Küche, das Bad, das Wohnzimmer …\n\nTo describe a room, you only need sein + an adjective: Die Küche ist klein und hell. After sein, the adjective never changes – not even for colours: Das Sofa ist rot.\n\nGoal: you can say what your flat has and what the rooms are like.",
        ),
      },
      { type: "vocabulary", key: "zimmer", title: en("Rooms"), vocab: slugs(ROOMS) },
      { type: "vocabulary", key: "beschreiben", title: en("Describing and colours"), vocab: slugs(DESCRIBING) },
      { type: "grammar", key: "grammatik-sein-adjektiv", grammar: "m9-sein-adjektiv-farben" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "in-die-kueche",
    order: 2,
    title: { de: "Ich gehe in die Küche", en: "I'm going into the kitchen" },
    description: en("Say where people and things go: in den Keller, in die Küche, ins Bad."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Moving day! Boxes go into the cellar, the table goes into the kitchen, the books into the living room.\n\nWhen something moves to a place, German asks Wohin? (where to?) and uses in + accusative: in den Keller, in die Küche, ins Bad (ins = in das).\n\nGoal: you can say where someone is going in a house.",
        ),
      },
      { type: "vocabulary", key: "haus", title: en("The house"), vocab: slugs(HOUSE) },
      { type: "grammar", key: "grammatik-wohin", grammar: "m9-in-akkusativ-richtung" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "wo-steht-das-sofa",
    order: 3,
    title: { de: "Wo steht das Sofa?", en: "Where is the sofa?" },
    description: en("Name furniture and say where it is: im Wohnzimmer, an der Wand, neben dem Regal."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Now you furnish the flat. You learn the names of furniture and say where each piece is.\n\nFor a position, German asks Wo? and uses a preposition + dative: im Wohnzimmer, an der Wand, neben dem Regal, unter dem Tisch. You already know the dative articles dem and der from mit.\n\nGoal: you can describe where things are in a room – and tell Wo? from Wohin?.",
        ),
      },
      { type: "vocabulary", key: "moebel", title: en("Furniture"), vocab: slugs(FURNITURE) },
      { type: "grammar", key: "grammatik-wo", grammar: "m9-wechselpraepositionen-dativ" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "wohnungssuche",
    order: 4,
    title: { de: "Wohnungssuche", en: "Looking for a flat" },
    description: en("Read flat ads and notices in a building, and say what you like and don't like about a flat."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "German often says how a thing is positioned: the cupboard steht (stands), the rug liegt (lies), the picture hängt (hangs).\n\nYou also read flat ads with their typical short forms (Zi., m², NK) and notices in a building – two task types of the A1 reading exam: choose the right ad (a or b), and decide whether a statement about a notice is true or false.\n\nGoal: you can find the right flat in an ad and talk about what you like and don't like about your home.",
        ),
      },
      { type: "vocabulary", key: "position", title: en("stehen, liegen, hängen"), vocab: slugs(POSITION) },
      { type: "vocabulary", key: "wohnungssuche", title: en("Looking for a flat"), vocab: slugs(FLAT_SEARCH) },
      { type: "grammar", key: "grammatik-stehen-liegen", grammar: "m9-stehen-liegen-haengen" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "wiederholung-3",
    order: 5,
    title: { de: "Wiederholung: Module 7–9", en: "Review: Modules 7–9" },
    description: en("Revise work, health and home: und/oder/aber, the dative, the imperative, modal verbs and prepositions of place."),
    estimatedMinutes: 25,
    refs: [{ ref: "netzwerk-neu-a1-p3", note: "Topic alignment only" }],
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Time to review Modules 7 to 9: the office, health and your home. There are no new words in this lesson.\n\nRemember: und, oder and aber connect two sentences. mit and the Wo? prepositions take the dative (mit dem Bus, im Büro). Imperative: Komm! – Kommt! – Kommen Sie! Modal verbs: ich soll, ich muss, ich darf.\n\nGoal: you can use the grammar of the last three modules together.",
        ),
      },
      ...exerciseBlocks(E.L5),
    ],
  },
  {
    slug: "modultest",
    order: 6,
    title: { de: "Modultest: Wohnen", en: "Module test" },
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
      ex("mini_test", "test-hoeren", "m9-test-hoeren"),
      ex("mini_test", "test-lesen", "m9-test-lesen"),
      ex("mini_test", "test-formular", "m9-test-formular"),
      ex("mastery_check", "test-grammatik", "m9-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m9-test-wortschatz"),
      ex("speaking", "test-sprechen", "m9-test-sprechen"),
    ],
  },
];

export const MODULE_9 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 9 (metadata only).",
  },
  module: {
    slug: "wohnen",
    order: 9,
    title: { de: "Wohnen", en: "Living and housing" },
    description: en("Flat ads, rooms, furniture, colours, describing your home, and where things are."),
    goals: [
      en("Name rooms and furniture and describe them with sein + adjective and colours."),
      en("Say where someone is going with in + accusative (Wohin?)."),
      en("Say where things are with prepositions + dative and stehen, liegen, hängen (Wo?)."),
      en("Understand flat ads (size, rent, rooms) and notices in a building."),
      en("Say what you like and don't like about a flat."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-9", note: "Chapter alignment only" },
      { ref: "netzwerk-neu-a1-p3", note: "Review lesson alignment only" },
      { ref: "grammatik-aktiv-34", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-35", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-lesen", note: "Prepares Teil 2 (ads) and Teil 3 (notices)" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
