import { getLearnerLesson } from "@/lib/services/curriculumService";

// Minimal byte sequences with real container signatures (validation is by signature).
export const webmBytes = (size = 64) => {
  const b = new Uint8Array(size);
  b.set([0x1a, 0x45, 0xdf, 0xa3]);
  return b;
};
export const mp4Bytes = (size = 64) => {
  const b = new Uint8Array(size);
  b.set([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d], 0); // ....ftypisom
  return b;
};
export const wavBytes = () => {
  const b = new Uint8Array(64);
  b.set(new TextEncoder().encode("RIFF"), 0);
  b.set(new TextEncoder().encode("WAVE"), 8);
  return b;
};

// Lesson 2 "Ich heiße …" contains the speaking exercise m1-vorstellen-sprechen (q1–q3)
// and graded exercises (for "not a speaking prompt" checks).
export async function speakingTarget(learner) {
  const lesson = await getLearnerLesson(learner, { level: "a1", module: "hallo", lesson: "ich-heisse" });
  const speaking = lesson.blocks.find((b) => b.exercise?.skill === "speaking");
  const graded = lesson.blocks.find((b) => b.exercise && b.exercise.skill !== "speaking");
  return {
    lesson,
    lessonId: lesson.lesson.id,
    exerciseId: speaking.exercise.id,
    block: speaking,
    gradedExerciseId: graded.exercise.id,
    gradedItemId: graded.exercise.items[0].id,
  };
}

export const allRated = (extra = {}) => ({ q1: "confident", q2: "unsure", q3: "not_yet", ...extra });
