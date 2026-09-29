// Everything the offline audio tooling (generate, verify) and the E2E seeding must cover:
// the curriculum modules and the seeded exams. Both are { exercises[], vocabulary?[] }.
import { CURRICULUM } from "./curriculum/index.js";
import { EXAMS } from "./exams/index.js";

export const AUDIO_CONTENT = [...CURRICULUM, ...EXAMS];
