// A1 Module 12 "Reisen & Wetter": travel and holidays, sightseeing and asking the way,
// postcards, weather, station and airport announcements; followed by the review lesson for
// Modules 10–12 (Plattform 4 position). Mapping (metadata only): Netzwerk neu A1 Kap. 12
// and Plattform 4; Grammatik aktiv 10, 32, 44; prepares Goethe A1 Hören Teil 2
// (announcements, heard once) and Schreiben Teil 2 (postcard, as auto-gradable gap-fill).
// See docs/REFERENCE-ANALYSIS.md and docs/CURRICULUM-A1.md.
//
// All content is original and was drafted with AI assistance, so it is seeded as
// sourceType "ai_generated" and starts as draft/unpublished. It must be reviewed and
// approved by a person before learners can see it.

import { TRAVEL, WEATHER, SIGHTSEEING, ON_THE_WAY, VOCABULARY, slugs } from "./vocabulary.js";
import { GRAMMAR } from "./grammar.js";
import { EXERCISES, EXERCISES_BY_LESSON as E } from "./exercises.js";

const en = (s) => ({ en: s });
const ex = (type, key, exercise) => ({ type, key, exercise });
// Vocabulary and grammar exercises appear as "practice" blocks; the others by their skill.
const blockTypeFor = (skill) => ({ vocabulary: "practice", grammar: "practice" })[skill] ?? skill;
const exerciseBlocks = (list) => list.map((e) => ex(blockTypeFor(e.skill), e.slug.replace(/^m12-/, ""), e.slug));

const LESSONS = [
  {
    slug: "urlaub-machen",
    order: 1,
    title: { de: "Urlaub machen", en: "Going on holiday" },
    description: en("Talk about holidays and holiday places, and say what people can do there with man."),
    estimatedMinutes: 25,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Where do you like to go on holiday – to the sea, to the mountains or to a city? In this lesson you learn the words for holidays and travelling.\n\nYou also learn the pronoun man. It means “people in general”, like English “you” or “one”: Hier kann man gut essen. = You can eat well here.\n\nGoal: you can understand short holiday ads and say what you can do in a place.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Holidays and travel"), vocab: slugs(TRAVEL) },
      { type: "grammar", key: "grammatik-man", grammar: "m12-man" },
      ...exerciseBlocks(E.L1),
    ],
  },
  {
    slug: "wie-ist-das-wetter",
    order: 2,
    title: { de: "Wie ist das Wetter?", en: "What's the weather like?" },
    description: en("Describe the weather, understand a weather forecast and give reasons with denn."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "The weather is a favourite topic in German small talk – and on holiday it decides what you do.\n\nMost weather sentences start with es: Es regnet. Es schneit. Es ist kalt. Es sind 20 Grad. Only the sun is different: Die Sonne scheint.\n\nYou also learn to give a reason with denn (because): Wir bleiben im Hotel, denn es regnet.\n\nGoal: you can say what the weather is like and understand a simple weather forecast.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("The weather"), vocab: slugs(WEATHER) },
      { type: "grammar", key: "grammatik-denn", grammar: "m12-denn" },
      ...exerciseBlocks(E.L2),
    ],
  },
  {
    slug: "unterwegs-in-der-stadt",
    order: 3,
    title: { de: "Unterwegs in der Stadt", en: "Out and about in the city" },
    description: en("Visit sights, ask the way as a tourist and ask questions with wer, wen and wem."),
    estimatedMinutes: 30,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "As a tourist you want to see the sights: a castle, a tower, an old bridge. You need a city map, and sometimes you have to ask the way.\n\nRemember from Module 3: Entschuldigung, wie komme ich zum …? – Gehen Sie geradeaus / links / rechts.\n\nIn this lesson you also learn that the question word wer changes with the case: wer (nominative), wen (accusative), wem (dative) – just like der, den, dem.\n\nGoal: you can understand directions and information about a city tour.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Sightseeing"), vocab: slugs(SIGHTSEEING) },
      { type: "grammar", key: "grammatik-wer-wen-wem", grammar: "m12-wer-wen-wem" },
      ...exerciseBlocks(E.L3),
    ],
  },
  {
    slug: "gruesse-aus-dem-urlaub",
    order: 4,
    title: { de: "Grüße aus dem Urlaub", en: "Greetings from your holiday" },
    description: en("Write a holiday postcard, understand announcements and use time expressions with in, vor, nach and seit."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "On holiday you write postcards: where you are, since when, what the weather is like and what you are doing. This is also a typical task in part 2 of the A1 writing exam.\n\nAt the station and the airport you hear announcements about delays, platforms and gates. In the A1 listening exam (part 2) you hear them only once – so listen carefully for numbers and times.\n\nFor time expressions you need in, vor, nach and seit. They all take the dative: im Sommer, vor dem Frühstück, nach der Arbeit, seit einem Jahr.\n\nGoal: you can complete a short postcard and understand simple announcements.",
        ),
      },
      { type: "vocabulary", key: "woerter", title: en("Postcards, station and airport"), vocab: slugs(ON_THE_WAY) },
      { type: "grammar", key: "grammatik-zeitangaben", grammar: "m12-temporale-praepositionen" },
      ...exerciseBlocks(E.L4),
    ],
  },
  {
    slug: "wiederholung-4",
    order: 5,
    title: { de: "Wiederholung: Module 10–12", en: "Review: Modules 10–12" },
    description: en("Revise the past (war, hatte, Perfekt), clothes, welcher and dieser, dative pronouns, and travel and weather."),
    estimatedMinutes: 30,
    refs: [{ ref: "netzwerk-neu-a1-p4", note: "Topic alignment only" }],
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "Time to review! This lesson mixes what you learned in the last three modules:\n\n• Module 10: talking about the past – war, hatte and the Perfekt (Ich habe … gekauft. Wir sind … gewandert.). Here you only need to understand it.\n• Module 11: clothes, welcher? and dieser, and the dative with gefallen, passen and stehen (Die Jacke gefällt mir.).\n• Module 12: travel, weather, man, denn and wer/wen/wem.\n\nThere are no new words in this lesson.",
        ),
      },
      ...exerciseBlocks(E.L5),
    ],
  },
  {
    slug: "modultest",
    order: 6,
    title: { de: "Modultest: Reisen & Wetter", en: "Module test" },
    description: en("Check what you have learned in Goethe-style tasks: listening, reading, writing, grammar and vocabulary."),
    estimatedMinutes: 35,
    blocks: [
      {
        type: "intro",
        key: "intro",
        body: en(
          "This test uses the task types of the Goethe-Zertifikat A1, with our own texts. In the listening part you hear each announcement only once, as in the exam. You need 70% in each part to complete it, and you can try again as often as you like.\n\nImportant: these are the app's learning targets, not official Goethe pass marks.",
        ),
      },
      ex("mini_test", "test-hoeren", "m12-test-hoeren"),
      ex("mini_test", "test-lesen", "m12-test-lesen"),
      ex("mini_test", "test-postkarte", "m12-test-postkarte"),
      ex("mastery_check", "test-grammatik", "m12-test-grammatik"),
      ex("mastery_check", "test-wortschatz", "m12-test-wortschatz"),
      ex("speaking", "test-sprechen", "m12-test-sprechen"),
    ],
  },
];

