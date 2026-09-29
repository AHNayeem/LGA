import { createHash } from "node:crypto";
import { z } from "zod";
import { objectIdString, text } from "@/lib/validation/common";
import { SPEECH_RATES, VOICE_ROLES } from "@/lib/content/constants";

// An audio cue is the *description* of a piece of German audio: what is said, by which
// logical voice, at which speed. Content stores cues, never files. Generated assets are
// found by the cue's hash, so:
//   - generating audio never edits (and therefore never un-approves) content, and
//   - changing the text automatically invalidates the old audio.
//
// Recorded (native/licensed) curriculum audio is the one exception: an admin may attach
// a media asset by id to a listening stimulus (`stimulus.audio.mediaId`) or to an item's
// audio (`items[].audio.mediaId`). The cue stays: it is the transcript and the TTS
// fallback. Resolution order: attached active asset → generated TTS → unavailable.

export { SPEECH_RATES, VOICE_ROLES };
export const AUDIO_LANGUAGE = "de-DE";

export const audioCueSchema = z.object({
  text: text(1000).pipe(z.string().min(1)),
  voice: z.enum(VOICE_ROLES).default("female"),
  rate: z.enum(SPEECH_RATES).default("slow"),
});

export const audioLineSchema = audioCueSchema.extend({
  speaker: text(40).optional(), // label shown in the transcript, e.g. "Frau Weber"
});

// Item audio (listening prompts) may carry an attached recording.
export const itemAudioSchema = audioCueSchema.extend({
  mediaId: objectIdString.optional(),
});

// A listening stimulus: its lines (transcript + TTS cues) and optionally one recording
// of the whole passage that replaces the per-line TTS sequence.
export const stimulusAudioSchema = z.object({
  lines: z.array(audioLineSchema).min(1).max(30),
  mediaId: objectIdString.optional(),
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
// `hasMedia(mediaId)` says whether an attached recording is usable; the parts it covers
// need no generated TTS.
export function requiredExerciseCues(exercise, { hasMedia = () => false } = {}) {
  const cues = [];
  const stim = exercise.stimulus?.audio;
  if (stim && !(stim.mediaId && hasMedia(stim.mediaId))) for (const line of stim.lines ?? []) cues.push(normalizeCue(line));
  for (const item of exercise.items ?? []) {
    if (item.audio && !(item.audio.mediaId && hasMedia(item.audio.mediaId))) cues.push(normalizeCue(item.audio));
  }
  return cues;
}

// Places in an exercise that play listening audio and may carry an attached recording:
// the stimulus ("stimulus") and each item with audio (its item id).
export function exerciseAudioTargets(exercise) {
  const out = [];
  const stim = exercise.stimulus?.audio;
  if (stim) out.push({ target: "stimulus", mediaId: stim.mediaId ? String(stim.mediaId) : null, cues: (stim.lines ?? []).map(normalizeCue) });
  for (const item of exercise.items ?? []) {
    if (item.audio) out.push({ target: item.id, mediaId: item.audio.mediaId ? String(item.audio.mediaId) : null, cues: [normalizeCue(item.audio)] });
  }
  return out;
}

export function exerciseMediaIds(exercise) {
  return exerciseAudioTargets(exercise)
    .map((t) => t.mediaId)
    .filter(Boolean);
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
