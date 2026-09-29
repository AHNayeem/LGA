import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGoogleTtsProvider, DEFAULT_GOOGLE_VOICES } from "@/lib/audio/providers/google";
import { generateAudio, memoryRegistry } from "@/lib/audio/generate";
import { runSmokeTest, smokeSamples, SMOKE_TEXTS } from "@/lib/audio/smoke";
import { cueHash, normalizeCue, VOICE_ROLES } from "@/lib/audio/cues";
import { APPROVAL_BASIS, initialLifecycle, reviewTransitionPatch, editPatch } from "@/lib/content/lifecycle";
import { resolveAtlasUri } from "@/scripts/lib/atlas.mjs";
import { makeMp3 } from "@/tests/helpers/mp3";

// The published de-DE catalogue (subset) as returned by voices.list.
const CATALOGUE = [
  { name: "de-DE-Neural2-C", languageCodes: ["de-DE"], ssmlGender: "FEMALE" },
  { name: "de-DE-Neural2-E", languageCodes: ["de-DE"], ssmlGender: "MALE" },
  { name: "de-DE-Neural2-F", languageCodes: ["de-DE"], ssmlGender: "FEMALE" },
  { name: "de-DE-Wavenet-E", languageCodes: ["de-DE"], ssmlGender: "MALE" },
  { name: "de-DE-Chirp3-HD-Charon", languageCodes: ["de-DE"], ssmlGender: "MALE" },
];

// Fake Google API: voices.list + text:synthesize returning a valid MP3.
function fakeGoogle({ catalogue = CATALOGUE, audio = () => makeMp3({ seconds: 1.5 }) } = {}) {
  const calls = [];
  let n = 0;
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes("/voices?")) return { ok: true, json: async () => ({ voices: catalogue }) };
    const mp3 = audio(++n);
    return { ok: true, json: async () => ({ audioContent: Buffer.from(mp3).toString("base64") }) };
  };
  return { fetchImpl, calls };
}

describe("google voice verification", () => {
  it("accepts the default voices against the published catalogue", async () => {
    const { fetchImpl, calls } = fakeGoogle();
    const p = createGoogleTtsProvider({ apiKey: "the-key", fetchImpl });
    const r = await p.verifyVoices("de-DE");
    expect(r).toMatchObject({ ok: true, problems: [] });
    expect(calls[0].url).toBe("https://texttospeech.googleapis.com/v1/voices?languageCode=de-DE");
    expect(calls[0].init.headers["X-Goog-Api-Key"]).toBe("the-key");
    expect(Object.keys(DEFAULT_GOOGLE_VOICES).sort()).toEqual([...VOICE_ROLES].sort());
  });

  it("rejects missing voices, wrong genders and Chirp3-HD (no speakingRate)", async () => {
    const { fetchImpl } = fakeGoogle();
    const p = createGoogleTtsProvider({
      apiKey: "k",
      fetchImpl,
      voices: { female: "de-DE-Wavenet-B", male: "de-DE-Neural2-F", male2: "de-DE-Chirp3-HD-Charon" },
    });
    const r = await p.verifyVoices("de-DE");
    expect(r.ok).toBe(false);
    const text = r.problems.join("\n");
    expect(text).toMatch(/female: voice "de-DE-Wavenet-B" is not offered/);
    expect(text).toMatch(/male: "de-DE-Neural2-F" is FEMALE, expected MALE/);
    expect(text).toMatch(/Chirp3-HD voice, which does not support speakingRate/);
  });

  it("does not leak the key in errors", async () => {
    const p = createGoogleTtsProvider({ apiKey: "super-secret", fetchImpl: async () => ({ ok: false, status: 400, text: async () => "API key not valid" }) });
    const err = await p.listVoices().catch((e) => e);
    expect(err.message).toMatch(/400/);
    expect(err.message).not.toContain("super-secret");
  });
});

describe("generation output validation", () => {
  it("never stores an invalid MP3 and records duration and rate for valid ones", async () => {
    const cues = new Map([normalizeCue({ text: "Hallo!" }), normalizeCue({ text: "Tschüs!" })].map((c) => [cueHash(c), c]));
    const { fetchImpl } = fakeGoogle({ audio: (n) => (n === 1 ? new TextEncoder().encode("<html>oops</html>") : makeMp3({ seconds: 1.2 })) });
    const provider = createGoogleTtsProvider({ apiKey: "k", fetchImpl });
    const written = [];
    const registry = memoryRegistry();
    const sink = { write: async (w) => (written.push(w.key), { driver: "static", key: w.key }) };
    const stats = await generateAudio({ cues, provider, sink, registry });
    expect(stats.generated).toBe(1);
    expect(stats.failed[0].error).toMatch(/invalid MP3/);
    expect(written).toHaveLength(1);
    const [entry] = registry.entries.values();
    expect(entry).toMatchObject({ provider: "google", providerVoice: "de-DE-Neural2-F", speakingRate: 0.85, mime: "audio/mpeg" });
    expect(entry.durationSec).toBeCloseTo(1.2, 2);
  });
});

