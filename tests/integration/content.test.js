import { describe, expect, it } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import * as content from "@/lib/services/contentService";
import { seedLevels, seedReferences } from "@/lib/services/seedService";
import { LEVELS } from "@/content/seed/levels";
import { REFERENCES } from "@/content/seed/references";
import { ROLES } from "@/lib/auth/roles";
import { ConflictError, ForbiddenError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";

setupTestDatabase();

const moduleInput = {
  levelCode: "A1",
  slug: "hallo",
  order: 1,
  title: { de: "Hallo!", en: "Hello!" },
  sourceType: "original",
};

describe("content authorisation", () => {
  it("USER cannot create, review or publish content", async () => {
    const user = await createTestUser();
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const mod = await content.createContent(admin, "modules", moduleInput);

    await expect(content.createContent(user, "modules", { ...moduleInput, slug: "x" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.updateContent(user, "modules", mod.id, 1, moduleInput)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.transitionReview(user, "modules", { id: mod.id, to: "reviewed" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.setPublishStatus(user, "modules", { id: mod.id, to: "published" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(content.listContentForAdmin(user, "modules")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects unknown content types", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    await expect(content.createContent(admin, "users", { email: "x" })).rejects.toThrow(/Unknown content type/);
  });
});

describe("content lifecycle end-to-end", () => {
  it("draft → reviewed → approved → published becomes learner-visible", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const mod = await content.createContent(admin, "modules", moduleInput);
    expect(mod).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished", version: 1, sourceType: "original" });

    await expect(content.setPublishStatus(admin, "modules", { id: mod.id, to: "published" })).rejects.toBeInstanceOf(ConflictError);

    const reviewed = await content.transitionReview(admin, "modules", { id: mod.id, to: "reviewed" });
    expect(reviewed.reviewedBy).toBe(admin.id);
    expect(reviewed.reviewedAt).toBeTruthy();
    await content.transitionReview(admin, "modules", { id: mod.id, to: "approved" });
    expect(await content.listPublishedModules("A1")).toHaveLength(0);

    await content.setPublishStatus(admin, "modules", { id: mod.id, to: "published" });
    const visible = await content.listPublishedModules("A1");
    expect(visible.map((m) => m.slug)).toEqual(["hallo"]);
  });

  it("editing published content bumps version and hides it until re-approved", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const mod = await content.createContent(admin, "modules", moduleInput);
    await content.transitionReview(admin, "modules", { id: mod.id, to: "reviewed" });
    await content.transitionReview(admin, "modules", { id: mod.id, to: "approved" });
    await content.setPublishStatus(admin, "modules", { id: mod.id, to: "published" });

    const edited = await content.updateContent(admin, "modules", mod.id, 1, { ...moduleInput, title: { de: "Hallo und Tschüss!" } });
    expect(edited).toMatchObject({ version: 2, reviewStatus: "draft", publishStatus: "unpublished" });
    expect(edited.title.de).toBe("Hallo und Tschüss!");
    expect(await content.listPublishedModules("A1")).toHaveLength(0);
  });

  it("stale versions are rejected (optimistic concurrency)", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const mod = await content.createContent(admin, "modules", moduleInput);
    await content.updateContent(admin, "modules", mod.id, 1, { ...moduleInput, order: 2 });
    await expect(content.updateContent(admin, "modules", mod.id, 1, { ...moduleInput, order: 3 })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("slugs are unique per level", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    await content.createContent(admin, "modules", moduleInput);
    await expect(content.createContent(admin, "modules", moduleInput)).rejects.toBeInstanceOf(ConflictError);
    await expect(content.createContent(admin, "modules", { ...moduleInput, levelCode: "A2" })).resolves.toBeTruthy();
  });
});

describe("seeding", () => {
  it("seeds 6 levels as draft, idempotently", async () => {
    expect((await seedLevels(LEVELS)).inserted).toBe(6);
    expect((await seedLevels(LEVELS)).inserted).toBe(0);
    const db = await getDb();
    const levels = await db.collection("levels").find().toArray();
    expect(levels).toHaveLength(6);
    expect(levels.every((l) => l.reviewStatus === "draft" && l.publishStatus === "unpublished")).toBe(true);
    expect(await content.listPublishedLevels()).toHaveLength(0);
  });

  it("does not overwrite reviewed content on re-seed", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    await seedLevels(LEVELS);
    const db = await getDb();
    const a1 = await db.collection("levels").findOne({ code: "A1" });
    await content.transitionReview(admin, "levels", { id: String(a1._id), to: "reviewed" });
    await seedLevels(LEVELS);
    expect((await db.collection("levels").findOne({ code: "A1" })).reviewStatus).toBe("reviewed");
  });

  it("seeds reference metadata with parent links", async () => {
    await seedReferences(REFERENCES);
    const db = await getDb();
    const book = await db.collection("references").findOne({ slug: "netzwerk-neu-a1" });
    const chapters = await db.collection("references").find({ parentId: book._id }).sort({ order: 1 }).toArray();
    expect(chapters).toHaveLength(16);
    expect(chapters[0].title).toBe("Kapitel 1: Guten Tag!");
    expect(chapters.every((c) => c.sourceType === "reference_metadata")).toBe(true);
    const sprechen = await db.collection("references").findOne({ slug: "goethe-start-deutsch-1-sprechen" });
    expect(sprechen.meta).toEqual({ minutes: 15, parts: 3, items: 3, maxPointsDocumented: false });
  });
});
