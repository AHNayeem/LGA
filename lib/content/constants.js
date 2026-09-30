// Content enums without runtime dependencies, so the admin editors (client code) and the
// schemas share one definition. The schemas re-export them from their usual modules.

export const LEVEL_CODES = Object.freeze(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const PARTS_OF_SPEECH = Object.freeze([
  "noun",
  "proper_noun", // countries, cities, languages; article only where German uses one (die Schweiz)
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "numeral",
  "question_word",
  "phrase",
  "interjection",
  "other",
]);

export const ARTICLES = Object.freeze(["der", "die", "das"]);

// Source types the CMS offers for new content (the word editor and the bulk import). The
// other values of SOURCE_TYPES (lib/content/lifecycle.js) are kept for seeded records.
export const SOURCE_TYPE_OPTIONS = Object.freeze([
  { value: "original", label: "Original (written by our team)" },
  { value: "ai_generated", label: "AI-generated (needs human review)" },
  { value: "licensed", label: "Licensed (source reference required)" },
]);

// Lesson flow is an ordered list of blocks; lessons include only the blocks they need.
// Content blocks (intro, grammar) are completed by reading them; vocabulary blocks by
// rating every card once; exercise blocks only by a graded attempt (see lib/learning/progress.js).
export const CONTENT_BLOCK_TYPES = Object.freeze(["intro", "vocabulary", "grammar"]);
export const EXERCISE_BLOCK_TYPES = Object.freeze([
  "reading",
  "listening",
  "speaking",
  "writing",
  "practice",
  "mini_test",
  "mastery_check",
]);
export const LESSON_BLOCK_TYPES = Object.freeze([...CONTENT_BLOCK_TYPES, ...EXERCISE_BLOCK_TYPES]);

export const STIMULUS_TEXT_KINDS = Object.freeze(["message", "email", "sign", "ad", "profile", "form", "dialogue"]);
export const TRANSCRIPT_POLICIES = Object.freeze(["after_submit", "always", "never"]);

export const VOICE_ROLES = Object.freeze(["female", "male", "female2", "male2"]);
export const SPEECH_RATES = Object.freeze(["slow", "normal"]);

// Exercise item types the editor offers. Must match the registry in
// lib/exercises/types/index.js (checked by tests/unit/cms-payload.test.js).
export const ITEM_TYPE_LABELS = Object.freeze({
  mcq: "Multiple choice",
  true_false: "Richtig / falsch",
  text_input: "Text input (gap, dictation, form)",
  match: "Match pairs",
  order: "Word order",
  speak_prompt: "Speaking prompt (ungraded)",
});

// Exams (lib/exams, examService). What a learner sees after submitting:
//   summary  total and section scores only
//   marks    also which questions were right or wrong (no answer keys)
//   full     also the correct answers, explanations and transcripts
export const EXAM_REVIEW_POLICIES = Object.freeze(["summary", "marks", "full"]);
export const EXAM_REVIEW_POLICY_LABELS = Object.freeze({
  summary: "Scores only",
  marks: "Scores and right/wrong per question",
  full: "Full review with correct answers",
});
export const EXAM_LIMITS = Object.freeze({ sections: 8, exercisesPerSection: 20, exercises: 40 });
