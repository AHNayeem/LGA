// Shared seeding for the browser test databases (in-memory E2E and Atlas E2E). Expects
// MONGODB_URI / MONGODB_DB to be set by the caller, and must only ever run against a
// throwaway database.
//
// Module 1 goes through the real lifecycle functions (draft → reviewed → approved →
// published) with approvalBasis "test_fixture": it is NOT a content review, and /admin
// labels it as such. Audio: the committed real clips when `bun run audio:verify` passes,
// otherwise silent fixture clips from the fake provider, stored in GridFS (never public/).
import { ensureIndexes } from "@/lib/db/indexes";
import { assertNonProductionDatabase } from "@/lib/config/databaseGuard";
import { seedCurriculumModule, seedExam, seedLevels, seedReferences } from "@/lib/services/seedService";
import { ensureAdmin } from "@/lib/services/userAdminService";
import { bulkExamTransition, bulkModuleTransition, setPublishStatus, transitionReview } from "@/lib/services/contentService";
import { registerTtsAssets } from "@/lib/services/audioService";
import { APPROVAL_BASIS } from "@/lib/content/lifecycle";
import { curriculumCues } from "@/lib/audio/cues";
import { generateAudio, memoryRegistry, storageSink } from "@/lib/audio/generate";
import { DEFAULT_MANIFEST_PATH, DEFAULT_PUBLIC_MEDIA_DIR, fileManifestRegistry } from "@/lib/audio/fileStore";
import { verifyAudio } from "@/lib/audio/verify";
import { createFakeTtsProvider } from "@/lib/audio/providers/fake";
import { getStorage } from "@/lib/storage";
import { findUserByEmailWithHash } from "@/lib/repositories/userRepository";
import { levelRepository } from "@/lib/repositories/contentRepository";
import { LEVELS } from "@/content/seed/levels";
import { REFERENCES } from "@/content/seed/references";
import { CURRICULUM } from "@/content/curriculum/index.js";
import { EXAMS } from "@/content/exams/index.js";
import { AUDIO_CONTENT } from "@/content/audioContent.js";

const FIXTURE = { approvalBasis: APPROVAL_BASIS.testFixture };

export const E2E_ADMIN = { email: "admin@e2e.test", password: "e2e-admin-password", name: "E2E Admin" };

export async function seedE2EDatabase({ publishLevel = false, log = () => {} } = {}) {
  assertNonProductionDatabase(process.env.MONGODB_DB, "seed a browser-test database");
  await ensureIndexes();
  await seedLevels(LEVELS);
  await seedReferences(REFERENCES);
  await ensureAdmin(E2E_ADMIN);
  const adminDoc = await findUserByEmailWithHash(E2E_ADMIN.email);
  const admin = { id: String(adminDoc._id), role: adminDoc.role };

  let audioSource;
  const real = verifyAudio({ moduleDefs: AUDIO_CONTENT, manifestPath: DEFAULT_MANIFEST_PATH, mediaDir: DEFAULT_PUBLIC_MEDIA_DIR });
  if (real.ok) {
    await registerTtsAssets(fileManifestRegistry().present());
    audioSource = "real";
  } else {
    const registry = memoryRegistry();
    await generateAudio({ cues: curriculumCues(AUDIO_CONTENT), provider: createFakeTtsProvider(), sink: storageSink(getStorage("gridfs")), registry });
    await registerTtsAssets([...registry.entries.values()]);
    audioSource = "fake";
  }
  log(`E2E audio: ${audioSource === "real" ? "generated clips from public/media/tts" : "silent fixture clips (real audio not generated yet)"}`);

  for (const def of CURRICULUM) {
    const { moduleId } = await seedCurriculumModule(def);
    for (const step of ["review", "approve", "publish"]) {
      const r = await bulkModuleTransition(admin, moduleId, step, FIXTURE);
      if (r.failed.length) throw new Error(`E2E seed: ${step} failed: ${JSON.stringify(r.failed)}`);
    }
  }

  // Seeded exams, through the same lifecycle (test-fixture approvals).
  for (const def of EXAMS) {
    const { examId } = await seedExam(def);
    for (const step of ["review", "approve", "publish"]) {
      const r = await bulkExamTransition(admin, examId, step, FIXTURE);
      if (r.failed.length) throw new Error(`E2E seed: exam ${step} failed: ${JSON.stringify(r.failed)}`);
    }
  }

  if (publishLevel) {
    const level = await levelRepository.findOne({ code: "A1" });
    const id = String(level._id);
    await transitionReview(admin, "levels", { id, to: "reviewed" });
    await transitionReview(admin, "levels", { id, to: "approved" }, FIXTURE);
    await setPublishStatus(admin, "levels", { id, to: "published" });
  }
  return { admin, audioSource };
}
