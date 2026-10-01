import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { generateModule1Audio, publishLevel, seedModule1 } from "@/tests/helpers/curriculum";
import { ROLES } from "@/lib/auth/roles";
import { APPROVAL_BASIS } from "@/lib/content/lifecycle";
import { ForbiddenError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";
import { bulkModuleTransition, saveContent, setPublishStatus, transitionReview } from "@/lib/services/contentService";
import { checkLevelReadiness } from "@/lib/services/readinessService";
import { vocabularyRepository } from "@/lib/repositories/contentRepository";
import * as curriculum from "@/lib/services/curriculumService";
import { getLevelStructure } from "@/lib/services/journeyService";
import { seedReferences } from "@/lib/services/seedService";
import { REFERENCES } from "@/content/seed/references";

// The level-wide readiness report (content:check --all, /admin/readiness) on stored
// content: every structural check, the learner-visibility checks, and that it never writes.

setupTestDatabase();

const FIXTURE = { approvalBasis: APPROVAL_BASIS.testFixture };

async function seeded() {
  const admin = await createTestUser({ role: ROLES.ADMIN });
  const { moduleId } = await seedModule1();
  return { admin, moduleId };
}

async function publishedWithFixture() {
  const { admin, moduleId } = await seeded();
  await generateModule1Audio();
  for (const step of ["review", "approve", "publish"]) expect((await bulkModuleTransition(admin, moduleId, step, FIXTURE)).failed).toEqual([]);
  await publishLevel(admin);
  return { admin, moduleId };
}

async function snapshot() {
  const db = await getDb();
  const out = {};
  for (const c of await db.collections()) out[c.collectionName] = await c.find({}).sort({ _id: 1 }).toArray();
  return JSON.parse(JSON.stringify(out));
}

const lessonOf = (report, slug) => report.modules[0].lessons.find((l) => l.slug === slug);
const allProblems = (report) => report.modules.flatMap((m) => m.lessons.flatMap((l) => l.problems)).join("\n");

async function lessonUsing(exerciseId) {
  return (await getDb()).collection("lessons").findOne({ "blocks.refId": exerciseId });
}

describe("curriculum readiness report", () => {
  it("is for content reviewers only", async () => {
    await seeded();
    const learner = await createTestUser();
    await expect(checkLevelReadiness(learner, "a1")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(checkLevelReadiness(null, "a1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("on freshly seeded drafts: nothing live, listening lessons need audio, the rest need review; nothing is written", async () => {
    const { admin } = await seeded();
    const before = await snapshot();
    const r = await checkLevelReadiness(admin, "a1");
    expect(await snapshot()).toEqual(before);

    expect(r.level.visible).toBe(false);
    expect(r.warnings.join()).toMatch(/level isn't published/);
    expect(r.summary).toMatchObject({ modules: 1, lessons: 6, live: 0, blocked: 0, ready: 0 });
    expect(r.summary.needs_audio + r.summary.needs_review).toBe(6);
    expect(lessonOf(r, "ich-heisse").status).toBe("needs_review"); // no listening audio
    expect(lessonOf(r, "hallo-und-tschuess").status).toBe("needs_audio");
    expect(lessonOf(r, "hallo-und-tschuess").audioMissing).toBeGreaterThan(0);
    expect(r.modules[0].lessons.every((l) => l.problems.length === 0 && l.approval.approved === 0)).toBe(true);
    expect(r.ok).toBe(true); // no structural problems in the seeded source
    expect(r.exams).toEqual([]);
  });

  it("after a test-fixture publish: every lesson is live but still needs a real review, and the sequence checks out", async () => {
    const { admin } = await publishedWithFixture();
    const r = await checkLevelReadiness(admin, "a1");
    expect(r.summary).toMatchObject({ lessons: 6, live: 6, blocked: 0, needs_audio: 0, needs_review: 6, ready: 0 });
    expect(r.modules[0].lessons.every((l) => l.approval.testFixture === l.approval.total)).toBe(true);
    expect(r.continuation).toEqual({ ok: true, lessons: 6, visited: 6, problems: [] });
    expect(r.modules[0].warnings.join()).toMatch(/TEST-FIXTURE/);
    expect(r.ok).toBe(true);
  });

  it("a real (human) approval with audio and no open findings makes a lesson ready", async () => {
    const { admin, moduleId } = await seeded();
    await generateModule1Audio();
    for (const step of ["review", "approve", "publish"]) await bulkModuleTransition(admin, moduleId, step);
    await publishLevel(admin);
    const r = await checkLevelReadiness(admin, "a1");
    expect(r.summary).toMatchObject({ live: 6, ready: 6 });
  });

  it("finds broken references, duplicate block keys and invalid content", async () => {
    const { admin } = await seeded();
    const db = await getDb();
    const reading = await db.collection("exercises").findOne({ skill: "reading" });
    const readingLesson = await lessonUsing(reading._id);
    await db.collection("exercises").deleteOne({ _id: reading._id });

    const l2 = await db.collection("lessons").findOne({ slug: "hallo-und-tschuess" });
    await db.collection("lessons").updateOne({ _id: l2._id }, { $set: { "blocks.1.key": l2.blocks[0].key } });

    const grammarEx = await db.collection("exercises").findOne({ skill: "grammar" });
    await db.collection("exercises").updateOne({ _id: grammarEx._id }, { $set: { items: [] } });

    const r = await checkLevelReadiness(admin, "a1");
    const broken = lessonOf(r, readingLesson.slug);
    expect(broken.status).toBe("blocked");
    expect(broken.problems.join()).toMatch(new RegExp(`broken reference: exercise ${reading._id} doesn't exist`));
    expect(lessonOf(r, "hallo-und-tschuess").problems.join()).toMatch(/duplicate block key/);
    expect(allProblems(r)).toMatch(new RegExp(`exercise ${grammarEx.slug}: invalid content: items`));
    expect(r.ok).toBe(false);
  });

  it("finds answer keys that don't work, unusable media and broken Goethe links", async () => {
    const { admin } = await seeded();
    const db = await getDb();
    const exercises = db.collection("exercises");
    // Wrong answers pass when the pass mark is 0.
    const lenient = await exercises.findOne({ skill: "grammar" });
    await exercises.updateOne({ _id: lenient._id }, { $set: { passThreshold: 0 } });
    // A recording that doesn't exist.
    const listening = await exercises.findOne({ skill: "listening", "stimulus.audio": { $exists: true } });
    await exercises.updateOne({ _id: listening._id }, { $set: { "stimulus.audio.mediaId": new ObjectId() } });
    // A reading exercise linked to Hören, and a link to a reference that doesn't exist.
    const hoeren = await db.collection("references").findOne({ slug: "goethe-start-deutsch-1-hoeren" });
    const reading = await exercises.findOne({ skill: "reading" });
    await exercises.updateOne({ _id: reading._id }, { $set: { refs: [{ referenceId: hoeren._id }, { referenceId: new ObjectId() }] } });
    // An image that doesn't exist on a word.
    const word = await db.collection("vocabulary").findOne({});
    await db.collection("vocabulary").updateOne({ _id: word._id }, { $set: { image: { mediaId: new ObjectId(), alt: { en: "x" } } } });

    const text = allProblems(await checkLevelReadiness(admin, "a1"));
    expect(text).toMatch(new RegExp(`exercise ${lenient.slug}: wrong answers pass the exercise`));
    expect(text).toMatch(new RegExp(`exercise ${listening.slug}: 1 attached recording\\(s\\) are missing or archived`));
    expect(text).toMatch(new RegExp(`exercise ${reading.slug}: is a reading exercise but is linked to Goethe Hören \\(listening\\)`));
    expect(text).toMatch(new RegExp(`exercise ${reading.slug}: links to a reference that doesn't exist`));
    expect(text).toMatch(new RegExp(`word ${word.slug}: 1 attached image\\(s\\) are missing or archived`));
  });

  it("flags a published level and module that learners see empty, and lesson order problems", async () => {
    const { admin, moduleId } = await seeded();
    const db = await getDb();
    await transitionReview(admin, "modules", { id: moduleId, to: "reviewed" });
    await transitionReview(admin, "modules", { id: moduleId, to: "approved" });
    await setPublishStatus(admin, "modules", { id: moduleId, to: "published" });
    await publishLevel(admin);
    await db.collection("lessons").updateOne({ slug: "modultest" }, { $set: { order: 9 } });
    await db.collection("lessons").updateOne({ slug: "das-alphabet" }, { $set: { order: 4 } });

    const r = await checkLevelReadiness(admin, "a1");
    expect(r.errors.join()).toMatch(/level is published, but learners can't open any lesson/);
    expect(r.modules[0].errors.join()).toMatch(/module is published, but learners can't open any of its lessons/);
    expect(r.modules[0].errors.join()).toMatch(/lessons: duplicate order 4/);
    expect(r.modules[0].warnings.join()).toMatch(/lessons: the order has 1 gap/);
    expect(r.ok).toBe(false);
  });

  it("a published lesson whose content isn't all live is reported, and 'Next lesson' skips it", async () => {
    const { admin } = await publishedWithFixture();
    const db = await getDb();
    const lesson3 = await db.collection("lessons").findOne({ slug: "woher-kommst-du" });
    const exerciseId = lesson3.blocks.find((b) => b.refId && b.type !== "grammar").refId;
    await db.collection("exercises").updateOne({ _id: exerciseId }, { $set: { publishStatus: "unpublished" } });

    const r = await checkLevelReadiness(admin, "a1");
    const l3 = lessonOf(r, "woher-kommst-du");
    expect(l3.live).toBe(false);
    expect(l3.warnings.join()).toMatch(/published, but learners can't open it/);
    expect(r.summary.live).toBe(5);
    expect(r.continuation.ok).toBe(true);

    const learner = await createTestUser();
    const l2 = await curriculum.getLearnerLesson(learner, { level: "a1", module: "hallo", lesson: "ich-heisse" });
    expect(l2.nextLesson.slug).toBe("zahlen-0-bis-20");
    const guestView = await curriculum.getLearnerLesson(null, { level: "a1", module: "hallo", lesson: "ich-heisse" });
    expect(guestView.nextLesson.slug).toBe("zahlen-0-bis-20");
  });
});

describe("level-sized content lookups", () => {
  // A whole level's structure loads every word in one query; A1 alone has 622.
  it("findManyByIds returns every requested document, beyond 500", async () => {
    const docs = Array.from({ length: 650 }, (_, i) => ({ _id: new ObjectId(), levelCode: "A1", slug: `w-${i}`, lemma: `W${i}` }));
    await (await getDb()).collection("vocabulary").insertMany(docs);
    const found = await vocabularyRepository.findManyByIds(docs.map((d) => String(d._id)));
    expect(found).toHaveLength(650);
  });
});


describe("Goethe part descriptions (reference metadata)", () => {
  it("reach the learner structure, and --update-references refreshes them without touching content", async () => {
    await publishedWithFixture();
    const db = await getDb();
    const structure = await getLevelStructure("A1");
    const hoeren = structure.goethe.find((g) => g.key === "hoeren");
    expect(hoeren.teile).toHaveLength(3);
    expect(hoeren.teile[1]).toMatch(/Announcements .* once/);

    // A database seeded before the descriptions existed.
    await db.collection("references").updateMany({ kind: "exam_spec" }, { $unset: { "meta.teil1": "", "meta.teil2": "", "meta.teil3": "" } });
    const before = JSON.stringify(await db.collection("exercises").find({}).sort({ _id: 1 }).toArray());
    expect((await seedReferences(REFERENCES)).updated).toBe(0); // the default never changes existing references
    const r = await seedReferences(REFERENCES, { update: true });
    expect(r).toEqual({ inserted: 0, updated: 4 });
    expect((await getLevelStructure("A1")).goethe.find((g) => g.key === "schreiben").teile).toHaveLength(2);
    expect(JSON.stringify(await db.collection("exercises").find({}).sort({ _id: 1 }).toArray())).toBe(before);
    expect((await seedReferences(REFERENCES, { update: true })).updated).toBe(0);
  });
});

describe("content authored in the CMS", () => {
  it("a valid draft lesson composed in the CMS is not reported as blocked", async () => {
    const { admin, moduleId } = await publishedWithFixture();
    const db = await getDb();
    const word = await db.collection("vocabulary").findOne({});
    await saveContent(admin, {
      kind: "lessons",
      data: {
        moduleId,
        slug: "entwurf-cms",
        order: 50,
        title: { de: "Entwurf" },
        blocks: [
          { type: "vocabulary", key: "woerter", vocabIds: [String(word._id)] },
          { type: "intro", key: "intro", body: { en: "A lesson written in the CMS." } },
        ],
        sourceType: "original",
      },
    });
    const r = await checkLevelReadiness(admin, "a1");
    const draft = lessonOf(r, "entwurf-cms");
    expect(draft.problems).toEqual([]);
    expect(draft).toMatchObject({ status: "needs_review", live: false });
    expect(r.summary.blocked).toBe(0);
    expect(r.modules[0].warnings.join()).toMatch(/lessons: the order has 1 gap/);
  });
});
