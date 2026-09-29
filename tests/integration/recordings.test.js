import { describe, expect, it } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import { publishModule1ForLearners } from "@/tests/helpers/curriculum";
import { allRated, mp4Bytes, speakingTarget, wavBytes, webmBytes } from "@/tests/helpers/recordings";
import { ROLES } from "@/lib/auth/roles";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { getDb } from "@/lib/db/client";
import { getStorage } from "@/lib/storage";
import { handleRecordingUpload } from "@/lib/http/recordingUpload";
import { incrementWindow } from "@/lib/repositories/rateLimitRepository";
import { RATE_LIMITS } from "@/lib/security/rateLimit";
import * as recordings from "@/lib/services/recordingService";
import * as learning from "@/lib/services/learningService";
import * as curriculum from "@/lib/services/curriculumService";
import * as media from "@/lib/services/mediaService";

setupTestDatabase();

const APP = "http://localhost:3000";
const PUBLIC_KEYS = ["createdAt", "durationSec", "id", "kind", "mime", "size"];

async function setup() {
  const admin = await createTestUser({ role: ROLES.ADMIN });
  await publishModule1ForLearners(admin);
  const learner = await createTestUser();
  const target = await speakingTarget(learner);
  return { admin, learner, ...target };
}

function uploadRequest({ lessonId, exerciseId, itemId = "q1", duration, body = webmBytes(), type = "audio/webm;codecs=opus", headers = {} }) {
  const qs = new URLSearchParams({ lessonId, exerciseId, itemId, ...(duration != null ? { duration: String(duration) } : {}) });
  return new Request(`${APP}/api/recordings?${qs}`, {
    method: "POST",
    headers: { Origin: APP, "Content-Type": type, ...headers },
    body,
    duplex: "half",
  });
}

async function upload(user, t, opts = {}) {
  const res = await handleRecordingUpload(uploadRequest({ lessonId: t.lessonId, exerciseId: t.exerciseId, ...opts }), { getUser: async () => user });
  return { status: res.status, body: await res.json(), headers: res.headers };
}

const mediaDoc = async (id) => (await getDb()).collection("mediaAssets").findOne({ _id: new (await import("mongodb")).ObjectId(id) });
const recordingDocs = async (ownerId) =>
  (await getDb()).collection("mediaAssets").find({ source: "learner", ownerId: new (await import("mongodb")).ObjectId(ownerId) }).toArray();