export const MODULE_12 = {
  levelCode: "A1",
  provenance: {
    sourceType: "ai_generated",
    sourceReference: "Original LGA content drafted with AI assistance; curriculum mapping to Netzwerk neu A1 Kap. 12 (metadata only).",
  },
  module: {
    slug: "reisen-und-wetter",
    order: 12,
    title: { de: "Reisen & Wetter", en: "Travel and weather" },
    description: en("Holidays and travel, sightseeing and asking the way, postcards, the weather, and announcements at the station and airport."),
    goals: [
      en("Talk about holidays and say what you can do in a place (man)."),
      en("Describe the weather and understand a simple weather forecast."),
      en("Give reasons with denn."),
      en("Ask the way as a tourist and ask questions with wer, wen and wem."),
      en("Use time expressions with in, vor, nach and seit."),
      en("Complete a holiday postcard and understand announcements at the station and airport."),
    ],
    refs: [
      { ref: "netzwerk-neu-a1-12", note: "Chapter alignment only" },
      { ref: "netzwerk-neu-a1-p4", note: "Review lesson alignment only" },
      { ref: "grammatik-aktiv-10", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-32", note: "Topic alignment only" },
      { ref: "grammatik-aktiv-44", note: "Topic alignment only" },
      { ref: "goethe-start-deutsch-1-hoeren", note: "Prepares Teil 2 (announcements, heard once)" },
      { ref: "goethe-start-deutsch-1-schreiben", note: "Prepares Teil 2 (short message / postcard)" },
    ],
  },
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  exercises: EXERCISES,
  lessons: LESSONS,
};
