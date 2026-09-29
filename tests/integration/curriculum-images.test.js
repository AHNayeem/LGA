import { afterEach, describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { publishModule1ForLearners, seedModule1 } from "@/tests/helpers/curriculum";
import { makeGif, makeJpeg, makePng, makeWebp, SVG } from "@/tests/helpers/images";
import { makeMp3 } from "@/tests/helpers/mp3";
import { MODULE_1 } from "@/content/curriculum/a1/module-01/index.js";
import { ROLES } from "@/lib/auth/roles";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { resetEnvCache } from "@/lib/config/env";
import { getDb } from "@/lib/db/client";
import { serialize } from "@/lib/db/serialize";
import { getStorage } from "@/lib/storage";
import { handleCurriculumUpload } from "@/lib/http/curriculumUpload";
import { exerciseRepository, lessonRepository, vocabularyRepository } from "@/lib/repositories/contentRepository";
import { seedCurriculumModule } from "@/lib/services/seedService";
import { lessonPayload, lessonState, vocabularyPayload, vocabularyState, exercisePayload, exerciseState } from "@/components/admin/editor/payload";
import * as content from "@/lib/services/contentService";
import * as curriculum from "@/lib/services/curriculumService";
import * as media from "@/lib/services/mediaService";

// CMS Phase 5: curriculum images. Uploads go through the real route handler logic
// (lib/http/curriculumUpload.js); attachments through saveContent with the editors' own
// payload builders, exactly as the CMS sends them; learner and preview views through the
// services the pages call.

setupTestDatabase();

const APP = "http://localhost:3000";
const LESSON = { level: "a1", module: "hallo", lesson: "hallo-und-tschuess" };
const LISTENING = "m1-begruessung-hoeren";
const admin = () => createTestUser({ role: ROLES.ADMIN });

afterEach(() => {
  delete process.env.CURRICULUM_IMAGE_MAX_BYTES;
  resetEnvCache();
});

function uploadRequest({ bytes = makePng(), filename = "schild.png", type = "image/png", params = {}, method = "POST", id = null } = {}) {
  const qs = new URLSearchParams({ filename, ...(method === "POST" ? { title: "Schild: Bahnhof" } : {}), ...params });
  return new Request(`${APP}/api/admin/media${id ? `/${id}` : ""}?${qs}`, {
    method,
    headers: { Origin: APP, "Content-Type": type },
    body: bytes,
    duplex: "half",
  });
}

async function upload(user, opts = {}) {
  const res = await handleCurriculumUpload(uploadRequest(opts), { getUser: async () => user, replaceId: opts.id ?? null });
  return { status: res.status, body: await res.json() };
}

async function uploadImage(user, opts) {
  const res = await upload(user, opts);
  expect(res.status, res.body.message).toBe(201);
  return res.body.media;
}

const uploadAudio = (user) => uploadImage(user, { bytes: makeMp3(), filename: "dialog.mp3", type: "audio/mpeg" });
const mediaDoc = async (id) => (await getDb()).collection("mediaAssets").findOne({ _id: new ObjectId(id) });
const setMediaFields = async (id, patch) => (await getDb()).collection("mediaAssets").updateOne({ _id: new ObjectId(id) }, { $set: patch });

async function approveAndPublish(actor, kind, id) {
  await content.transitionReview(actor, kind, { id, to: "reviewed" });
  await content.transitionReview(actor, kind, { id, to: "approved" });
  return content.setPublishStatus(actor, kind, { id, to: "published" });
}

// Edits through the editor's own state → payload conversion, like the CMS does.
async function saveLessonIntroImage(actor, slug, image) {
  const doc = serialize(await lessonRepository.findOne({ slug }));
  const state = lessonState(doc);
  state.blocks[0].image = { mediaId: image?.mediaId ?? "", alt: { de: "", en: "", bn: "", ...image?.alt }, caption: { de: "", en: "", bn: "", ...image?.caption } };
  return content.saveContent(actor, { kind: "lessons", id: doc.id, version: doc.version, data: lessonPayload(state) });
}

async function saveWordImage(actor, slug, image) {
  const doc = serialize(await vocabularyRepository.findOne({ slug }));
  const state = vocabularyState(doc);
  state.image = { mediaId: image?.mediaId ?? "", alt: { de: "", en: "", bn: "", ...image?.alt }, caption: { de: "", en: "", bn: "", ...image?.caption } };
  return content.saveContent(actor, { kind: "vocabulary", id: doc.id, version: doc.version, data: vocabularyPayload(state) });
}

const firstWordSlug = async () => {
  const lesson = await lessonRepository.findOne({ slug: LESSON.lesson });
  const block = lesson.blocks.find((b) => b.type === "vocabulary");
  return (await vocabularyRepository.findById(block.vocabIds[0])).slug;
};

describe("image upload", () => {
  it("ADMIN uploads PNG, JPEG, WebP and GIF: kind, dimensions, server-side key, no storage details", async () => {
    const a = await admin();
    const png = await uploadImage(a, { params: { alt: "Ein Schild am Bahnhof" } });
    expect(png).toMatchObject({ kind: "image", mime: "image/png", width: 4, height: 3, alt: "Ein Schild am Bahnhof", source: "native", status: "active", visibility: "linked" });
    expect(png.durationSec).toBeNull();
    expect(png).not.toHaveProperty("storage");
    const doc = await mediaDoc(png.id);
    expect(doc.storage.key).toMatch(/^curriculum\/[0-9a-f-]{36}\.png$/);
    expect(doc).toMatchObject({ kind: "image", size: makePng().byteLength, ownerId: null, voice: null, transcript: null, language: null });
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(String(doc.createdBy)).toBe(a.id);

    expect((await uploadImage(a, { bytes: makeJpeg({ width: 640, height: 480 }), filename: "foto.jpg", type: "image/jpeg" })).width).toBe(640);
    expect((await uploadImage(a, { bytes: makeWebp(), filename: "bild.webp", type: "image/webp" })).mime).toBe("image/webp");
    expect((await uploadImage(a, { bytes: makeGif(), filename: "punkt.gif", type: "" })).height).toBe(1);
    expect((await uploadImage(a, { bytes: makePng(), filename: "l.png", params: { source: "licensed", license: "CC BY 4.0, Foto: X" } })).license).toBe("CC BY 4.0, Foto: X");
  });

  it("USER and anonymous callers are rejected before the body is read", async () => {
    const user = await createTestUser();
    expect((await upload(user)).status).toBe(403);
    expect((await upload(null)).status).toBe(401);
    expect(await (await getDb()).collection("mediaAssets").countDocuments({})).toBe(0);
  });

  it("rejects SVG, disguised files, mismatched types and extensions, damaged and oversized images", async () => {
    const a = await admin();
    const cases = [
      [{ bytes: SVG, filename: "logo.svg", type: "image/svg+xml" }, 400, /Unsupported file/],
      [{ bytes: new TextEncoder().encode("<html><script>alert(1)</script></html>"), filename: "x.png" }, 400, /Unsupported file/],
      [{ bytes: makePng(), filename: "a.png", type: "image/jpeg" }, 400, /does not match/],
      [{ bytes: makePng(), filename: "a.gif" }, 400, /must end in \.png/],
      [{ bytes: makePng({ headerOnly: true }), filename: "a.png" }, 400, /damaged or incomplete/],
      [{ bytes: makeJpeg({ sof: false }), filename: "a.jpg", type: "image/jpeg" }, 400, /damaged or incomplete/],
      [{ bytes: makePng({ claim: { width: 20000, height: 20000 } }), filename: "bomb.png" }, 400, /at most 8000 px/],
      [{ bytes: new Uint8Array(), filename: "a.png" }, 400, /empty/],
    ];
    for (const [opts, status, message] of cases) {
      const res = await upload(a, opts);
      expect(res.status, opts.filename).toBe(status);
      expect(res.body.message).toMatch(message);
    }
    process.env.CURRICULUM_IMAGE_MAX_BYTES = "100";
    resetEnvCache();
    const big = await upload(a, { bytes: makePng({ width: 40, height: 40 }), filename: "big.png" });
    expect(makePng({ width: 40, height: 40 }).byteLength).toBeGreaterThan(100);
    expect(big.status).toBe(413);
    expect(big.body.message).toMatch(/image is too large/);
    expect(await (await getDb()).collection("mediaAssets").countDocuments({})).toBe(0);
  });

  it("replacing keeps the kind: an image only takes another image; dimensions are updated", async () => {
    const a = await admin();
    const img = await uploadImage(a);
    const replaced = await upload(a, { method: "PUT", id: img.id, bytes: makePng({ width: 8, height: 6 }), filename: "neu.png" });
    expect(replaced.status).toBe(200);
    expect(replaced.body.media).toMatchObject({ width: 8, height: 6, originalName: "neu.png" });
    const asAudio = await upload(a, { method: "PUT", id: img.id, bytes: makeMp3(), filename: "a.mp3", type: "audio/mpeg" });
    expect(asAudio.status).toBe(400);
    const audio = await uploadAudio(a);
    expect((await upload(a, { method: "PUT", id: audio.id, bytes: makePng(), filename: "a.png" })).status).toBe(400);
    expect((await mediaDoc(audio.id)).kind).toBe("audio");
  });
});

describe("attaching images", () => {
  it("attach, store as ObjectId, show in the editor data, remove; alt text is required", async () => {
    const a = await admin();
    await seedModule1();
    const img = await uploadImage(a);
    const slug = await firstWordSlug();

    const noAlt = await saveWordImage(a, slug, { mediaId: img.id }).catch((e) => e);
    expect(noAlt).toBeInstanceOf(ValidationError);
    expect(noAlt.fieldErrors["image.alt"]).toBeTruthy();

    const saved = await saveWordImage(a, slug, { mediaId: img.id, alt: { en: "Two people waving" }, caption: { de: "Hallo!" } });
    const stored = await vocabularyRepository.findOne({ slug });
    expect(stored.image.mediaId).toBeInstanceOf(ObjectId);
    expect(stored.image).toMatchObject({ alt: { en: "Two people waving" }, caption: { de: "Hallo!" } });
    const forEditor = await content.getContentForAdmin(a, "vocabulary", saved.id);
    expect(forEditor.images[img.id]).toMatchObject({ kind: "image", width: 4, height: 3, usable: true });
    expect((await media.getCurriculumMediaForAdmin(a, img.id)).usedBy).toMatchObject([{ kind: "vocabulary", id: saved.id, images: ["Word image"], targets: [] }]);
    expect((await media.listCurriculumMedia(a, { kind: "image" })).items).toMatchObject([{ id: img.id, usedBy: 1 }]);
    await expect(media.setCurriculumMediaStatus(a, img.id, "archived")).rejects.toThrow(/1 item\(s\) use this image/);

    await saveWordImage(a, slug, null);
    expect((await vocabularyRepository.findOne({ slug })).image).toBeNull();
    expect((await media.getCurriculumMediaForAdmin(a, img.id)).usedBy).toEqual([]);
    expect((await media.listCurriculumMedia(a, { kind: "image", usage: "unused" })).total).toBe(1);
    // Now unused: archive, then delete removes metadata and bytes.
    const key = (await mediaDoc(img.id)).storage.key;
    await media.setCurriculumMediaStatus(a, img.id, "archived");
    await media.deleteCurriculumMedia(a, img.id);
    expect(await mediaDoc(img.id)).toBeNull();
    expect(await getStorage("memory").get(key)).toBeNull();
  });

  it("rejects unknown, archived and audio ids as images, and images as audio", async () => {
    const a = await admin();
    await seedModule1();
    const slug = await firstWordSlug();
    const img = await uploadImage(a);
    const audio = await uploadAudio(a);
    const alt = { en: "x" };
    for (const mediaId of [new ObjectId().toHexString(), audio.id]) {
      const err = await saveWordImage(a, slug, { mediaId, alt }).catch((e) => e);
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.fieldErrors["image.mediaId"]).toEqual(["Choose an active image from the media library"]);
    }
    await media.setCurriculumMediaStatus(a, img.id, "archived");
    expect(await saveWordImage(a, slug, { mediaId: img.id, alt }).catch((e) => e)).toBeInstanceOf(ValidationError);
    await media.setCurriculumMediaStatus(a, img.id, "active");

    // An image can't be a listening recording.
    const ex = await exerciseRepository.findOne({ slug: LISTENING });
    const state = exerciseState(serialize(ex));
    state.stimulus.mediaId = img.id;
    const asAudio = await content.saveContent(a, { kind: "exercises", id: String(ex._id), version: ex.version, data: exercisePayload(state) }).catch((e) => e);
    expect(asAudio).toBeInstanceOf(ValidationError);
    expect(asAudio.fieldErrors["stimulus.audio.mediaId"]).toBeTruthy();
    await expect(content.setExerciseAudioMedia(a, { exerciseId: String(ex._id), version: ex.version, target: "stimulus", mediaId: img.id })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it("USER can't search images, attach them or read the editor data", async () => {
    const a = await admin();
    await seedModule1();
    const user = await createTestUser();
    const img = await uploadImage(a);
    await expect(media.searchCurriculumMedia(user, { kind: "image" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(saveWordImage(user, await firstWordSlug(), { mediaId: img.id, alt: { en: "x" } })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(media.updateCurriculumMedia(user, img.id, { title: "x" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(media.deleteMedia(user, img.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("pickers keep kinds apart: audio search never lists images, image search never lists audio", async () => {
    const a = await admin();
    const img = await uploadImage(a);
    const audio = await uploadAudio(a);
    expect((await media.searchCurriculumMedia(a)).items.map((m) => m.id)).toEqual([audio.id]);
    const images = await media.searchCurriculumMedia(a, { kind: "image" });
    expect(images.items).toMatchObject([{ id: img.id, kind: "image", width: 4, height: 3, usable: true }]);
    expect(images.items[0]).not.toHaveProperty("storage");
    expect((await media.listCurriculumMedia(a, { kind: "audio" })).items.map((m) => m.id)).toEqual([audio.id]);
    expect((await media.listCurriculumMedia(a)).total).toBe(2);
  });

  it("metadata edits are per kind: images keep no speaker or transcript", async () => {
    const a = await admin();
    const img = await uploadImage(a);
    const updated = await media.updateCurriculumMedia(a, img.id, { title: "Neu", alt: "A station sign", voice: "ignored", transcript: "ignored" });
    expect(updated).toMatchObject({ title: "Neu", alt: "A station sign", voice: null, transcript: null });
  });

  it("seed --update keeps images attached to words and intro blocks", async () => {
    const a = await admin();
    await seedModule1();
    const img = await uploadImage(a);
    const slug = await firstWordSlug();
    await saveWordImage(a, slug, { mediaId: img.id, alt: { en: "Waving" } });
    await saveLessonIntroImage(a, LESSON.lesson, { mediaId: img.id, alt: { en: "A greeting" } });
    const changed = structuredClone(MODULE_1);
    changed.lessons.find((l) => l.slug === LESSON.lesson).estimatedMinutes = 21;
    await seedCurriculumModule(changed, { update: true });
    const lesson = await lessonRepository.findOne({ slug: LESSON.lesson });
    expect(lesson.estimatedMinutes).toBe(21);
    expect(String(lesson.blocks[0].image.mediaId)).toBe(img.id);
    expect(String((await vocabularyRepository.findOne({ slug })).image.mediaId)).toBe(img.id);
  });
});

describe("learner visibility and rendering", () => {
  it("draft images are invisible to learners and shown in the preview; published ones render for learners", async () => {
    const a = await admin();
    await publishModule1ForLearners(a);
    const learner = await createTestUser();
    const img = await uploadImage(a);
    const lessonId = String((await lessonRepository.findOne({ slug: LESSON.lesson }))._id);

    // Before: the published lesson has no image, and the upload is not readable.
    expect((await curriculum.getLearnerLesson(learner, LESSON)).blocks[0].image).toBeNull();
    await expect(media.openMedia(learner, img.id)).rejects.toBeInstanceOf(NotFoundError);

    // Attaching is an edit: the lesson goes back to draft and leaves the learner routes.
    await saveLessonIntroImage(a, LESSON.lesson, { mediaId: img.id, alt: { en: "Two people greeting", de: "Zwei Menschen grüßen sich" }, caption: { en: "Guten Tag!" } });
    await expect(curriculum.getLearnerLesson(learner, LESSON)).rejects.toBeInstanceOf(NotFoundError);
    await expect(media.openMedia(learner, img.id)).rejects.toBeInstanceOf(NotFoundError);

    const expected = { src: `/api/media/${img.id}`, width: 4, height: 3, alt: { en: "Two people greeting", de: "Zwei Menschen grüßen sich" }, caption: { en: "Guten Tag!" } };
    const preview = await curriculum.getLessonPreview(a, lessonId);
    expect(preview.blocks[0].image).toEqual(expected);
    expect((await media.openMedia(a, img.id)).file.contentType).toBe("image/png"); // admins can preview

    await approveAndPublish(a, "lessons", lessonId);
    const view = await curriculum.getLearnerLesson(learner, LESSON);
    expect(view.blocks[0].image).toEqual(expected);
    expect(JSON.stringify(view)).not.toMatch(/curriculum\//); // no storage keys leak
    const served = await media.openMedia(learner, img.id);
    expect(served.file.contentType).toBe("image/png");
    // The same data drives the preview, now identical to the learner's first visit.
    expect((await curriculum.getLessonPreview(a, lessonId)).blocks[0]).toEqual(view.blocks[0]);

    // Unpublishing ends learner access again.
    await content.setPublishStatus(a, "lessons", { id: lessonId, to: "unpublished" });
    await expect(media.openMedia(learner, img.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("word images and stimulus images are resolved in lessons; the recording keeps playing", async () => {
    const a = await admin();
    await publishModule1ForLearners(a);
    const learner = await createTestUser();
    const img = await uploadImage(a);
    const audio = await uploadAudio(a);
    const slug = await firstWordSlug();

    const word = await saveWordImage(a, slug, { mediaId: img.id, alt: { en: "Waving hand" } });
    await approveAndPublish(a, "vocabulary", word.id);

    const ex = await exerciseRepository.findOne({ slug: LISTENING });
    const state = exerciseState(serialize(ex));
    state.stimulus.mediaId = audio.id;
    state.stimulus.image = { mediaId: img.id, alt: { en: "A street", de: "", bn: "" }, caption: { de: "", en: "", bn: "" } };
    const saved = await content.saveContent(a, { kind: "exercises", id: String(ex._id), version: ex.version, data: exercisePayload(state) });
    expect((await exerciseRepository.findOne({ slug: LISTENING })).stimulus.image.mediaId).toBeInstanceOf(ObjectId);
    await approveAndPublish(a, "exercises", saved.id);

    const view = await curriculum.getLearnerLesson(learner, LESSON);
    const card = view.blocks.find((b) => b.type === "vocabulary").cards[0];
    expect(card.image).toMatchObject({ src: `/api/media/${img.id}`, alt: { en: "Waving hand" } });
    const listening = view.blocks.find((b) => b.exercise?.id === saved.id).exercise;
    expect(listening.stimulus.image).toMatchObject({ src: `/api/media/${img.id}`, width: 4, height: 3 });
    expect(listening.stimulus.audio.sources).toHaveLength(1);
    expect(listening.stimulus.audio.sources[0]).toMatchObject({ type: "asset", url: `/api/media/${audio.id}` });
    // Other cards and blocks are unchanged.
    expect(view.blocks.find((b) => b.type === "vocabulary").cards.slice(1).every((c) => c.image === null)).toBe(true);
    expect(view.blocks[0].image).toBeNull();
    await expect(media.openMedia(learner, img.id)).resolves.toBeTruthy();
    await expect(media.openMedia(learner, audio.id)).resolves.toBeTruthy();
  });

  it("a missing or archived image is left out; the lesson still renders", async () => {
    const a = await admin();
    await publishModule1ForLearners(a);
    const learner = await createTestUser();
    const img = await uploadImage(a);
    const lessonId = String((await lessonRepository.findOne({ slug: LESSON.lesson }))._id);
    await saveLessonIntroImage(a, LESSON.lesson, { mediaId: img.id, alt: { en: "x" } });
    await approveAndPublish(a, "lessons", lessonId);
    expect((await curriculum.getLearnerLesson(learner, LESSON)).blocks[0].image).not.toBeNull();

    await setMediaFields(img.id, { status: "archived" }); // bypassing the in-use guard
    let view = await curriculum.getLearnerLesson(learner, LESSON);
    expect(view.available).toBe(true);
    expect(view.blocks[0]).toMatchObject({ type: "intro", image: null });
    expect(view.blocks[0].body).toBeTruthy();
    await expect(media.openMedia(learner, img.id)).rejects.toBeInstanceOf(NotFoundError);

    await (await getDb()).collection("mediaAssets").deleteOne({ _id: new ObjectId(img.id) });
    view = await curriculum.getLearnerLesson(learner, LESSON);
    expect(view.available).toBe(true);
    expect(view.blocks[0].image).toBeNull();
    expect((await curriculum.getLessonPreview(a, lessonId)).blocks[0].image).toBeNull();
    expect((await content.getContentForAdmin(a, "lessons", lessonId)).images[img.id]).toMatchObject({ usable: false, status: "missing" });
  });

  it("publishing is refused while an attached image is unavailable", async () => {
    const a = await admin();
    await seedModule1();
    const img = await uploadImage(a);
    const saved = await saveWordImage(a, await firstWordSlug(), { mediaId: img.id, alt: { en: "x" } });
    await content.transitionReview(a, "vocabulary", { id: saved.id, to: "reviewed" });
    await content.transitionReview(a, "vocabulary", { id: saved.id, to: "approved" });
    await setMediaFields(img.id, { status: "archived" });
    await expect(content.setPublishStatus(a, "vocabulary", { id: saved.id, to: "published" })).rejects.toThrow(ConflictError);
    await setMediaFields(img.id, { status: "active" });
    await expect(content.setPublishStatus(a, "vocabulary", { id: saved.id, to: "published" })).resolves.toMatchObject({ publishStatus: "published" });
  });

  it("an image used by reviewed content can't have its file swapped", async () => {
    const a = await admin();
    await seedModule1();
    const img = await uploadImage(a);
    const saved = await saveWordImage(a, await firstWordSlug(), { mediaId: img.id, alt: { en: "x" } });
    await content.transitionReview(a, "vocabulary", { id: saved.id, to: "reviewed" });
    const res = await upload(a, { method: "PUT", id: img.id, bytes: makePng({ width: 2, height: 2 }), filename: "b.png" });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/reviewed or approved item\(s\) use this image/);
  });
});
