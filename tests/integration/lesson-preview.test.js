import { afterEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { generateModule1Audio, publishModule1ForLearners, seedModule1 } from "@/tests/helpers/curriculum";
import { answersFor } from "@/tests/helpers/answers";
import { makeMp3 } from "@/tests/helpers/mp3";
import { webmBytes } from "@/tests/helpers/recordings";
import { MODULE_1 } from "@/content/curriculum/a1/module-01/index.js";
import { ROLES } from "@/lib/auth/roles";
import { AuthenticationError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";
import { getStorage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { handleCurriculumUpload } from "@/lib/http/curriculumUpload";
import { exerciseRepository, lessonRepository, moduleRepository } from "@/lib/repositories/contentRepository";
import * as content from "@/lib/services/contentService";
import * as curriculum from "@/lib/services/curriculumService";
import * as learning from "@/lib/services/learningService";
import * as media from "@/lib/services/mediaService";
import * as recordings from "@/lib/services/recordingService";

// CMS Phase 3: draft learner preview. Reviewers play a lesson in any lifecycle state
// through the learner lesson view, strictly read-only: every preview entry point must
// leave every collection and the media storage byte-for-byte unchanged.

setupTestDatabase();

const APP = "http://localhost:3000";
const MODULE = { level: "a1", module: "hallo" };
const LISTENING = "m1-begruessung-hoeren"; // lesson "hallo-und-tschuess", 4 dialogue lines
const admin = () => createTestUser({ role: ROLES.ADMIN });

afterEach(() => vi.restoreAllMocks());

const lessonDoc = (slug) => lessonRepository.findOne({ slug });
const lessonId = async (slug) => String((await lessonDoc(slug))._id);

// Module 1 as seeded: every item a draft, TTS generated for every cue.
async function draftModule1() {
  const a = await admin();
  const seeded = await seedModule1();
  await generateModule1Audio();
  return { a, seeded };
}

// Every document of every collection, plus the collection names: any insert, update,
// delete, counter or timestamp change shows up as a difference.
async function snapshot() {
  const db = await getDb();
  const out = {};
  for (const c of await db.collections()) out[c.collectionName] = await c.find({}).sort({ _id: 1 }).toArray();
  return JSON.parse(JSON.stringify(out));
}

// Fails the test on any write to the media storage driver.
function watchStorage() {
  const storage = getStorage("memory");
  return [vi.spyOn(storage, "put"), vi.spyOn(storage, "delete")];
}

async function uploadRecording(user) {
  const qs = new URLSearchParams({ filename: "dialog.mp3", title: "Dialog: Guten Morgen" });
  const req = new Request(`${APP}/api/admin/media?${qs}`, {
    method: "POST",
    headers: { Origin: APP, "Content-Type": "audio/mpeg" },
    body: makeMp3(),
    duplex: "half",
  });
  const res = await handleCurriculumUpload(req, { getUser: async () => user, replaceId: null });
  expect(res.status).toBe(201);
  return (await res.json()).media;
}

describe("access", () => {
  it("an ADMIN previews a draft lesson; USER and anonymous callers are rejected", async () => {
    const { a } = await draftModule1();
    const user = await createTestUser();
    const id = await lessonId("hallo-und-tschuess");
    const ex = await exerciseRepository.findOne({ slug: LISTENING });
    const submission = { lessonId: id, exerciseId: String(ex._id), answers: answersFor(ex, String(ex._id)) };

    const view = await curriculum.getLessonPreview(a, id);
    expect(view).toMatchObject({ available: true, lesson: { id, slug: "hallo-und-tschuess" } });
    expect((await learning.previewExerciseAttempt(a, submission)).result.passed).toBe(true);

    await expect(curriculum.getLessonPreview(user, id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(learning.previewExerciseAttempt(user, submission)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(curriculum.getLessonPreview(null, id)).rejects.toBeInstanceOf(AuthenticationError);
    await expect(learning.previewExerciseAttempt(null, submission)).rejects.toBeInstanceOf(AuthenticationError);

    // Unknown or malformed ids look the same: not found.
    await expect(curriculum.getLessonPreview(a, new ObjectId().toHexString())).rejects.toBeInstanceOf(NotFoundError);
    await expect(curriculum.getLessonPreview(a, "not-an-id")).rejects.toBeInstanceOf(NotFoundError);
    // An exercise that isn't in the lesson is not found.
    const other = await exerciseRepository.findOne({ slug: "m1-zahlen-hoeren" });
    await expect(learning.previewExerciseAttempt(a, { ...submission, exerciseId: String(other._id) })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("learner routes and learner writes still refuse the draft, for learners and admins alike", async () => {
    const { a } = await draftModule1();
    const user = await createTestUser();
    const lesson = await lessonDoc("ich-heisse");
    const id = String(lesson._id);
    const speaking = await exerciseRepository.findOne({ slug: "m1-vorstellen-sprechen" });
    const vocabId = String(lesson.blocks.find((b) => b.type === "vocabulary").vocabIds[0]);
    const before = await snapshot();

    for (const actor of [user, a]) {
      await expect(curriculum.getLearnerLesson(actor, { ...MODULE, lesson: "ich-heisse" })).rejects.toBeInstanceOf(NotFoundError);
      await expect(curriculum.getLearnerModule(actor, MODULE.level, MODULE.module)).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        learning.submitExerciseAttempt(actor, { lessonId: id, exerciseId: String(speaking._id), answers: answersFor(speaking, String(speaking._id)) }),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(learning.completeContentBlock(actor, { lessonId: id, blockKey: "intro" })).rejects.toBeInstanceOf(NotFoundError);
      await expect(learning.reviewVocabulary(actor, { vocabId, result: "known" })).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        recordings.uploadSpeakingRecording(actor, { bytes: webmBytes(), declaredType: "audio/webm", lessonId: id, exerciseId: String(speaking._id), itemId: speaking.items[0].id }),
      ).rejects.toBeInstanceOf(NotFoundError);
    }
    // The rejected learner writes above only touched rate-limit counters (existing behaviour).
    const after = await snapshot();
    delete before.rateLimits;
    delete after.rateLimits;
    expect(after).toEqual(before);
  });
});

describe("the preview is the learner lesson view", () => {
  it("renders every Module 1 lesson as drafts: blocks in lesson order with all their content", async () => {
    const { a } = await draftModule1();
    const seen = new Set();
    for (const def of MODULE_1.lessons) {
      const doc = await lessonDoc(def.slug);
      const view = await curriculum.getLessonPreview(a, String(doc._id));
      expect(view.available).toBe(true);
      expect(view.blocks.map((b) => [b.key, b.type])).toEqual(doc.blocks.map((b) => [b.key, b.type]));
      expect(view.completion).toEqual({ total: doc.blocks.length, done: 0, complete: false });
      expect(view.nextLesson).toBeNull();
      expect(view.preview).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished", learnerVisible: false, moduleVisible: false });
      expect(view.preview.linkedNotPublished).toBeGreaterThan(0);

      for (const b of view.blocks) {
        seen.add(b.type);
        expect(b.done).toBe(false);
        if (b.type === "intro") expect(b.body).toBeTruthy();
        else if (b.type === "grammar") expect(b.grammar.sections.length).toBeGreaterThan(0);
        else if (b.type === "vocabulary") {
          expect(b.cards.length).toBeGreaterThan(0);
          for (const c of b.cards) {
            expect(c.review).toBeNull();
            expect(c.audio).toMatchObject({ type: "asset", url: expect.stringMatching(/^\/api\/media\/[0-9a-f]{24}$/) });
          }
        } else {
          expect(b.exercise.items.length).toBeGreaterThan(0);
          expect(b.stats).toBeNull();
          // No answer key reaches the client, as for learners.
          expect(JSON.stringify(b.exercise)).not.toMatch(/"(answer|accepted|pairs)"/);
          if (b.exercise.items.some((i) => i.type === "speak_prompt")) {
            expect(b.recordings).toEqual({});
            expect(b.recordingLimits.maxSeconds).toBeGreaterThan(0);
          }
        }
      }
    }
    expect([...seen].sort()).toEqual(["grammar", "intro", "listening", "mastery_check", "mini_test", "practice", "reading", "speaking", "vocabulary"]);
  });

  it("matches what a new learner gets after publication, and published lessons behave as before", async () => {
    const a = await admin();
    await publishModule1ForLearners(a);
    const learner = await createTestUser();
    for (const def of MODULE_1.lessons) {
      const learnerView = await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: def.slug });
      const preview = await curriculum.getLessonPreview(a, learnerView.lesson.id);
      expect(preview.preview).toMatchObject({ reviewStatus: "approved", publishStatus: "published", linkedNotPublished: 0, learnerVisible: true });
      const { preview: _status, nextLesson: _n, ...previewRest } = preview;
      const { nextLesson: _m, ...learnerRest } = learnerView;
      expect(previewRest).toEqual(learnerRest);
    }

    // A learner's own progress never leaks into the preview, and learning still works.
    const first = MODULE_1.lessons[0].slug;
    const view = await curriculum.getLearnerLesson(a, { ...MODULE, lesson: first });
    await learning.completeContentBlock(a, { lessonId: view.lesson.id, blockKey: "intro" });
    expect((await curriculum.getLearnerLesson(a, { ...MODULE, lesson: first })).completion.done).toBe(1);
    expect((await curriculum.getLessonPreview(a, view.lesson.id)).completion.done).toBe(0);
  });

  it("shows unpublished and archived linked items in the banner status and still renders them", async () => {
    const a = await admin();
    await publishModule1ForLearners(a);
    const doc = await lessonDoc("hallo-und-tschuess");
    const ex = await exerciseRepository.findOne({ slug: LISTENING });
    await content.setPublishStatus(a, "exercises", { id: String(ex._id), to: "archived" });
    const view = await curriculum.getLessonPreview(a, String(doc._id));
    expect(view.preview).toMatchObject({ linkedNotPublished: 1, linkedArchived: 1, learnerVisible: false, moduleVisible: true, levelVisible: true });
    expect(view.blocks.find((b) => b.exercise?.id === String(ex._id))).toBeTruthy();
    // Learners get the existing fail-closed state.
    const learner = await createTestUser();
    expect((await curriculum.getLearnerLesson(learner, { ...MODULE, lesson: "hallo-und-tschuess" })).available).toBe(false);
  });

  it("a lesson without blocks, or with a vanished item, shows the unavailable state", async () => {
    const { a } = await draftModule1();
    const mod = await moduleRepository.findOne({ slug: "hallo" });
    const empty = await content.saveContent(a, { kind: "lessons", data: { moduleId: String(mod._id), slug: "leer", order: 90, title: { de: "Leer" }, blocks: [], sourceType: "original" } });
    expect(await curriculum.getLessonPreview(a, empty.id)).toMatchObject({ available: false, blocks: [] });

    const doc = await lessonDoc("hallo-und-tschuess");
    const grammarBlock = doc.blocks.find((b) => b.type === "grammar");
    await (await getDb()).collection("grammarTopics").deleteOne({ _id: grammarBlock.refId });
    expect((await curriculum.getLessonPreview(a, String(doc._id))).available).toBe(false);
  });
});

describe("listening audio in the preview", () => {
  const listeningBlock = (view) => view.blocks.find((b) => b.exercise?.title?.de === "Guten Morgen, Frau Weber!");

  it("plays an attached native recording, and falls back to TTS without one", async () => {
    const { a } = await draftModule1();
    const id = await lessonId("hallo-und-tschuess");

    // No recording: the per-line generated TTS sequence.
    const tts = listeningBlock(await curriculum.getLessonPreview(a, id)).exercise.stimulus.audio.sources;
    expect(tts).toHaveLength(4);
    for (const s of tts) expect(s).toMatchObject({ type: "asset", url: expect.stringMatching(/^\/api\/media\/[0-9a-f]{24}$/) });

    // Native recording attached to the draft exercise: one source for the passage.
    const m = await uploadRecording(a);
    const ex = await exerciseRepository.findOne({ slug: LISTENING });
    await content.setExerciseAudioMedia(a, { exerciseId: String(ex._id), version: ex.version, target: "stimulus", mediaId: m.id });
    const native = listeningBlock(await curriculum.getLessonPreview(a, id)).exercise.stimulus.audio.sources;
    expect(native).toEqual([{ type: "asset", url: `/api/media/${m.id}`, lang: "de-DE" }]);

    // The reviewer can play it; a learner can't (its exercise is a draft).
    const opened = await media.openMedia(a, m.id);
    expect(opened.asset.source).toBe("native");
    await expect(media.openMedia(await createTestUser(), m.id)).rejects.toBeInstanceOf(NotFoundError);

    // Removing the recording returns the passage to TTS.
    const updated = await exerciseRepository.findOne({ slug: LISTENING });
    await content.setExerciseAudioMedia(a, { exerciseId: String(updated._id), version: updated.version, target: "stimulus", mediaId: null });
    expect(listeningBlock(await curriculum.getLessonPreview(a, id)).exercise.stimulus.audio.sources).toEqual(tts);
  });
});

describe("preview writes nothing", () => {
  it("grades and reveals every Module 1 exercise without any database, storage or log write", async () => {
    const { a } = await draftModule1();
    const m = await uploadRecording(a);
    const ex = await exerciseRepository.findOne({ slug: LISTENING });
    await content.setExerciseAudioMedia(a, { exerciseId: String(ex._id), version: ex.version, target: "stimulus", mediaId: m.id });

    const before = await snapshot();
    const [put, del] = watchStorage();
    const info = vi.spyOn(logger, "info");

    let checked = 0;
    for (const def of MODULE_1.lessons) {
      const id = await lessonId(def.slug);
      const view = await curriculum.getLessonPreview(a, id);
      for (const block of view.blocks.filter((b) => b.exercise)) {
        const doc = await exerciseRepository.findById(block.exercise.id);
        const exerciseId = block.exercise.id;
        const right = await learning.previewExerciseAttempt(a, { lessonId: id, exerciseId, answers: answersFor(doc, exerciseId) });
        expect(right).toMatchObject({ preview: true, attemptId: null, recordings: {}, stats: null, blockDone: true, lesson: { done: 0, complete: false } });
        expect(right.result.passed).toBe(true);
        expect(Object.keys(right.reveal.items)).toEqual(doc.items.map((i) => i.id));

        if (doc.skill === "speaking") {
          // Ungraded: a recording id that isn't the viewer's is simply ignored, never claimed.
          const withId = Object.fromEntries(doc.items.map((i) => [i.id, { selfRating: "unsure", recordingId: new ObjectId().toHexString() }]));
          const r = await learning.previewExerciseAttempt(a, { lessonId: id, exerciseId, answers: withId });
          expect(r.result).toMatchObject({ graded: false, passed: true });
          expect(r.recordings).toEqual({});
        } else {
          const wrong = await learning.previewExerciseAttempt(a, { lessonId: id, exerciseId, answers: answersFor(doc, exerciseId, { wrong: true }) });
          expect(wrong.result.passed).toBe(false);
        }
        checked++;
      }
    }
    expect(checked).toBe(MODULE_1.lessons.flatMap((l) => l.blocks).filter((b) => b.exercise).length);

    // Zero persistent records: no attempt, progress, completion, word review, recording,
    // rate-limit counter, audit field or timestamp changed anywhere, and nothing stored.
    expect(await snapshot()).toEqual(before);
    const db = await getDb();
    for (const name of ["attempts", "userProgress", "userVocabulary"]) {
      expect(await db.collection(name).countDocuments(), name).toBe(0);
    }
    // The only counter is the setup's curriculum upload; preview added none.
    expect(await db.collection("rateLimits").find({}, { projection: { _id: 0, key: 1, count: 1 } }).toArray()).toEqual(
      before.rateLimits.map(({ key, count }) => ({ key, count })),
    );
    expect(await db.collection("mediaAssets").countDocuments({ source: "learner" })).toBe(0);
    expect(put).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
    expect(info.mock.calls.map(([event]) => event)).not.toContain("exercise_attempt");
  });
});