describe("TTS smoke test", () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "lga-smoke-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("covers every voice, both rates, spelling, numbers and umlauts", () => {
    const s = smokeSamples();
    expect(new Set(s.map((x) => x.cue.voice))).toEqual(new Set(VOICE_ROLES));
    expect(new Set(s.map((x) => x.cue.rate))).toEqual(new Set(["slow", "normal"]));
    expect(new Set(s.map((x) => x.topic))).toEqual(new Set(["umlauts", "spelling", "numbers", "email", "mixed"]));
    expect(SMOKE_TEXTS.umlauts).toMatch(/[äöüß]/);
    expect(SMOKE_TEXTS.spelling).toMatch(/B, R, A, N, D, T/);
    expect(SMOKE_TEXTS.numbers).toMatch(/\d{4} \d{2}/);
  });

  it("runs the production pipeline into a scratch dir and writes a listening index", async () => {
    const { fetchImpl, calls } = fakeGoogle();
    const res = await runSmokeTest({ provider: createGoogleTtsProvider({ apiKey: "the-key", fetchImpl }), outDir: dir });
    expect(res.problems).toEqual([]);
    expect(res.ok).toBe(true);
    expect(res.samples).toHaveLength(20);
    expect(res.samples.every((s) => s.ok && s.durationSec > 1 && s.file.startsWith("listen/"))).toBe(true);
    expect(calls.filter((c) => c.url.endsWith("text:synthesize"))).toHaveLength(20); // the re-run generated nothing
    expect(existsSync(join(dir, "LISTEN.txt"))).toBe(true);
    const raw = readFileSync(join(dir, "samples.json"), "utf8");
    expect(JSON.parse(raw).samples[0]).toMatchObject({ voiceRole: "female", rate: "slow", providerVoice: "de-DE-Neural2-F" });
    expect(raw).not.toContain("the-key");
  });

  it("stops at the voice check when a voice is unavailable, and flags invalid audio", async () => {
    const bad = fakeGoogle({ catalogue: CATALOGUE.filter((v) => v.name !== "de-DE-Wavenet-E") });
    const r1 = await runSmokeTest({ provider: createGoogleTtsProvider({ apiKey: "k", fetchImpl: bad.fetchImpl }), outDir: dir });
    expect(r1).toMatchObject({ ok: false, stage: "voices" });
    expect(bad.calls.some((c) => c.url.endsWith("text:synthesize"))).toBe(false);

    const tiny = fakeGoogle({ audio: () => makeMp3({ seconds: 0.1 }) });
    const r2 = await runSmokeTest({ provider: createGoogleTtsProvider({ apiKey: "k", fetchImpl: tiny.fetchImpl }), outDir: dir });
    expect(r2.ok).toBe(false);
    expect(r2.problems[0]).toMatch(/invalid audio/);
  });
});

describe("approval basis", () => {
  const actor = "0123456789abcdef01234567";
  it("defaults to human review, can be marked as a test fixture, and is cleared on draft/edit", () => {
    const doc = { ...initialLifecycle({ sourceType: "ai_generated" }), reviewStatus: "reviewed" };
    expect(doc.approvalBasis).toBeNull();
    expect(reviewTransitionPatch(doc, "approved", actor).approvalBasis).toBe(APPROVAL_BASIS.humanReview);
    const fixture = reviewTransitionPatch(doc, "approved", actor, new Date(), { approvalBasis: APPROVAL_BASIS.testFixture });
    expect(fixture.approvalBasis).toBe("test_fixture");
    expect(() => reviewTransitionPatch(doc, "approved", actor, new Date(), { approvalBasis: "native_speaker" })).toThrow(/Unknown approval basis/);
    const approved = { ...doc, ...fixture };
    expect(reviewTransitionPatch(approved, "draft", actor).approvalBasis).toBeNull();
    expect(editPatch(approved, { title: { de: "x" } }, actor).approvalBasis).toBeNull();
  });
});

describe("Atlas test commands", () => {
  const saved = { ...process.env };
  afterEach(() => {
    for (const k of ["ATLAS_TEST_URI", "MONGODB_URI", "ATLAS_ALLOW_NON_ATLAS"]) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("fail clearly without an explicit URI and never accept a local/in-memory server silently", () => {
    delete process.env.ATLAS_TEST_URI;
    delete process.env.MONGODB_URI;
    expect(() => resolveAtlasUri()).toThrow(/No MongoDB Atlas URI configured/);
    process.env.MONGODB_URI = "mongodb://127.0.0.1:53211/";
    expect(() => resolveAtlasUri()).toThrow(/does not point to MongoDB Atlas/);
    process.env.ATLAS_TEST_URI = "mongodb+srv://u:p@cluster0.abcde.mongodb.net/?retryWrites=true";
    expect(resolveAtlasUri()).toMatchObject({ source: "ATLAS_TEST_URI", host: "cluster0.abcde.mongodb.net" });
  });
});
