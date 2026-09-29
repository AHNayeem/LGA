import { describe, expect, it } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { generateModule1Audio, publishLevel, seedModule1 } from "@/tests/helpers/curriculum";
import { ROLES } from "@/lib/auth/roles";
import { APPROVAL_BASIS } from "@/lib/content/lifecycle";
import { getDb } from "@/lib/db/client";
import { bulkModuleTransition } from "@/lib/services/contentService";
import { checkModuleReadiness } from "@/lib/services/publishCheckService";
import * as curriculum from "@/lib/services/curriculumService";

setupTestDatabase();

const FIXTURE = { approvalBasis: APPROVAL_BASIS.testFixture };
async function publishAll(admin, moduleId, options) {
  for (const step of ["review", "approve", "publish"]) {
    const r = await bulkModuleTransition(admin, moduleId, step, options);
    expect(r.failed).toEqual([]);
  }
}

describe("module pre-publish check", () => {
  it("reports missing audio per lesson, including the module test", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const { moduleId } = await seedModule1();
    const r = await checkModuleReadiness(admin, moduleId, { expectedSourceType: "ai_generated" });
    expect(r.ok).toBe(false);
    expect(r.audio.requiredMissing).toBeGreaterThan(0);
    expect(r.audio.byLesson.find((l) => l.lesson === "modultest").testListeningMissing).toBeGreaterThan(0);
    expect(r.errors.some((e) => e.startsWith("modultest › m1-test-hoeren:"))).toBe(true);
    expect(r.sourceType).toEqual({ ai_generated: r.items });
    expect(r.reviewStatus).toEqual({ draft: r.items });
  });

  it("passes after audio + publishing, and flags test-fixture approvals as not a real review", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const { moduleId } = await seedModule1();
    await generateModule1Audio();
    await publishAll(admin, moduleId, FIXTURE);
    const r = await checkModuleReadiness(admin, moduleId, { expectedSourceType: "ai_generated" });
    expect(r.errors).toEqual([]);
    expect(r.approvals).toEqual({ total: r.items, testFixture: r.items, humanReview: 0 });
    const warnings = r.warnings.join("\n");
    expect(warnings).toMatch(/TEST-FIXTURE approval: not a genuine content review/);
    expect(warnings).toMatch(/ai_generated; learners see the "not yet reviewed by a native speaker" notice/);
    expect(warnings).not.toMatch(/Bangla/); // Module 1 ships no Bangla

    const db = await getDb();
    expect(await db.collection("exercises").distinct("approvalBasis")).toEqual(["test_fixture"]);
    expect(await db.collection("exercises").distinct("sourceType")).toEqual(["ai_generated"]);
  });

  it("admin approvals default to human review; a changed provenance is an error", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const { moduleId } = await seedModule1();
    await generateModule1Audio();
    await publishAll(admin, moduleId);
    const db = await getDb();
    expect(await db.collection("lessons").distinct("approvalBasis")).toEqual(["human_review"]);
    await db.collection("grammarTopics").updateOne({}, { $set: { sourceType: "original" } });
    const r = await checkModuleReadiness(admin, moduleId, { expectedSourceType: "ai_generated" });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('sourceType is "original"'))).toBe(true);
  });

  it("learners see the AI-content flag on the module and every lesson", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const { moduleId } = await seedModule1();
    await generateModule1Audio();
    await publishAll(admin, moduleId, FIXTURE);
    await publishLevel(admin);
    const learner = await createTestUser();
    const mod = await curriculum.getLearnerModule(learner, "a1", "hallo");
    expect(mod.module.aiGenerated).toBe(true);
    for (const l of mod.lessons) {
      const lesson = await curriculum.getLearnerLesson(learner, { level: "a1", module: "hallo", lesson: l.slug });
      expect(lesson.aiGenerated, l.slug).toBe(true);
    }
  });
});
