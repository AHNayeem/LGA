import { describe, expect, it } from "vitest";
import { checkSameOrigin } from "@/lib/security/origin";
import { readBodyWithLimit } from "@/lib/http/readBody";
import { PayloadTooLargeError } from "@/lib/errors";
import { pickRecorderMimeType, RECORDER_MIME_CANDIDATES } from "@/lib/media/recording";
import { speakPrompt, speakRecordingId } from "@/lib/exercises/types/speakPrompt";
import { gradeExercise } from "@/lib/exercises/engine";
import { isNonProductionDatabaseName, assertNonProductionDatabase } from "@/lib/config/databaseGuard";

const h = (o) => new Headers(o);

describe("same-origin check for cookie-authenticated route handlers", () => {
  const appUrl = "https://lga.example";
  it("accepts the app origin and the addressed host", () => {
    expect(checkSameOrigin(h({ origin: "https://lga.example" }), { appUrl }).ok).toBe(true);
    expect(checkSameOrigin(h({ origin: "https://preview.vercel.app", "x-forwarded-host": "preview.vercel.app", "x-forwarded-proto": "https" }), { appUrl }).ok).toBe(true);
    expect(checkSameOrigin(h({ origin: "http://localhost:3100", host: "localhost:3100", "sec-fetch-site": "same-origin" }), { appUrl }).ok).toBe(true);
  });
  it("rejects missing, opaque, foreign and cross-site requests", () => {
    expect(checkSameOrigin(h({}), { appUrl })).toEqual({ ok: false, reason: "missing-origin" });
    expect(checkSameOrigin(h({ origin: "null" }), { appUrl }).ok).toBe(false);
    expect(checkSameOrigin(h({ origin: "https://evil.example", host: "lga.example" }), { appUrl }).reason).toBe("origin-mismatch");
    expect(checkSameOrigin(h({ origin: "https://lga.example.evil.example" }), { appUrl }).ok).toBe(false);
    expect(checkSameOrigin(h({ origin: "http://lga.example" }), { appUrl }).ok).toBe(false); // scheme matters
    expect(checkSameOrigin(h({ origin: "https://lga.example", "sec-fetch-site": "cross-site" }), { appUrl }).reason).toBe("cross-site");
    expect(checkSameOrigin(h({ origin: "https://lga.example", "sec-fetch-site": "same-site" }), { appUrl }).ok).toBe(false);
  });
});

describe("bounded body reader", () => {
  const req = (body, headers = {}) => new Request("http://x/", { method: "POST", body, headers, duplex: "half" });
  it("returns the bytes under the limit", async () => {
    expect(await readBodyWithLimit(req(new Uint8Array([1, 2, 3])), 3)).toEqual(new Uint8Array([1, 2, 3]));
  });
  it("rejects by Content-Length before reading and by counting while streaming", async () => {
    await expect(readBodyWithLimit(req(new Uint8Array(1), { "content-length": "100" }), 10)).rejects.toBeInstanceOf(PayloadTooLargeError);
    await expect(readBodyWithLimit(req(new Uint8Array(1), { "content-length": "abc" }), 10)).rejects.toThrow(/Content-Length/);
    let pulled = 0;
    const endless = new ReadableStream({
      pull(c) {
        pulled++;
        c.enqueue(new Uint8Array(1024));
      },
    });
    await expect(readBodyWithLimit(req(endless), 4096)).rejects.toBeInstanceOf(PayloadTooLargeError);
    expect(pulled).toBeLessThan(10); // stopped early, didn't buffer everything
  });
});

describe("recorder format choice", () => {
  it("prefers Opus/WebM, falls back to MP4 (Safari), and reports no support", () => {
    expect(pickRecorderMimeType(() => true)).toBe(RECORDER_MIME_CANDIDATES[0]);
    expect(pickRecorderMimeType((t) => t === "audio/mp4")).toBe("audio/mp4");
    expect(pickRecorderMimeType(() => false)).toBeNull();
    expect(pickRecorderMimeType(undefined)).toBeNull();
  });
});

describe("speak_prompt answers", () => {
  const item = { id: "q1", type: "speak_prompt", modelAnswer: { de: "Hallo!" } };
  const exercise = { _id: "e1", skill: "speaking", items: [item] };
  it("accepts the Phase 2 string and the recording object", () => {
    expect(speakPrompt.answerSchema.parse("confident")).toEqual({ selfRating: "confident" });
    expect(speakPrompt.answerSchema.parse({ selfRating: "unsure", recordingId: "0123456789abcdef01234567" })).toEqual({
      selfRating: "unsure",
      recordingId: "0123456789abcdef01234567",
    });
    expect(speakPrompt.answerSchema.safeParse({ selfRating: "unsure", recordingId: "x" }).success).toBe(false);
    expect(speakPrompt.answerSchema.safeParse({ selfRating: "unsure", score: 1 }).success).toBe(false); // strict
    expect(speakRecordingId({ selfRating: "confident", recordingId: "0123456789abcdef01234567" })).toBe("0123456789abcdef01234567");
    expect(speakRecordingId("confident")).toBeNull();
  });
  it("is never scored, with or without a recording", () => {
    for (const answer of ["confident", { selfRating: "not_yet", recordingId: "0123456789abcdef01234567" }]) {
      const r = gradeExercise(exercise, { q1: answer });
      expect(r).toMatchObject({ score: 0, maxScore: 0, graded: false, ratio: null, passed: true });
      expect(r.items[0]).toEqual({ itemId: "q1", answered: true, correct: null, score: 0, maxScore: 0, selfRating: typeof answer === "string" ? answer : answer.selfRating });
    }
  });
});

describe("non-production database guard", () => {
  it("accepts only names that mark a dev/test database", () => {
    for (const n of ["lga_dev", "lga-test", "e2e", "test_ab12cd34", "lga_itest_x_1", "lga_e2e_abc", "staging"]) expect(isNonProductionDatabaseName(n), n).toBe(true);
    for (const n of ["lga", "production", "lga_prod", "devotion", "latest", undefined]) expect(isNonProductionDatabaseName(n), n).toBe(false);
    expect(() => assertNonProductionDatabase("lga", "do things")).toThrow(/Refusing/);
  });
});
