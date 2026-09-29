import { describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { publishModule1ForLearners, seedModule1 } from "@/tests/helpers/curriculum";
import { makeMp3 } from "@/tests/helpers/mp3";
import { wavBytes, webmBytes } from "@/tests/helpers/recordings";
import { MODULE_1 } from "@/content/curriculum/a1/module-01/index.js";
import { ROLES } from "@/lib/auth/roles";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";
import { getStorage } from "@/lib/storage";
import { handleCurriculumUpload } from "@/lib/http/curriculumUpload";
import { exerciseRepository } from "@/lib/repositories/contentRepository";
import { seedCurriculumModule } from "@/lib/services/seedService";
import { createExerciseAudioResolver, registerTtsAssets } from "@/lib/services/audioService";
import { cueHash, exerciseCues } from "@/lib/audio/cues";
import { toClientExercise } from "@/lib/exercises/engine";
import * as content from "@/lib/services/contentService";
import * as curriculum from "@/lib/services/curriculumService";
import * as media from "@/lib/services/mediaService";

// CMS Phase 2: curriculum media. Uploads go through the real route handler logic
// (lib/http/curriculumUpload.js) with plain Requests; everything else through the
// services the Server Actions call.

setupTestDatabase();

const APP = "http://localhost:3000";
const admin = () => createTestUser({ role: ROLES.ADMIN });
const LISTENING = "m1-begruessung-hoeren"; // Module 1, lesson "hallo-und-tschuess": 4 dialogue lines
const LESSON = { level: "a1", module: "hallo", lesson: "hallo-und-tschuess" };

function uploadRequest({ bytes = makeMp3(), filename = "dialog.mp3", type = "audio/mpeg", params = {}, method = "POST", id = null, headers = {} } = {}) {
  const qs = new URLSearchParams({ filename, ...(method === "POST" ? { title: "Dialog: Guten Morgen" } : {}), ...params });
  return new Request(`${APP}/api/admin/media${id ? `/${id}` : ""}?${qs}`, {
    method,
    headers: { Origin: APP, "Content-Type": type, ...headers },
    body: bytes,
    duplex: "half",
  });
}

async function upload(user, opts = {}) {
  const res = await handleCurriculumUpload(uploadRequest(opts), { getUser: async () => user, replaceId: opts.id ?? null });
  return { status: res.status, body: await res.json() };
}

async function uploadOk(user, opts) {
  const res = await upload(user, opts);
  expect(res.status, res.body.message).toBe(201);
  return res.body.media;
}

const mediaDoc = async (id) => (await getDb()).collection("mediaAssets").findOne({ _id: new ObjectId(id) });
const exerciseBySlug = (slug) => exerciseRepository.findOne({ slug });

async function approveAndPublish(actor, kind, id) {
  await content.transitionReview(actor, kind, { id, to: "reviewed" });
  await content.transitionReview(actor, kind, { id, to: "approved" });
  return content.setPublishStatus(actor, kind, { id, to: "published" });
}

async function attach(actor, slug, target, mediaId) {
  const ex = await exerciseBySlug(slug);
  return content.setExerciseAudioMedia(actor, { exerciseId: String(ex._id), version: ex.version, target, mediaId });
}

const listeningData = (over = {}) => ({
  levelCode: "A1",
  slug: "cms-hoeren",
  skill: "listening",
  title: { de: "Hören: Am Bahnhof" },
  stimulus: { audio: { lines: [{ text: "Der Zug nach Berlin fährt um neun Uhr." }] } },
  items: [{ type: "true_false", id: "q1", statement: { de: "Der Zug fährt um neun." }, answer: true }],
  sourceType: "original",
  ...over,
});

describe("upload authorization", () => {
  it("ADMIN uploads; USER, anonymous and cross-site requests are rejected before the body is read", async () => {
    const a = await admin();
    const user = await createTestUser();
    const m = await uploadOk(a);
    expect(m).toMatchObject({ source: "native", status: "active", visibility: "linked", mime: "audio/mpeg", title: "Dialog: Guten Morgen", editable: true });
    expect(m.durationSec).toBeGreaterThan(1);
    expect(m).not.toHaveProperty("storage");

    expect((await upload(user)).status).toBe(403);
    expect((await upload(null)).status).toBe(401);
    const foreign = await handleCurriculumUpload(uploadRequest({ headers: { Origin: "https://evil.example" } }), { getUser: async () => a });
    expect(foreign.status).toBe(403);
    expect(await (await getDb()).collection("mediaAssets").countDocuments({ source: { $in: ["native", "licensed"] } })).toBe(1);
  });

  it("USER can't list, search, edit, archive, delete, replace or attach curriculum media", async () => {
    const a = await admin();
    const user = await createTestUser();
    const m = await uploadOk(a);
    await expect(media.listCurriculumMedia(user)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(media.searchCurriculumMedia(user)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(media.getCurriculumMediaForAdmin(user, m.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(media.updateCurriculumMedia(user, m.id, { title: "x" })).rejects.toBeInstanceOf(ForbiddenError);
    await expect(media.setCurriculumMediaStatus(user, m.id, "archived")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(media.deleteCurriculumMedia(user, m.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(media.deleteMedia(user, m.id)).rejects.toBeInstanceOf(NotFoundError); // not readable → not even found
    expect((await upload(user, { method: "PUT", id: m.id })).status).toBe(403);
    await expect(content.setExerciseAudioMedia(user, { exerciseId: new ObjectId().toHexString(), version: 1, target: "stimulus", mediaId: m.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(content.listExerciseAudioTargets(user, new ObjectId().toHexString())).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("upload validation", () => {
  it("accepts MP3, WAV and WebM with matching names; records the sanitised original name", async () => {
    const a = await admin();
    expect((await uploadOk(a, { filename: "C:\\Users\\x\\Anna\u0007.mp3" })).originalName).toBe("Anna.mp3");
    expect((await uploadOk(a, { bytes: wavBytes(), filename: "zug.wav", type: "audio/wav", params: { duration: "3.5" } })).durationSec).toBe(3.5);
    expect((await uploadOk(a, { bytes: webmBytes(), filename: "zug.webm", type: "" })).mime).toBe("audio/webm");
    const doc = await mediaDoc((await uploadOk(a)).id);
    expect(doc.storage.key).toMatch(/^curriculum\/[0-9a-f-]{36}\.mp3$/); // server-generated, never the client's name
    expect(doc).toMatchObject({ ownerId: null, source: "native", visibility: "linked", status: "active" });
  });

  it("rejects a wrong MIME type, a disguised file, a wrong extension, a damaged MP3 and unsupported formats", async () => {
    const a = await admin();
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const flac = new Uint8Array(64);
    flac.set(new TextEncoder().encode("fLaC"));
    const damaged = new Uint8Array([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, 10, ...new Array(40).fill(0)]); // ID3 tag, no frames
    const cases = [
      [{ type: "text/html" }, /does not match/],
      [{ bytes: html, filename: "evil.mp3" }, /Unsupported file/],
      [{ bytes: flac, filename: "a.flac", type: "audio/flac" }, /Unsupported file/],
      [{ bytes: wavBytes(), filename: "fake.mp3", type: "" }, /must end in \.wav/],
      [{ filename: "noextension" }, /must end in \.mp3/],
      [{ bytes: damaged }, /damaged/],
      [{ bytes: new Uint8Array(0) }, /empty/],
    ];
    for (const [opts, message] of cases) {
      const res = await upload(a, opts);
      expect(res.status, JSON.stringify(opts.filename)).toBe(400);
      expect(res.body.message).toMatch(message);
    }
    expect(await (await getDb()).collection("mediaAssets").countDocuments({})).toBe(0);
  });

  it("rejects oversized files by Content-Length and by counting a chunked body", async () => {
    const a = await admin();
    const max = 4 * 1024 * 1024;
    const big = makeMp3({ seconds: (max / 96) * 0.024 + 1 });
    expect(big.byteLength).toBeGreaterThan(max);
    const declared = await upload(a, { bytes: big });
    expect(declared.status).toBe(413);
    // No Content-Length: a stream that is larger than allowed is cut off while reading.
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(big);
        c.close();
      },
    });
    const res = await handleCurriculumUpload(uploadRequest({ bytes: stream }), { getUser: async () => a });
    expect(res.status).toBe(413);
    expect(await (await getDb()).collection("mediaAssets").countDocuments({})).toBe(0);
  });

  it("validates metadata before reading the body: a title is required, licensed audio needs a license", async () => {
    const a = await admin();
    const noTitle = await handleCurriculumUpload(
      new Request(`${APP}/api/admin/media?filename=a.mp3`, { method: "POST", headers: { Origin: APP }, body: makeMp3(), duplex: "half" }),
      { getUser: async () => a },
    );
    expect(noTitle.status).toBe(400);
    expect((await noTitle.json()).fieldErrors).toHaveProperty("title");
    const licensed = await upload(a, { params: { source: "licensed" } });
    expect(licensed.body.fieldErrors).toHaveProperty("license");
    expect((await uploadOk(a, { params: { source: "licensed", license: "Hueber, Lizenz 2026-12" } })).source).toBe("licensed");
  });
});

describe("media library", () => {
  it("lists, searches, filters and pages curriculum media; learner recordings and TTS stay separate", async () => {
    const a = await admin();
    const learner = await createTestUser();
    await media.uploadLearnerRecording(learner, { bytes: webmBytes(), declaredType: "audio/webm" });
    await registerTtsAssets([{ hash: cueHash({ text: "Hallo" }), text: "Hallo", mime: "audio/mpeg", driver: "static", key: "tts/x.mp3", lang: "de-DE", voiceRole: "female", rate: "slow", provider: "fake" }]);
    for (const title of ["Bahnhof Dialog", "Bäckerei", "Zahlen 1 bis 20"]) await uploadOk(a, { params: { title } });

    const all = await media.listCurriculumMedia(a);
    expect(all.total).toBe(3);
    expect(all.items.every((m) => m.source === "native" && m.usedBy === 0)).toBe(true);
    expect((await media.listCurriculumMedia(a, { q: "bäck" })).items.map((m) => m.title)).toEqual(["Bäckerei"]);
    expect((await media.listCurriculumMedia(a, { q: "(.*" })).total).toBe(0); // regex characters are literal
    expect((await media.listCurriculumMedia(a, { source: "tts" })).items).toHaveLength(1);
    expect((await media.listCurriculumMedia(a, { source: "all" })).total).toBe(4);
    const everything = await media.listCurriculumMedia(a, { source: "all", status: "any", pageSize: 100 });
    expect(everything.items.some((m) => m.source === "learner")).toBe(false);
    const paged = await media.listCurriculumMedia(a, { pageSize: 2, page: 2 });
    expect(paged).toMatchObject({ total: 3, page: 2 });
    expect(paged.items).toHaveLength(1);
    expect((await media.listCurriculumMedia(a, { source: "bogus", page: "x" })).total).toBe(3); // invalid filters ignored

    // A learner recording is not a curriculum asset, even for an admin looking it up by id.
    const [rec] = await (await getDb()).collection("mediaAssets").find({ source: "learner" }).toArray();
    await expect(media.getCurriculumMediaForAdmin(a, String(rec._id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(media.updateCurriculumMedia(a, String(rec._id), { title: "x" })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("edits metadata; archive and delete require the audio to be unused; delete removes the bytes", async () => {
    const a = await admin();
    const m = await uploadOk(a);
    const updated = await media.updateCurriculumMedia(a, m.id, { title: "Neu", voice: "Sprecherin A", transcript: "Guten Morgen!", source: "native" });
    expect(updated).toMatchObject({ title: "Neu", voice: "Sprecherin A", transcript: "Guten Morgen!" });

    const ex = await content.saveContent(a, { kind: "exercises", data: listeningData({ stimulus: { audio: { lines: [{ text: "Hallo" }], mediaId: m.id } } }) });
    await expect(media.setCurriculumMediaStatus(a, m.id, "archived")).rejects.toThrow(/1 exercise/);
    await expect(media.deleteCurriculumMedia(a, m.id)).rejects.toThrow(/Archive/);
    expect((await media.listCurriculumMedia(a, { usage: "used" })).items.map((x) => x.id)).toEqual([m.id]);
    expect((await media.getCurriculumMediaForAdmin(a, m.id)).usedBy).toMatchObject([{ id: ex.id, targets: ["stimulus"] }]);

    await content.setExerciseAudioMedia(a, { exerciseId: ex.id, version: ex.version, target: "stimulus", mediaId: null });
    expect((await media.listCurriculumMedia(a, { usage: "unused" })).items.map((x) => x.id)).toEqual([m.id]); // kept, now unused
    const key = (await mediaDoc(m.id)).storage.key;
    expect((await media.setCurriculumMediaStatus(a, m.id, "archived")).status).toBe("archived");
    expect((await media.listCurriculumMedia(a)).total).toBe(0); // archived hidden by default
    expect((await media.searchCurriculumMedia(a)).total).toBe(0);
    await media.deleteCurriculumMedia(a, m.id);
    expect(await mediaDoc(m.id)).toBeNull();
    expect(await getStorage().get(key)).toBeNull();
  });

  it("replaces the file under the same id while only drafts use it; old bytes are removed", async () => {
    const a = await admin();
    const m = await uploadOk(a);
    const oldKey = (await mediaDoc(m.id)).storage.key;
    const ex = await content.saveContent(a, { kind: "exercises", data: listeningData({ stimulus: { audio: { lines: [{ text: "Hallo" }], mediaId: m.id } } }) });
    const res = await upload(a, { method: "PUT", id: m.id, bytes: wavBytes(), filename: "neu.wav", type: "audio/wav" });
    expect(res.status).toBe(200);
    expect(res.body.media).toMatchObject({ id: m.id, mime: "audio/wav", originalName: "neu.wav", title: "Dialog: Guten Morgen" });
    expect(await getStorage().get(oldKey)).toBeNull();

    await content.transitionReview(a, "exercises", { id: ex.id, to: "reviewed" });
    const blocked = await upload(a, { method: "PUT", id: m.id });
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toMatch(/reviewed or approved/);
    expect((await upload(a, { method: "PUT", id: new ObjectId().toHexString() })).status).toBe(404);
  });
});

describe("attaching audio to exercises", () => {
  it("attaches through the editor payload and through the library; survives reload; replaces and removes", async () => {
    const a = await admin();
    const first = await uploadOk(a);
    const second = await uploadOk(a, { params: { title: "Zweite Aufnahme" } });

    // Editor path: the saved payload carries the id; stored as an ObjectId, read back as a string.
    const ex = await content.saveContent(a, {
      kind: "exercises",
      data: listeningData({
        stimulus: { audio: { lines: [{ text: "Der Zug fährt um neun." }], mediaId: first.id } },
        items: [{ type: "true_false", id: "q1", statement: { de: "Um neun." }, answer: true, audio: { text: "Um neun Uhr.", mediaId: second.id } }],
      }),
    });
    const raw = await exerciseRepository.findById(ex.id);
    expect(raw.stimulus.audio.mediaId).toBeInstanceOf(ObjectId);
    expect(raw.items[0].audio.mediaId).toBeInstanceOf(ObjectId);
    const view = await content.getContentForAdmin(a, "exercises", ex.id);
    expect(view.item.stimulus.audio.mediaId).toBe(first.id);
    expect(view.checks.audio).toMatchObject({
      source: "native",
      missing: 0,
      targets: [
        { target: "stimulus", source: "native", native: { id: first.id, usable: true }, tts: { total: 1, available: 0 } },
        { target: "q1", source: "native", native: { id: second.id, title: "Zweite Aufnahme" } },
      ],
    });

    // Library path: replace, then remove. Each is a versioned edit.
    const replaced = await content.setExerciseAudioMedia(a, { exerciseId: ex.id, version: ex.version, target: "stimulus", mediaId: second.id });
    expect(replaced.version).toBe(ex.version + 1);
    expect((await content.getContentForAdmin(a, "exercises", ex.id)).item.stimulus.audio.mediaId).toBe(second.id);
    await expect(content.setExerciseAudioMedia(a, { exerciseId: ex.id, version: ex.version, target: "stimulus", mediaId: first.id })).rejects.toBeInstanceOf(ConflictError);
    const removed = await content.setExerciseAudioMedia(a, { exerciseId: ex.id, version: replaced.version, target: "q1", mediaId: null });
    expect(removed.items[0].audio).toEqual({ text: "Um neun Uhr.", voice: "female", rate: "slow" });
    expect(removed.stimulus.audio.lines).toEqual([{ text: "Der Zug fährt um neun.", voice: "female", rate: "slow" }]); // cue kept intact
    await expect(content.setExerciseAudioMedia(a, { exerciseId: ex.id, version: removed.version, target: "q9", mediaId: first.id })).rejects.toBeInstanceOf(ValidationError);

    const targets = await content.listExerciseAudioTargets(a, ex.id);
    expect(targets).toMatchObject({ version: removed.version, targets: [{ target: "stimulus", mediaId: second.id }, { target: "q1", mediaId: null, source: "missing" }] });
  });

  it("rejects unknown, archived, learner-owned and TTS media ids", async () => {
    const a = await admin();
    const learner = await createTestUser();
    const archived = await uploadOk(a);
    await media.setCurriculumMediaStatus(a, archived.id, "archived");
    const recording = await media.uploadLearnerRecording(learner, { bytes: webmBytes(), declaredType: "audio/webm" });
    const tts = await media.registerStaticAudio(a, { kind: "audio", key: "tts/abc.mp3", mime: "audio/mpeg", source: "tts" });
    for (const mediaId of [new ObjectId().toHexString(), archived.id, recording.id, tts.id]) {
      const err = await content
        .saveContent(a, { kind: "exercises", data: listeningData({ stimulus: { audio: { lines: [{ text: "Hallo" }], mediaId } } }) })
        .catch((e) => e);
      expect(err, mediaId).toBeInstanceOf(ValidationError);
      expect(err.fieldErrors).toHaveProperty(["stimulus.audio.mediaId"]);
    }
    const bad = await content.saveContent(a, { kind: "exercises", data: listeningData({ stimulus: { audio: { lines: [{ text: "x" }], mediaId: "not-an-id" } } }) }).catch((e) => e);
    expect(bad.fieldErrors).toHaveProperty(["stimulus.audio.mediaId"]);
  });

  it("seed --update keeps recordings attached in the CMS", async () => {
    const a = await admin();
    await seedModule1();
    const m = await uploadOk(a);
    await attach(a, LISTENING, "stimulus", m.id);
    const changed = structuredClone(MODULE_1);
    changed.exercises.find((e) => e.slug === LISTENING).instructions = { en: "Listen carefully." };
    await seedCurriculumModule(changed, { update: true });
    const ex = await exerciseBySlug(LISTENING);
    expect(ex.instructions.en).toBe("Listen carefully.");
    expect(String(ex.stimulus.audio.mediaId)).toBe(m.id);
  });
});

describe("audio resolution", () => {
  it("native recording → generated TTS → unavailable, per listening target", async () => {
    const a = await admin();
    const m = await uploadOk(a);
    const ex = (withMedia) => ({
      _id: new ObjectId(),
      skill: "listening",
      stimulus: { audio: { lines: [{ text: "Eins" }, { text: "Zwei" }], ...(withMedia ? { mediaId: m.id } : {}) } },
      items: [{ type: "true_false", id: "q1", statement: { de: "x" }, answer: true, audio: { text: "Drei", ...(withMedia ? { mediaId: m.id } : {}) } }],
    });
    const play = async (e) => {
      const audio = await createExerciseAudioResolver([e], exerciseCues(e));
      const client = toClientExercise(e, { audio });
      return { stimulus: client.stimulus.audio.sources, item: client.items[0].audio };
    };

    // 1. Native attached: one source for the whole passage, and the item's recording.
    expect(await play(ex(true))).toEqual({ stimulus: [{ type: "asset", url: `/api/media/${m.id}`, lang: "de-DE" }], item: { type: "asset", url: `/api/media/${m.id}`, lang: "de-DE" } });

    // 2. No recording, TTS exists: the per-line TTS sequence (unchanged behaviour).
    const entries = ["Eins", "Zwei", "Drei"].map((text, i) => ({ hash: cueHash({ text }), text, mime: "audio/mpeg", driver: "static", key: `tts/${i}.mp3`, lang: "de-DE", voiceRole: "female", rate: "slow", provider: "fake" }));
    await registerTtsAssets(entries);
    const tts = await play(ex(false));
    expect(tts.stimulus).toHaveLength(2);
    expect(tts.stimulus.every((s) => s.type === "asset" && s.url !== `/api/media/${m.id}`)).toBe(true);

    // An archived recording is never played: TTS takes over.
    const withArchived = ex(true);
    const other = await uploadOk(a);
    withArchived.stimulus.audio.mediaId = other.id;
    await media.setCurriculumMediaStatus(a, other.id, "archived");
    expect((await play(withArchived)).stimulus).toHaveLength(2);

    // 3. Neither: unavailable in production (development may use the browser voice).
    await (await getDb()).collection("mediaAssets").deleteMany({ source: "tts" });
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(await play(ex(false))).toEqual({ stimulus: [{ type: "unavailable" }, { type: "unavailable" }], item: { type: "unavailable" } });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("publishing and learner access", () => {
  it("native audio or generated TTS makes a listening exercise publishable; neither blocks it", async () => {
    const a = await admin();
    const m = await uploadOk(a);
    const native = await content.saveContent(a, { kind: "exercises", data: listeningData({ slug: "mit-aufnahme", stimulus: { audio: { lines: [{ text: "Nur Aufnahme." }], mediaId: m.id } } }) });
    await expect(approveAndPublish(a, "exercises", native.id)).resolves.toMatchObject({ publishStatus: "published" });

    const none = await content.saveContent(a, { kind: "exercises", data: listeningData({ slug: "ohne-audio", stimulus: { audio: { lines: [{ text: "Kein Audio." }] } } }) });
    await expect(approveAndPublish(a, "exercises", none.id)).rejects.toThrow(/no playable audio/);

    await registerTtsAssets([{ hash: cueHash({ text: "Kein Audio." }), text: "Kein Audio.", mime: "audio/mpeg", driver: "static", key: "tts/k.mp3", lang: "de-DE", voiceRole: "female", rate: "slow", provider: "fake" }]);
    await expect(content.setPublishStatus(a, "exercises", { id: none.id, to: "published" })).resolves.toMatchObject({ publishStatus: "published" });
  });

  it("learners play attached audio only while the exercise is published; admins can always preview", async () => {
    const a = await admin();
    const learner = await createTestUser();
    await publishModule1ForLearners(a);
    const m = await uploadOk(a);

    // Uploaded but not attached: private to media managers.
    await expect(media.openMedia(learner, m.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(media.openMedia(a, m.id)).resolves.toMatchObject({ asset: { visibility: "linked" } });

    // Before: the published lesson plays the 4-line TTS dialogue.
    const before = await curriculum.getLearnerLesson(learner, LESSON);
    const block = (lesson) => lesson.blocks.find((b) => b.exercise?.stimulus?.audio);
    expect(block(before).exercise.stimulus.audio.sources).toHaveLength(4);

    // Attaching is an edit: the exercise returns to draft, so the lesson is unavailable and
    // the recording stays private until the exercise is published again.
    await attach(a, LISTENING, "stimulus", m.id);
    const ex = await exerciseBySlug(LISTENING);
    expect(ex).toMatchObject({ reviewStatus: "draft", publishStatus: "unpublished" });
    expect((await curriculum.getLearnerLesson(learner, LESSON)).available).toBe(false);
    await expect(media.openMedia(learner, m.id)).rejects.toBeInstanceOf(NotFoundError);

    await approveAndPublish(a, "exercises", String(ex._id));
    const after = await curriculum.getLearnerLesson(learner, LESSON);
    expect(block(after).exercise.stimulus.audio.sources).toEqual([{ type: "asset", url: `/api/media/${m.id}`, lang: "de-DE" }]);
    expect(block(after).exercise.stimulus.audio.maxPlays).toBe(2);
    const opened = await media.openMedia(learner, m.id);
    expect(opened.file.contentType).toBe("audio/mpeg");

    // Unpublishing hides it again.
    await content.setPublishStatus(a, "exercises", { id: String(ex._id), to: "unpublished" });
    await expect(media.openMedia(learner, m.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(media.openMedia(a, m.id)).resolves.toBeTruthy();
  });
});
