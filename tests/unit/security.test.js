import { describe, expect, it } from "vitest";
import { generateSessionToken, hashToken, isWellFormedToken } from "@/lib/auth/tokens";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hasPermission, PERMISSIONS, ROLES } from "@/lib/auth/roles";
import { safeRedirectPath } from "@/lib/actions/result";
import { detectAudioType, declaredTypeMatches } from "@/lib/media/fileTypes";
import { toErrorResult, ValidationError } from "@/lib/errors";
import { _redact } from "@/lib/logger";
import { resolveAudioSource } from "@/lib/media/audioSource";
import { createStaticStorage } from "@/lib/storage/staticStorage";

describe("session tokens", () => {
  it("generates unique 256-bit url-safe tokens", () => {
    const a = generateSessionToken();
    expect(isWellFormedToken(a)).toBe(true);
    expect(a).not.toBe(generateSessionToken());
  });

  it("hashes deterministically and never returns the raw token", () => {
    const t = generateSessionToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t);
    expect(hashToken(t)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects malformed tokens", () => {
    expect(isWellFormedToken("abc")).toBe(false);
    expect(isWellFormedToken({ $gt: "" })).toBe(false);
  });
});

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("richtig-geheim");
    expect(await verifyPassword("richtig-geheim", hash)).toBe(true);
    expect(await verifyPassword("falsch", hash)).toBe(false);
  });

  it("returns false (after a dummy compare) when there is no hash", async () => {
    expect(await verifyPassword("anything", null)).toBe(false);
  });
});

describe("roles", () => {
  it("USER cannot manage content; ADMIN can", () => {
    const user = { role: ROLES.USER };
    const admin = { role: ROLES.ADMIN };
    for (const p of [PERMISSIONS.contentWrite, PERMISSIONS.contentReview, PERMISSIONS.contentPublish, PERMISSIONS.examConfigure]) {
      expect(hasPermission(user, p)).toBe(false);
      expect(hasPermission(admin, p)).toBe(true);
    }
    expect(hasPermission(user, PERMISSIONS.mediaUpload)).toBe(true);
    expect(hasPermission(null, PERMISSIONS.mediaUpload)).toBe(false);
    expect(hasPermission({ role: "SUPERUSER" }, PERMISSIONS.contentWrite)).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("allows relative paths only", () => {
    expect(safeRedirectPath("/admin")).toBe("/admin");
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
  });
});

describe("audio file detection", () => {
  const pad = (arr) => new Uint8Array([...arr, ...new Array(16).fill(0)]).slice(0, 16);
  it("detects formats by signature", () => {
    expect(detectAudioType(pad([0x1a, 0x45, 0xdf, 0xa3]))?.mime).toBe("audio/webm");
    expect(detectAudioType(pad([..."OggS"].map((c) => c.charCodeAt(0))))?.mime).toBe("audio/ogg");
    expect(detectAudioType(pad([0, 0, 0, 0x20, ..."ftyp".split("").map((c) => c.charCodeAt(0))]))?.mime).toBe("audio/mp4");
    expect(detectAudioType(pad([0x3c, 0x73, 0x63, 0x72]))).toBeNull(); // "<scr"
    expect(detectAudioType(new Uint8Array(4))).toBeNull();
  });

  it("rejects mismatched declared types", () => {
    const webm = detectAudioType(pad([0x1a, 0x45, 0xdf, 0xa3]));
    expect(declaredTypeMatches("audio/webm;codecs=opus", webm)).toBe(true);
    expect(declaredTypeMatches("text/html", webm)).toBe(false);
    expect(declaredTypeMatches("", webm)).toBe(true);
  });
});

describe("errors and logging", () => {
  it("hides internal error messages", () => {
    expect(toErrorResult(new Error("db password is hunter2")).message).not.toContain("hunter2");
    expect(toErrorResult(new ValidationError("Bad", { email: ["x"] }))).toMatchObject({ code: "VALIDATION", fieldErrors: { email: ["x"] } });
  });

  it("redacts secrets in log context", () => {
    expect(_redact({ password: "p", nested: { tokenHash: "t" }, ok: 1 })).toEqual({
      password: "[redacted]",
      nested: { tokenHash: "[redacted]" },
      ok: 1,
    });
  });
});

describe("audio source + static storage", () => {
  it("prefers assets; speech fallback only when allowed", () => {
    expect(resolveAudioSource({ mediaId: "abc", text: "Hallo" }).type).toBe("asset");
    expect(resolveAudioSource({ text: "Hallo", allowSpeechFallback: true })).toMatchObject({ type: "speech-synthesis", lang: "de-DE" });
    expect(resolveAudioSource({ text: "Hallo" }).type).toBe("unavailable");
  });

  it("static storage is read-only and rejects traversal", async () => {
    const s = createStaticStorage();
    expect(s.publicUrl("a1/m1/hallo.mp3")).toBe("/media/a1/m1/hallo.mp3");
    expect(() => s.publicUrl("../secrets")).toThrow();
    await expect(s.put({ key: "x", body: new Uint8Array(1) })).rejects.toThrow(/read-only/);
  });
});
