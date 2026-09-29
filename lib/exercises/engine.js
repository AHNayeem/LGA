import { z } from "zod";
import { itemType } from "@/lib/exercises/types";

// Type-agnostic exercise engine: builds the learner payload, grades a submission and
// produces the post-submission reveal. Pure functions; persistence lives in services.

export const DEFAULT_PASS_THRESHOLD = 0.6;
export const MAX_ITEMS = 30;

// Raw submission shape: { [itemId]: unknown }. Each value is validated per item type.
export const answersSchema = z
  .record(z.string().max(40), z.unknown())
  .refine((a) => Object.keys(a).length <= MAX_ITEMS, "Too many answers");

// Shuffles (match, order) are seeded per exercise item. Practice mode uses the public
// `exerciseId:itemId` seed; exams pass a secret per-attempt `seedPrefix` so the shuffled
// order can't be predicted from the ids (lib/exams/scoring.js).
function seedFor(exerciseId, item, seedPrefix = null) {
  return seedPrefix ? `${seedPrefix}:${exerciseId}:${item.id}` : `${exerciseId}:${item.id}`;
}

const NO_AUDIO = () => null;
const NO_IMAGE = () => null;

export function exerciseMaxScore(exercise) {
  return exercise.items.reduce((sum, item) => sum + itemType(item.type).maxScore(item), 0);
}

export function isGradedExercise(exercise) {
  return exerciseMaxScore(exercise) > 0;
}

// One attached recording of the whole passage when the resolver can play it; otherwise
// the per-line sequence (generated TTS). The resolver returns null for an attached id it
// can't use (archived, missing), and the lines take over.
function stimulusSources(audioConf, audio) {
  if (audioConf.mediaId) {
    const native = audio({ mediaId: audioConf.mediaId });
    if (native) return [native];
  }
  return audioConf.lines.map((l) => audio(l));
}

function transcriptOf(stimulus) {
  return (stimulus?.audio?.lines ?? []).map((l) => ({ speaker: l.speaker ?? null, text: l.text }));
}

// Learner payload before submission. Never includes answers, accepted variants, model
// answers, explanations or (unless the policy says "always") the transcript.
// `image` resolves an attached stimulus image (imageService.createImageResolver); an
// image it can't use is null and simply not shown.
export function toClientExercise(exercise, { exerciseId, audio = NO_AUDIO, image = NO_IMAGE, seedPrefix = null } = {}) {
  const id = String(exerciseId ?? exercise._id ?? exercise.id);
  const s = exercise.stimulus;
  return {
    id,
    skill: exercise.skill,
    title: exercise.title,
    instructions: exercise.instructions ?? null,
    passThreshold: exercise.passThreshold ?? DEFAULT_PASS_THRESHOLD,
    maxScore: exerciseMaxScore(exercise),
    itemAudioMaxPlays: exercise.itemAudioMaxPlays ?? null,
    stimulus: s
      ? {
          text: s.text ?? null,
          textKind: s.textKind ?? null,
          image: s.image ? image(s.image) : null,
          audio: s.audio ? { sources: stimulusSources(s.audio, audio), maxPlays: s.maxPlays ?? null } : null,
          transcriptPolicy: s.transcriptPolicy ?? "after_submit",
          transcript: s.transcriptPolicy === "always" ? transcriptOf(s) : null,
        }
      : null,
    items: exercise.items.map((item) => itemType(item.type).toClient(item, { seed: seedFor(id, item, seedPrefix), audio })),
  };
}

export function gradeExercise(exercise, answers, { exerciseId, seedPrefix = null } = {}) {
  const id = String(exerciseId ?? exercise._id ?? exercise.id);
  const items = exercise.items.map((item) => {
    const t = itemType(item.type);
    const maxScore = t.maxScore(item);
    const parsed = t.answerSchema.safeParse(answers?.[item.id]);
    if (!parsed.success) {
      return { itemId: item.id, answered: false, correct: t.graded ? false : null, score: 0, maxScore };
    }
    const g = t.grade(item, parsed.data, { seed: seedFor(id, item, seedPrefix) });
    return {
      itemId: item.id,
      answered: true,
      correct: g.correct,
      score: Math.min(g.score, maxScore),
      maxScore,
      ...(g.feedback ? { feedback: g.feedback } : {}),
      ...(g.selfRating ? { selfRating: g.selfRating } : {}),
    };
  });
  const score = items.reduce((s, r) => s + r.score, 0);
  const maxScore = items.reduce((s, r) => s + r.maxScore, 0);
  const graded = maxScore > 0;
  const ratio = graded ? score / maxScore : null;
  const threshold = exercise.passThreshold ?? DEFAULT_PASS_THRESHOLD;
  const passed = graded ? ratio >= threshold : items.every((r) => r.answered);
  return { items, score, maxScore, ratio, graded, passed };
}

// What the learner may see after submitting: expected answers, explanations, transcript.
export function revealExercise(exercise, { exerciseId, audio = NO_AUDIO, seedPrefix = null } = {}) {
  const id = String(exerciseId ?? exercise._id ?? exercise.id);
  const items = {};
  for (const item of exercise.items) {
    const t = itemType(item.type);
    items[item.id] = { ...t.reveal(item, { seed: seedFor(id, item, seedPrefix), audio }), explanation: item.explanation ?? null };
  }
  const policy = exercise.stimulus?.transcriptPolicy ?? "after_submit";
  return { items, transcript: policy === "never" ? null : transcriptOf(exercise.stimulus) };
}
