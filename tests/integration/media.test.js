import { describe, expect, it } from "vitest";
import { setupTestDatabase, createTestUser } from "@/tests/helpers/db";
import * as media from "@/lib/services/mediaService";
import { ROLES } from "@/lib/auth/roles";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { getStorage, resetStorageDrivers } from "@/lib/storage";
import { findMediaAssetById } from "@/lib/repositories/mediaAssetRepository";

setupTestDatabase();

const webm = () => {
  const b = new Uint8Array(64);
  b.set([0x1a, 0x45, 0xdf, 0xa3]);
  return b;
};

async function readAll(body) {
  if (body instanceof Uint8Array) return body;
  const chunks = [];
  for await (const c of body) chunks.push(c);
  return new Uint8Array(Buffer.concat(chunks));
}

describe("learner recordings", () => {
  it("stores a valid recording privately", async () => {
    const user = await createTestUser();
    const asset = await media.uploadLearnerRecording(user, { bytes: webm(), declaredType: "audio/webm;codecs=opus" });
    // The caller only gets the public view; storage details stay on the server.
    expect(Object.keys(asset).sort()).toEqual(["createdAt", "durationSec", "id", "kind", "mime", "size"]);
    expect(asset).toMatchObject({ mime: "audio/webm", size: 64 });
    const doc = await findMediaAssetById(asset.id);
    expect(doc).toMatchObject({ visibility: "private", source: "learner" });
    expect(String(doc.ownerId)).toBe(user.id);
    expect(doc.storage.key).toMatch(new RegExp(`^recordings/${user.id}/.+\\.webm$`));
    const { file } = await media.openMedia(user, asset.id);
    expect((await readAll(file.body)).byteLength).toBe(64);
  });

  it("rejects disguised or oversized files", async () => {
    const user = await createTestUser();
    const html = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    await expect(media.uploadLearnerRecording(user, { bytes: html, declaredType: "audio/webm" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(media.uploadLearnerRecording(user, { bytes: webm(), declaredType: "text/html" })).rejects.toBeInstanceOf(
      ValidationError,
    );
    const big = new Uint8Array(6 * 1024 * 1024);
    big.set([0x1a, 0x45, 0xdf, 0xa3]);
    await expect(media.uploadLearnerRecording(user, { bytes: big })).rejects.toThrow(/too large/);
  });

  it("other learners cannot read a private recording; admins can", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const asset = await media.uploadLearnerRecording(owner, { bytes: webm() });
    await expect(media.openMedia(other, asset.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(media.openMedia(admin, asset.id)).resolves.toBeTruthy();
    await expect(media.deleteMedia(other, asset.id)).rejects.toBeInstanceOf(NotFoundError);
    await media.deleteMedia(owner, asset.id);
    await expect(media.openMedia(owner, asset.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("curriculum audio (pre-generated TTS)", () => {
  it("only media managers can register assets; learners get a CDN redirect", async () => {
    const user = await createTestUser();
    const admin = await createTestUser({ role: ROLES.ADMIN });
    const input = { kind: "audio", key: "a1/m1/begruessung.mp3", mime: "audio/mpeg", source: "tts", voice: "de-DE-example" };
    await expect(media.registerStaticAudio(user, input)).rejects.toBeInstanceOf(ForbiddenError);
    const asset = await media.registerStaticAudio(admin, input);
    expect(asset).toMatchObject({ visibility: "curriculum", language: "de-DE", source: "tts" });
    const res = await media.openMedia(user, asset.id);
    expect(res.redirect).toBe("/media/a1/m1/begruessung.mp3");
  });

  it("rejects path traversal keys", async () => {
    const admin = await createTestUser({ role: ROLES.ADMIN });
    await expect(
      media.registerStaticAudio(admin, { kind: "audio", key: "../../etc/passwd", mime: "audio/mpeg", source: "tts" }),
    ).rejects.toThrow();
  });
});

describe("GridFS driver", () => {
  it("round-trips bytes through Atlas-compatible GridFS", async () => {
    resetStorageDrivers();
    const storage = getStorage("gridfs");
    const body = new TextEncoder().encode("Grüß Gott – ÄÖÜß");
    await storage.put({ key: "t/1.bin", body, contentType: "application/octet-stream" });
    const file = await storage.get("t/1.bin");
    expect(new TextDecoder().decode(await readAll(file.body))).toBe("Grüß Gott – ÄÖÜß");
    expect(await storage.delete("t/1.bin")).toBe(true);
    expect(await storage.get("t/1.bin")).toBeNull();
  });
});
