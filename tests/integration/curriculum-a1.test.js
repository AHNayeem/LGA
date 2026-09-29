import { describe, expect, it } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { ROLES } from "@/lib/auth/roles";
import { getDb } from "@/lib/db/client";
import { LEVELS } from "@/content/seed/levels";
import { REFERENCES } from "@/content/seed/references";
import { CURRICULUM } from "@/content/curriculum/index.js";
import { EXAMS } from "@/content/exams/index.js";
import { AUDIO_CONTENT } from "@/content/audioContent.js";
import { seedCurriculumModule, seedExam, seedLevels, seedReferences } from "@/lib/services/seedService";
import { bulkExamTransition } from "@/lib/services/contentService";
import { getLearnerLevel, getLearnerModule, getLearnerLesson, getLessonPreview } from "@/lib/services/curriculumService";
import { listLearnerExams } from "@/lib/services/examService";
import { registerTtsAssets } from "@/lib/services/audioService";
import { curriculumCues } from "@/lib/audio/cues";
import { generateAudio, memoryRegistry, storageSink } from "@/lib/audio/generate";
import { createFakeTtsProvider } from "@/lib/audio/providers/fake";
import { getStorage } from "@/lib/storage";
import { publishLevel, publishModule } from "@/tests/helpers/curriculum";

// The whole A1 curriculum (all modules, and the seeded exams) through the real seed and
// lifecycle: hierarchy and ordering, drafts invisible, learner visibility once published,
// and the CMS preview on every lesson.

setupTestDatabase();

async function seedAll() {
  await seedLevels(LEVELS);
  await seedReferences(REFERENCES);
  const modules = [];
  for (const def of CURRICULUM) modules.push(await seedCurriculumModule(def));
  const exams = [];
  for (const def of EXAMS) exams.push(await seedExam(def));
  return { modules, exams };
}

async function fakeAudio() {
  const registry = memoryRegistry();
  await generateAudio({ cues: curriculumCues(AUDIO_CONTENT), provider: createFakeTtsProvider(), sink: storageSink(getStorage("memory")), registry });
  await registerTtsAssets([...registry.entries.values()]);
}

describe("A1 curriculum", () => {
  it("seeds every module in order as drafts; a second seed changes nothing", async () => {
    const { modules } = await seedAll();
    expect(modules.map((m) => m.module)).toEqual(CURRICULUM.map((d) => d.module.slug));
    const db = await getDb();
    const stored = await db.collection("modules").find({ levelCode: "A1" }).sort({ order: 1 }).toArray();
    expect(stored.map((m) => m.slug)).toEqual(CURRICULUM.map((d) => d.module.slug));
    for (const kind of ["modules", "lessons", "vocabulary", "grammarTopics", "exercises", "exams"]) {
      expect(await db.collection(kind).countDocuments({ $or: [{ reviewStatus: { $ne: "draft" } }, { publishStatus: { $ne: "unpublished" } }] }), kind).toBe(0);
    }
    const again = [];
    for (const def of CURRICULUM) again.push(await seedCurriculumModule(def));
    expect(again.every((r) => r.inserted === 0 && r.updated === 0)).toBe(true);
  });

  it("keeps lesson and block order exactly as authored", async () => {
    const { modules } = await seedAll();
    const db = await getDb();
    for (const [i, def] of CURRICULUM.entries()) {
      const lessons = await db.collection("lessons").find({ moduleId: (await db.collection("modules").findOne({ slug: def.module.slug }))._id }).sort({ order: 1 }).toArray();
      expect(lessons.map((l) => l.slug), def.module.slug).toEqual(def.lessons.map((l) => l.slug));
      for (const [j, l] of lessons.entries()) expect(l.blocks.map((b) => `${b.type}:${b.key}`)).toEqual(def.lessons[j].blocks.map((b) => `${b.type}:${b.key}`));
      expect(modules[i].moduleId).toBe(String((await db.collection("modules").findOne({ slug: def.module.slug }))._id));
    }
  });

  it("drafts are invisible to learners; a module and the level become visible only when published", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const learner = await createTestUser();
    const { modules } = await seedAll();
    await fakeAudio();
    await expect(getLearnerLevel(learner, "a1")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await publishLevel(admin);
    expect((await getLearnerLevel(learner, "a1")).modules).toEqual([]);

    // Publish two modules (the first and the last) through the real review workflow.
    for (const m of [modules[0], modules.at(-1)]) {
      const r = await publishModule(admin, m.moduleId);
      for (const step of Object.values(r)) expect(step.failed, m.module).toEqual([]);
    }
    const level = await getLearnerLevel(learner, "a1");
    expect(level.modules.map((m) => m.module.slug)).toEqual([CURRICULUM[0].module.slug, CURRICULUM.at(-1).module.slug]);
    const last = CURRICULUM.at(-1);
    const view = await getLearnerModule(learner, "a1", last.module.slug);
    expect(view.lessons.map((l) => l.slug)).toEqual(last.lessons.map((l) => l.slug));
    const lesson = await getLearnerLesson(learner, { level: "a1", module: last.module.slug, lesson: last.lessons[0].slug });
    expect(lesson.available).toBe(true);
    expect(lesson.blocks.map((b) => b.key)).toEqual(last.lessons[0].blocks.map((b) => b.key));

    // A module still in draft stays invisible, directly too.
    await expect(getLearnerModule(learner, "a1", CURRICULUM[1].module.slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("the CMS preview renders every lesson of every module while it is a draft", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    await seedAll();
    const db = await getDb();
    const lessons = await db.collection("lessons").find({}).toArray();
    expect(lessons.length).toBe(CURRICULUM.reduce((n, d) => n + d.lessons.length, 0));
    for (const l of lessons) {
      const p = await getLessonPreview(admin, String(l._id));
      expect(p.available, l.slug).toBe(true);
      expect(p.preview.learnerVisible).toBe(false);
      expect(p.blocks).toHaveLength(l.blocks.length);
    }
  });

  it.skipIf(EXAMS.length === 0)("seeded exams publish with their exercises and appear on the level", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const learner = await createTestUser();
    const { exams } = await seedAll();
    await fakeAudio();
    await publishLevel(admin);
    expect(await listLearnerExams(learner, "a1")).toEqual([]);
    for (const e of exams) {
      for (const step of ["review", "approve", "publish"]) expect((await bulkExamTransition(admin, e.examId, step)).failed).toEqual([]);
    }
    const listed = await listLearnerExams(learner, "a1");
    expect(listed.map((e) => e.slug)).toEqual(EXAMS.map((d) => d.exam.slug));
    expect(listed[0].questionCount).toBe(EXAMS[0].exercises.reduce((n, e) => n + e.items.length, 0));
  });
});
