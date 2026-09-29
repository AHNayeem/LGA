import { LEVELS } from "@/content/seed/levels";
import { REFERENCES } from "@/content/seed/references";
import { MODULE_1 } from "@/content/curriculum/a1/module-01/index.js";
import { seedCurriculumModule, seedLevels, seedReferences } from "@/lib/services/seedService";
import { bulkModuleTransition, transitionReview, setPublishStatus } from "@/lib/services/contentService";
import { registerTtsAssets } from "@/lib/services/audioService";
import { curriculumCues } from "@/lib/audio/cues";
import { generateAudio, memoryRegistry, storageSink } from "@/lib/audio/generate";
import { createFakeTtsProvider } from "@/lib/audio/providers/fake";
import { getStorage } from "@/lib/storage";
import { levelRepository } from "@/lib/repositories/contentRepository";

export async function seedModule1(options) {
  await seedLevels(LEVELS);
  await seedReferences(REFERENCES);
  return seedCurriculumModule(MODULE_1, options);
}

// The same pipeline as scripts/generate-audio.mjs, with the fake provider and memory storage.
export async function generateModule1Audio() {
  const registry = memoryRegistry();
  const stats = await generateAudio({
    cues: curriculumCues([MODULE_1]),
    provider: createFakeTtsProvider(),
    sink: storageSink(getStorage("memory")),
    registry,
  });
  await registerTtsAssets([...registry.entries.values()]);
  return stats;
}

// The real review workflow, driven by an admin: draft → reviewed → approved → published.
export async function publishModule(admin, moduleId) {
  const results = {};
  for (const step of ["review", "approve", "publish"]) results[step] = await bulkModuleTransition(admin, moduleId, step);
  return results;
}

export async function publishLevel(admin, code = "A1") {
  const level = await levelRepository.findOne({ code });
  const id = String(level._id);
  await transitionReview(admin, "levels", { id, to: "reviewed" });
  await transitionReview(admin, "levels", { id, to: "approved" });
  await setPublishStatus(admin, "levels", { id, to: "published" });
}

// Module 1 fully published (content + A1 level) for learner-facing tests.
export async function publishModule1ForLearners(admin) {
  const seeded = await seedModule1();
  await generateModule1Audio();
  const results = await publishModule(admin, seeded.moduleId);
  await publishLevel(admin);
  return { seeded, results };
}
