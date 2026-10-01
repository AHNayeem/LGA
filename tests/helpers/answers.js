// The answer-key helper now lives in lib/exercises/answerKey.js (the readiness report uses
// it on stored content too); tests keep importing it under its old name.
export { keyAnswers as answersFor } from "@/lib/exercises/answerKey";
