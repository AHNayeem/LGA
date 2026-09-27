import { describe, expect, it } from "vitest";
import { email, localizedText, objectIdString, parseOrThrow, slug } from "@/lib/validation/common";
import { registerSchema } from "@/lib/validation/auth";
import { lessonSchema, levelSchema } from "@/lib/validation/content";
import { ValidationError } from "@/lib/errors";
import { localize } from "@/lib/i18n/locales";

describe("common validation", () => {
  it("normalises German text to NFC", () => {
    const decomposed = "München"; // u + combining diaeresis
    const parsed = localizedText().parse({ de: decomposed });
    expect(parsed.de).toBe("München");
    expect(parsed.de.length).toBe(7);
  });

  it("keeps ß, Ä, Ö, Ü and Bangla intact", () => {
    const parsed = localizedText().parse({ de: "Straße, Äpfel, Öl, Übung", bn: "শুভ সকাল" });
    expect(parsed).toEqual({ de: "Straße, Äpfel, Öl, Übung", bn: "শুভ সকাল" });
  });

  it("requires at least one language and rejects unknown locales", () => {
    expect(localizedText().safeParse({}).success).toBe(false);
    expect(localizedText().safeParse({ fr: "Bonjour" }).success).toBe(false);
    expect(localizedText({ require: ["de"] }).safeParse({ en: "Hello" }).success).toBe(false);
  });

  it("lowercases emails and rejects operator objects", () => {
    expect(email.parse("  Anna@Example.DE ")).toBe("anna@example.de");
    expect(email.safeParse({ $ne: null }).success).toBe(false);
  });

  it("validates slugs and ObjectIds", () => {
    expect(slug.safeParse("modul-1-hallo").success).toBe(true);
    expect(slug.safeParse("Modul 1").success).toBe(false);
    expect(objectIdString.safeParse("64b7f0c2a1b2c3d4e5f60718").success).toBe(true);
    expect(objectIdString.safeParse("not-an-id").success).toBe(false);
  });

  it("parseOrThrow returns field errors", () => {
    try {
      parseOrThrow(registerSchema, { name: "", email: "x", password: "short" });
      throw new Error("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(Object.keys(err.fieldErrors).sort()).toEqual(["email", "name", "password"]);
    }
  });

  it("rejects passwords over 72 bytes (bcrypt limit)", () => {
    const res = registerSchema.safeParse({ name: "A", email: "a@b.de", password: "ä".repeat(40) });
    expect(res.success).toBe(false);
  });
});

describe("content schemas", () => {
  it("level needs a German title and valid code", () => {
    expect(levelSchema.safeParse({ code: "A1", order: 1, title: { de: "A1" }, sourceType: "system" }).success).toBe(true);
    expect(levelSchema.safeParse({ code: "A3", order: 1, title: { de: "A3" }, sourceType: "system" }).success).toBe(false);
    expect(levelSchema.safeParse({ code: "A1", order: 1, title: { en: "A1" }, sourceType: "system" }).success).toBe(false);
  });

  it("lesson blocks are typed and bounded", () => {
    const base = { moduleId: "64b7f0c2a1b2c3d4e5f60718", slug: "l1", order: 1, title: { de: "Hallo" }, sourceType: "original" };
    expect(lessonSchema.safeParse({ ...base, blocks: [{ type: "listening" }] }).success).toBe(true);
    expect(lessonSchema.safeParse({ ...base, blocks: [{ type: "karaoke" }] }).success).toBe(false);
    expect(lessonSchema.safeParse({ ...base, blocks: Array(31).fill({ type: "intro" }) }).success).toBe(false);
  });
});

describe("localize", () => {
  it("falls back to English then any available locale", () => {
    expect(localize({ en: "Hello", bn: "হ্যালো" }, "bn")).toBe("হ্যালো");
    expect(localize({ en: "Hello" }, "bn")).toBe("Hello");
    expect(localize({ de: "Hallo" }, "bn")).toBe("Hallo");
    expect(localize(null)).toBe("");
  });
});
