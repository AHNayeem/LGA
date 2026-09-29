import { describe, expect, it, vi } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { publishModule1ForLearners } from "@/tests/helpers/curriculum";
import { speakingTarget, webmBytes } from "@/tests/helpers/recordings";
import { ROLES } from "@/lib/auth/roles";
import { getDb } from "@/lib/db/client";
import { getStorage } from "@/lib/storage";
import { uploadSpeakingRecording } from "@/lib/services/recordingService";

// Simulates a database failure between writing the bytes and writing their metadata.
const failInsert = vi.hoisted(() => ({ on: false }));
vi.mock("@/lib/repositories/mediaAssetRepository", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    insertMediaAsset: async (doc) => {
      if (failInsert.on && doc.source === "learner") throw new Error("simulated write failure");
      return actual.insertMediaAsset(doc);
    },
  };
});

setupTestDatabase();

describe("failed metadata persistence", () => {
  it("removes the stored bytes, so no orphaned file or metadata remains", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    await publishModule1ForLearners(admin);
    const learner = await createTestUser();
    const t = await speakingTarget(learner);

    const storage = getStorage();
    const put = vi.spyOn(storage, "put");
    const del = vi.spyOn(storage, "delete");
    failInsert.on = true;
    await expect(
      uploadSpeakingRecording(learner, { lessonId: t.lessonId, exerciseId: t.exerciseId, itemId: "q1", bytes: webmBytes(), declaredType: "audio/webm" }),
    ).rejects.toThrow("simulated write failure");
    failInsert.on = false;

    expect(put).toHaveBeenCalledTimes(1);
    const { key } = await put.mock.results[0].value;
    expect(del).toHaveBeenCalledWith(key);
    expect(await storage.get(key)).toBeNull();
    expect(await (await getDb()).collection("mediaAssets").countDocuments({ source: "learner" })).toBe(0);
  });
});