describe("POST /api/recordings: request checks", () => {
  it("rejects missing, foreign and cross-site origins before anything else", async () => {
    const t = await setup();
    for (const headers of [{ Origin: "" }, { Origin: "https://evil.example" }, { Origin: "null" }, { "Sec-Fetch-Site": "cross-site" }]) {
      const req = uploadRequest({ lessonId: t.lessonId, exerciseId: t.exerciseId, headers });
      if (headers.Origin === "") req.headers.delete("origin");
      const res = await handleRecordingUpload(req, { getUser: async () => t.learner });
      expect(res.status, JSON.stringify(headers)).toBe(403);
    }
    expect(await recordingDocs(t.learner.id)).toHaveLength(0);
  });

  it("requires a signed-in learner", async () => {
    const t = await setup();
    const res = await handleRecordingUpload(uploadRequest({ lessonId: t.lessonId, exerciseId: t.exerciseId }), { getUser: async () => null });
    expect(res.status).toBe(401);
  });

  it("rejects malformed and forged targets without revealing which part was wrong", async () => {
    const t = await setup();
    expect((await upload(t.learner, t, { itemId: "Q 1" })).status).toBe(400);
    expect((await upload(t.learner, { ...t, lessonId: "not-an-id" })).status).toBe(400);
    const forged = "0123456789abcdef01234567";
    expect((await upload(t.learner, { ...t, lessonId: forged })).status).toBe(404);
    expect((await upload(t.learner, { ...t, exerciseId: forged })).status).toBe(404);
    expect((await upload(t.learner, t, { itemId: "q9" })).status).toBe(404);
    // A real, visible item that is not a speaking prompt.
    const notSpeaking = await upload(t.learner, { ...t, exerciseId: t.gradedExerciseId }, { itemId: t.gradedItemId });
    expect(notSpeaking.status).toBe(404);
    expect(await recordingDocs(t.learner.id)).toHaveLength(0);
  });

  it("validates format by signature, not by the declared type", async () => {
    const t = await setup();
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    expect((await upload(t.learner, t, { body: html, type: "audio/webm" })).body.code).toBe("VALIDATION");
    expect((await upload(t.learner, t, { body: webmBytes(), type: "text/html" })).status).toBe(400);
    expect((await upload(t.learner, t, { body: wavBytes(), type: "audio/wav" })).status).toBe(400); // not a recorder format
    expect((await upload(t.learner, t, { body: new Uint8Array(0) })).status).toBe(400);
    const ok = await upload(t.learner, t, { body: mp4Bytes(), type: "audio/mp4" }); // Safari
    expect(ok.status).toBe(201);
    expect(ok.body.recording.mime).toBe("audio/mp4");
  });

  it("enforces the size limit from Content-Length and while streaming", async () => {
    const t = await setup();
    const declared = await upload(t.learner, t, { headers: { "Content-Length": String(10 * 1024 * 1024) } });
    expect(declared.status).toBe(413);

    const big = webmBytes(2 * 1024 * 1024 + 1);
    const stream = new ReadableStream({
      start(c) {
        for (let i = 0; i < big.length; i += 65536) c.enqueue(big.slice(i, i + 65536));
        c.close();
      },
    });
    const streamed = await upload(t.learner, t, { body: stream });
    expect(streamed.status).toBe(413);
    expect(streamed.body.message).toMatch(/too large/);
    expect(await recordingDocs(t.learner.id)).toHaveLength(0);
  });

  it("rejects recordings longer than the maximum duration", async () => {
    const t = await setup();
    expect((await upload(t.learner, t, { duration: 61.5 })).status).toBe(201); // within tolerance
    const long = await upload(t.learner, t, { duration: 125 });
    expect(long.status).toBe(400);
    expect(long.body.message).toMatch(/at most 60 seconds/);
  });

  it("rate-limits uploads per learner", async () => {
    const t = await setup();
    const p = RATE_LIMITS.uploadByUser;
    for (let i = 0; i < p.limit; i++) await incrementWindow(`${p.prefix}:${t.learner.id}`, p.windowMs);
    const res = await upload(t.learner, t);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("returns only an opaque id and public metadata", async () => {
    const t = await setup();
    const res = await upload(t.learner, t, { duration: 3.21 });
    expect(res.status).toBe(201);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(Object.keys(res.body.recording).sort()).toEqual(PUBLIC_KEYS);
    expect(res.body.recording.durationSec).toBe(3.2);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain("recordings/");
    expect(raw).not.toContain(t.learner.id);
    const doc = await mediaDoc(res.body.recording.id);
    expect(doc).toMatchObject({ source: "learner", visibility: "private", recording: { status: "pending", itemId: "q1", attemptId: null } });
    expect(doc.storage.key).toMatch(new RegExp(`^recordings/${t.learner.id}/`));
  });
});

describe("speaking attempts with recordings", () => {
  it("attaches the recording to the attempt; nothing is scored", async () => {
    const t = await setup();
    const rec = (await upload(t.learner, t)).body.recording;
    const res = await learning.submitExerciseAttempt(t.learner, {
      lessonId: t.lessonId,
      exerciseId: t.exerciseId,
      answers: allRated({ q1: { selfRating: "confident", recordingId: rec.id } }),
    });
    expect(res.result).toMatchObject({ graded: false, score: 0, maxScore: 0, ratio: null, passed: true });
    for (const item of res.result.items) expect(item).toMatchObject({ correct: null, score: 0, maxScore: 0 });
    expect(JSON.stringify(res)).not.toMatch(/pronunciation|accuracy|fluency/i);
    expect(Object.keys(res.recordings)).toEqual(["q1"]);
    expect(Object.keys(res.recordings.q1).sort()).toEqual(PUBLIC_KEYS);

    const doc = await mediaDoc(rec.id);
    expect(doc.recording.status).toBe("attached");
    expect(String(doc.recording.attemptId)).toBe(res.attemptId);
    const attempt = await (await getDb()).collection("attempts").findOne({});
    expect(attempt).toMatchObject({ score: 0, graded: false, answers: { q1: { selfRating: "confident", recordingId: rec.id } } });

    // Visible to the owner in the lesson, never counted for mastery.
    const { block } = await speakingTarget(t.learner);
    expect(block.recordings.q1.id).toBe(rec.id);
    expect(block.recordingLimits).toEqual({ maxSeconds: 60, maxBytes: 2 * 1024 * 1024 });
    expect(JSON.stringify(block.exercise)).not.toContain("modelAnswer");
    const mod = await curriculum.getLearnerModule(t.learner, "a1", "hallo");
    expect(mod.mastery.skills.speaking.status).toBe("not_assessed");
    expect(mod.mastery.breakdown.speaking).toBeUndefined();
  });

  it("keeps the Phase 2 string answer format working", async () => {
    const t = await setup();
    const res = await learning.submitExerciseAttempt(t.learner, { lessonId: t.lessonId, exerciseId: t.exerciseId, answers: allRated() });
    expect(res.result.passed).toBe(true);
    expect(res.result.items.map((i) => i.selfRating)).toEqual(["confident", "unsure", "not_yet"]);
    expect(res.recordings).toEqual({});
  });

  it("rejects another learner's, another item's and forged recording ids, storing nothing", async () => {
    const t = await setup();
    const other = await createTestUser();
    const foreign = (await upload(other, t)).body.recording;
    const mine = (await upload(t.learner, t, { itemId: "q2" })).body.recording;
    const submit = (q1) => learning.submitExerciseAttempt(t.learner, { lessonId: t.lessonId, exerciseId: t.exerciseId, answers: allRated({ q1 }) });

    await expect(submit({ selfRating: "confident", recordingId: foreign.id })).rejects.toBeInstanceOf(ValidationError);
    await expect(submit({ selfRating: "confident", recordingId: mine.id })).rejects.toBeInstanceOf(ValidationError); // recorded for q2
    await expect(submit({ selfRating: "confident", recordingId: "0123456789abcdef01234567" })).rejects.toBeInstanceOf(ValidationError);
    expect(await (await getDb()).collection("attempts").countDocuments()).toBe(0);
    expect((await mediaDoc(foreign.id)).recording.status).toBe("pending");

    // A malformed id is not an answer at all: the item counts as unanswered.
    const res = await submit({ selfRating: "confident", recordingId: "../../etc/passwd" });
    expect(res.result.items[0].answered).toBe(false);
    expect(res.result.passed).toBe(false);
  });

  it("a newer submission replaces the previous recording for that item", async () => {
    const t = await setup();
    const storage = getStorage();
    const submitWith = async (recordingId) =>
      learning.submitExerciseAttempt(t.learner, {
        lessonId: t.lessonId,
        exerciseId: t.exerciseId,
        answers: allRated({ q1: { selfRating: "unsure", recordingId } }),
      });
    const first = (await upload(t.learner, t)).body.recording;
    await submitWith(first.id);
    const firstKey = (await mediaDoc(first.id)).storage.key;
    const second = (await upload(t.learner, t)).body.recording;
    await submitWith(second.id);

    expect(await mediaDoc(first.id)).toBeNull();
    expect(await storage.get(firstKey)).toBeNull();
    const docs = await recordingDocs(t.learner.id);
    expect(docs.map((d) => String(d._id))).toEqual([second.id]);
    const { block } = await speakingTarget(t.learner);
    expect(block.recordings.q1.id).toBe(second.id);
    // Both attempts are kept (attempts are immutable), only the old audio is gone.
    expect(await (await getDb()).collection("attempts").countDocuments()).toBe(2);
  });

  it("a new take supersedes an unsubmitted one; stale uploads are cleaned up", async () => {
    const t = await setup();
    const a = (await upload(t.learner, t)).body.recording;
    const b = (await upload(t.learner, t)).body.recording;
    expect(await mediaDoc(a.id)).toBeNull();
    expect((await mediaDoc(b.id)).recording.status).toBe("pending");

    const col = (await getDb()).collection("mediaAssets");
    await col.updateOne({ _id: (await mediaDoc(b.id))._id }, { $set: { createdAt: new Date(Date.now() - 25 * 3600_000) } });
    const key = (await mediaDoc(b.id)).storage.key;
    expect(await recordings.cleanupStaleRecordings()).toEqual({ removed: 1 });
    expect(await mediaDoc(b.id)).toBeNull();
    expect(await getStorage().get(key)).toBeNull();

    // Attached recordings are never "stale".
    const c = (await upload(t.learner, t, { itemId: "q2" })).body.recording;
    await learning.submitExerciseAttempt(t.learner, { lessonId: t.lessonId, exerciseId: t.exerciseId, answers: allRated({ q2: { selfRating: "confident", recordingId: c.id } }) });
    await col.updateOne({ _id: (await mediaDoc(c.id))._id }, { $set: { createdAt: new Date(Date.now() - 30 * 86400_000) } });
    expect(await recordings.cleanupStaleRecordings()).toEqual({ removed: 0 });
  });
});

describe("recording playback and deletion", () => {
  it("only the owner (and media managers) can play a recording; deleted ones are gone", async () => {
    const t = await setup();
    const other = await createTestUser();
    const rec = (await upload(t.learner, t)).body.recording;
    const key = (await mediaDoc(rec.id)).storage.key;

    await expect(media.openMedia(t.learner, rec.id)).resolves.toBeTruthy();
    await expect(media.openMedia(t.admin, rec.id)).resolves.toBeTruthy();
    await expect(media.openMedia(other, rec.id)).rejects.toBeInstanceOf(NotFoundError);

    await expect(recordings.deleteOwnRecording(other, { recordingId: rec.id })).rejects.toBeInstanceOf(NotFoundError);
    await expect(recordings.deleteOwnRecording(t.learner, { recordingId: "nope" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(recordings.deleteOwnRecording(t.learner, { recordingId: { $ne: null } })).rejects.toBeInstanceOf(NotFoundError);
    expect(await mediaDoc(rec.id)).not.toBeNull();

    await expect(recordings.deleteOwnRecording(t.learner, { recordingId: rec.id })).resolves.toEqual({ deleted: true });
    await expect(media.openMedia(t.learner, rec.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await getStorage().get(key)).toBeNull();
    await expect(recordings.deleteOwnRecording(t.learner, { recordingId: rec.id })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("recordings cannot target unpublished lessons", async () => {
    const t = await setup();
    const db = await getDb();
    await db.collection("lessons").updateOne({ slug: "ich-heisse" }, { $set: { publishStatus: "unpublished" } });
    expect((await upload(t.learner, t)).status).toBe(404);
  });
});
