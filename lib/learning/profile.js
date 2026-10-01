import { z } from "zod";
import { LEVEL_CODES } from "@/lib/content/constants";
import { LEARNING_GOALS } from "@/lib/learning/state";

// Onboarding: why the learner is learning German and where they want to start. Stored on
// the user for signed-in learners and in the guest state for guests (the same shape).
// There is no placement test: the curriculum has no reliable diagnostic, so the learner
// picks the module to start from.

export const GOAL_OPTIONS = Object.freeze([
  { value: "from_zero", label: "Learn German from zero", hint: "Start with the very first lesson and build up step by step." },
  { value: "improve", label: "Improve my German", hint: "You know some German and want to fill the gaps." },
  { value: "goethe", label: "Prepare for the Goethe exam", hint: "Practise exam parts and take practice exams alongside the lessons." },
  { value: "skills", label: "Practise specific skills", hint: "Choose what to work on: listening, reading, writing, speaking, words or grammar." },
]);

export const learningProfileSchema = z.object({
  goal: z.enum(LEARNING_GOALS),
  levelCode: z.enum(LEVEL_CODES),
  // A module slug of that level, or null for "from the beginning".
  startModule: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80)
    .nullable()
    .default(null),
});
