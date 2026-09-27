import { createHash } from "node:crypto";
import { z } from "zod";
import { text } from "@/lib/validation/common";

// An audio cue is the *description* of a piece of German audio: what is said, by which
// logical voice, at which speed. Content stores cues, never files. Generated assets are
// found by the cue's hash, so:
//   - attaching audio never edits (and therefore never un-approves) content, and
//   - changing the text automatically invalidates the old audio.

export const VOICE_ROLES = Object.freeze(["female", "male", "female2", "male2"]);
export const SPEECH_RATES = Object.freeze(["slow", "normal"]);
export const AUDIO_LANGUAGE = "de-DE";

export const audioCueSchema = z.object({
  text: text(1000).pipe(z.string().min(1)),
  voice: z.enum(VOICE_ROLES).default("female"),
  rate: z.enum(SPEECH_RATES).default("slow"),
});

export const audioLineSchema = audioCueSchema.extend({
  speaker: text(40).optional(), // label shown in the transcript, e.g. "Frau Weber"
});

// Bump when the hashing inputs change, to force regeneration of every asset.
const CUE_HASH_VERSION = 1;

export function cueHash({ text: t, voice = "female", rate = "slow", lang = AUDIO_LANGUAGE }) {
  const canonical = JSON.stringify([CUE_HASH_VERSION, lang, voice, rate, String(t).normalize("NFC").trim()]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

export function normalizeCue(cue) {
  return { text: String(cue.text).normalize("NFC").trim(), voice: cue.voice ?? "female", rate: cue.rate ?? "slow", lang: AUDIO_LANGUAGE };
}

// --- Collecting cues from content -------------------------------------------------

export function exerciseCues(exercise) {
  const cues = [];
  for (const line of exercise.stimulus?.audio?.lines ?? []) cues.push(normalizeCue(line));
  for (const item of exercise.items ?? []) {
    if (item.audio) cues.push(normalizeCue(item.audio));
    if (item.modelAudio) cues.push(normalizeCue(item.modelAudio));
  }
  return cues;
}

// Audio that must exist before an exercise can be published (the listening stimulus
// and per-item listening prompts). Model answers for speaking are nice-to-have.
export function requiredExerciseCues(exercise) {
  const cues = [];
  for (const line of exercise.stimulus?.audio?.lines ?? []) cues.push(normalizeCue(line));
  for (const item of exercise.items ?? []) if (item.audio) cues.push(normalizeCue(item.audio));
  return cues;
}

export function vocabularyCues(vocab) {
  const cues = [normalizeCue({ text: vocabDisplayForm(vocab), voice: "female", rate: "slow" })];
  if (vocab.example?.de) cues.push(normalizeCue({ text: vocab.example.de, voice: "female", rate: "slow" }));
  return cues;
}

// Nouns are always learned with their article.
export function vocabDisplayForm(vocab) {
  return vocab.article ? `${vocab.article} ${vocab.lemma}` : vocab.lemma;
}

// Every cue a set of curriculum module definitions (content/curriculum) needs.
export function curriculumCues(moduleDefs) {
  return uniqueCues(
    moduleDefs.flatMap((def) => [...(def.exercises ?? []).flatMap(exerciseCues), ...(def.vocabulary ?? []).flatMap(vocabularyCues)]),
  );
}

export function uniqueCues(cues) {
  const map = new Map();
  for (const c of cues) map.set(cueHash(c), c);
  return map; // hash -> cue
}
