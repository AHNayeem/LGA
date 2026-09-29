import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { publishModule1ForLearners } from "@/tests/helpers/curriculum";
import { answersFor } from "@/tests/helpers/answers";
import { allRated, speakingTarget, webmBytes } from "@/tests/helpers/recordings";
import { ROLES } from "@/lib/auth/roles";
import { closeClient, getClient, getDb } from "@/lib/db/client";
import { INDEXES } from "@/lib/db/indexes";
import { getStorage, resetStorageDrivers } from "@/lib/storage";
import { exerciseRepository } from "@/lib/repositories/contentRepository";
import * as curriculum from "@/lib/services/curriculumService";
import * as learning from "@/lib/services/learningService";
import * as media from "@/lib/services/mediaService";
import { uploadSpeakingRecording } from "@/lib/services/recordingService";

// Runs only via `bun run test:atlas` (vitest.atlas.config.mjs): real Atlas, throwaway DB.
setupTestDatabase();

async function readAll(body) {
  if (body instanceof Uint8Array) return body;
  const chunks = [];
  for await (const c of body) chunks.push(c);
  return new Uint8Array(Buffer.concat(chunks));
}

describe("real MongoDB Atlas", () => {
  it("is a real replica-set deployment, not an in-memory server", async () => {
    const hello = await (await getDb()).admin().command({ hello: 1 });
    if (process.env.ATLAS_ALLOW_NON_ATLAS !== "1") {
      expect(hello.setName, "Atlas clusters are replica sets").toBeTruthy();
      expect((await getClient()).options.hosts.some((h) => String(h).includes("mongodb.net"))).toBe(true);
    }
    expect((await getDb()).databaseName).toMatch(/^lga_itest_/);
  });

  it("creates every index the repositories rely on", async () => {
    const db = await getDb();
    for (const [name, specs] of Object.entries(INDEXES)) {
      const have = new Set((await db.collection(name).indexes()).map((i) => i.name));
      for (const s of specs) expect(have.has(s.name), `${name}.${s.name}`).toBe(true);
    }
  });

  it("learner progress, mastery, vocabulary and recordings survive a fresh connection", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    await publishModule1ForLearners(admin);
    const learner = await createTestUser();

    // Lesson 1: rate words, answer every exercise correctly.
    const lesson1 = await curriculum.getLearnerLesson(learner, { level: "a1", module: "hallo", lesson: "hallo-und-tschuess" });
    for (const block of lesson1.blocks) {
      if (block.type === "vocabulary") {
        for (const card of block.cards) await learning.reviewVocabulary(learner, { vocabId: card.id, result: "known" });
        await learning.completeContentBlock(learner, { lessonId: lesson1.lesson.id, blockKey: block.key });
      } else if (block.type === "intro" || block.type === "grammar") {
        await learning.completeContentBlock(learner, { lessonId: lesson1.lesson.id, blockKey: block.key });
      } else {
        const ex = await exerciseRepository.findById(block.exercise.id);
        await learning.submitExerciseAttempt(learner, { lessonId: lesson1.lesson.id, exerciseId: block.exercise.id, answers: answersFor(ex, block.exercise.id) });
      }
    }
    // Speaking with a recording stored in Atlas GridFS.
    const t = await speakingTarget(learner);
    const bytes = webmBytes(4096);
    const rec = await uploadSpeakingRecording(learner, { lessonId: t.lessonId, exerciseId: t.exerciseId, itemId: "q1", bytes, declaredType: "audio/webm" });
    await learning.submitExerciseAttempt(learner, {
      lessonId: t.lessonId,
      exerciseId: t.exerciseId,
      answers: allRated({ q1: { selfRating: "confident", recordingId: rec.id } }),
    });
    const before = await curriculum.getLearnerModule(learner, "a1", "hallo");

    // Drop every connection and cached driver: the next reads start from scratch.
    await closeClient();
    resetStorageDrivers();

    const after = await curriculum.getLearnerModule(learner, "a1", "hallo");
    expect(after.completion).toEqual(before.completion);
    expect(after.completion.lessonsCompleted).toBe(1);
    expect(after.mastery).toEqual(before.mastery);
    const lessonAgain = await curriculum.getLearnerLesson(learner, { level: "a1", module: "hallo", lesson: "hallo-und-tschuess" });
    expect(lessonAgain.completion.complete).toBe(true);
    const vocab = lessonAgain.blocks.find((b) => b.type === "vocabulary");
    expect(vocab.cards.every((c) => c.review?.box === 1 && c.review.dueAt)).toBe(true); // first "known" → box 1

    const db = await getDb();
    const uid = new ObjectId(learner.id);
    expect(await db.collection("attempts").countDocuments({ userId: uid })).toBe(lesson1.blocks.filter((b) => b.exercise).length + 1);
    expect(await db.collection("userVocabulary").countDocuments({ userId: uid })).toBe(vocab.cards.length);

    const again = await speakingTarget(learner);
    expect(again.block.recordings.q1.id).toBe(rec.id);
    const { file } = await media.openMedia(learner, rec.id);
    expect(await readAll(file.body)).toEqual(bytes);
    const asset = await db.collection("mediaAssets").findOne({ _id: new ObjectId(rec.id) });
    const gridFile = await db.collection("media.files").findOne({ filename: asset.storage.key });
    expect(gridFile.length).toBe(4096);
    expect(getStorage().name).toBe("gridfs");
  });
});
