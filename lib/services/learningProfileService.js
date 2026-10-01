import { NotFoundError, ValidationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation/common";
import { learningProfileSchema } from "@/lib/learning/profile";
import { assertLearner, findVisibleModule, findVisibleLevel } from "@/lib/services/curriculumService";
import * as userRepo from "@/lib/repositories/userRepository";

// Saves a signed-in learner's onboarding choices. The level and the starting module must
// be published (a stale or forged slug is rejected). Guests keep the same profile in
// their browser.
export async function saveLearningProfile(actor, input) {
  assertLearner(actor);
  const data = parseOrThrow(learningProfileSchema, input, "Please choose a goal and a starting point.");
  if (!(await findVisibleLevel(data.levelCode))) throw new NotFoundError();
  if (data.startModule && !(await findVisibleModule(data.levelCode, data.startModule))) {
    throw new ValidationError("This module isn't available.", { startModule: "This module isn't available." });
  }
  const profile = { ...data, updatedAt: new Date().toISOString() };
  await userRepo.updateLearningProfile(actor.id, profile);
  return profile;
}
