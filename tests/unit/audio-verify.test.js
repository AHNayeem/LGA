import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cueHash, curriculumCues } from "@/lib/audio/cues";
import { expectedStaticKey } from "@/lib/audio/manifest";
import { verifyAudio } from "@/lib/audio/verify";
import { fileManifestRegistry } from "@/lib/audio/fileStore";
import { makeMp3 } from "@/tests/helpers/mp3";
import { AUDIO_CONTENT } from "@/content/audioContent.js";

// A tiny curriculum: one listening exercise in a module test, one word.
const DEFS = [
  {
    exercises: [
      {
        slug: "t-hoeren",
        skill: "listening",
        stimulus: { audio: { lines: [{ text: "Guten Tag!", voice: "female", rate: "slow" }, { text: "Hallo, Herr Öztürk.", voice: "male", rate: "slow" }] } },
        items: [{ id: "q1", type: "true_false", audio: { text: "Grüß Gott.", voice: "female2", rate: "normal" }, answer: true }],
      },
    ],
    vocabulary: [{ lemma: "Straße", article: "die", example: { de: "Die Straße ist lang." } }],
    lessons: [{ slug: "modultest", blocks: [{ type: "mini_test", key: "hoeren", exercise: "t-hoeren" }] }],
  },
];

let dir;
let mediaDir;
let manifestPath;

function entryFor(hash, cue, bytes) {
  return { hash, driver: "static", key: expectedStaticKey(hash), mime: "audio/mpeg", size: bytes.length, text: cue.text, voiceRole: cue.voice, rate: cue.rate, lang: cue.lang, provider: "google", providerVoice: "de-DE-Neural2-F" };
}

// Writes a complete, valid audio set for DEFS and returns the manifest entries.
function writeValidSet() {
  const entries = [];
  let marker = 0;
  for (const [hash, cue] of curriculumCues(DEFS)) {
    const bytes = makeMp3({ seconds: 1 + cue.text.length * 0.05, marker: ++marker });
    mkdirSync(join(mediaDir, "tts"), { recursive: true });
    writeFileSync(join(mediaDir, expectedStaticKey(hash)), bytes);
    entries.push(entryFor(hash, cue, bytes));
  }
  writeManifest(entries);
  return entries;
}
const writeManifest = (entries) => writeFileSync(manifestPath, JSON.stringify({ version: 1, entries }));
const run = (opts = {}) => verifyAudio({ moduleDefs: DEFS, manifestPath, mediaDir, ...opts });

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "lga-audio-"));
  mediaDir = join(dir, "media");
  manifestPath = join(dir, "manifest.json");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("audio:verify", () => {
  it("accepts a complete, consistent set and reports the module-test listening audio", () => {
    writeValidSet();
    const r = run();
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.summary).toMatchObject({ neededClips: 5, manifestEntries: 5, filesOnDisk: 5, validClips: 5, listeningExercises: 1, sampleRates: [24000] });
    expect(r.summary.moduleTestListening).toEqual([{ exercise: "t-hoeren", moduleTest: true, required: 3, missing: 0 }]);
  });

  it("fails without a manifest, and on an unparseable one", () => {
    expect(run().errors[0]).toMatch(/Manifest not found/);
    writeFileSync(manifestPath, "{not json");
    expect(run().errors[0]).toMatch(/not valid JSON/);
  });

  it("detects missing clips and names the listening exercise", () => {
    const entries = writeValidSet();
    const listening = cueHash({ text: "Hallo, Herr Öztürk.", voice: "male", rate: "slow" });
    writeManifest(entries.filter((e) => e.hash !== listening));
    const r = run();
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes(`Missing clip ${listening}`))).toBe(true);
    expect(r.errors.some((e) => e.includes("Module test exercise t-hoeren: 1 of 3"))).toBe(true);
    expect(r.errors.some((e) => e.includes("not in the manifest (orphan file)"))).toBe(true);
  });

  it("detects files missing on disk, empty files and corrupt MP3s", () => {
    const [a, b, c] = writeValidSet();
    unlinkSync(join(mediaDir, a.key));
    writeFileSync(join(mediaDir, b.key), new Uint8Array(0));
    writeFileSync(join(mediaDir, c.key), new TextEncoder().encode("<html>error page</html>".repeat(10)));
    const r = run();
    expect(r.errors.some((e) => e.startsWith(`${a.hash}: file`) && e.endsWith("is missing."))).toBe(true);
    expect(r.errors.some((e) => e.startsWith(`${b.hash}:`) && e.includes("is empty"))).toBe(true);
    expect(r.errors.some((e) => e.startsWith(`${c.hash}:`) && e.includes("not a valid MP3"))).toBe(true);
  });

  it("detects orphaned manifest entries (error unless allowed) and orphan files", () => {
    const entries = writeValidSet();
    const cue = { text: "Nicht mehr benutzt.", voice: "female", rate: "slow", lang: "de-DE" };
    const hash = cueHash(cue);
    const bytes = makeMp3({ marker: 99 });
    writeFileSync(join(mediaDir, expectedStaticKey(hash)), bytes);
    writeManifest([...entries, entryFor(hash, cue, bytes)]);
    expect(run().errors.some((e) => e.includes(`Manifest entry ${hash} is not used`))).toBe(true);
    expect(run({ allowOrphans: true }).ok).toBe(true);

    writeFileSync(join(mediaDir, "tts", "stray.mp3"), makeMp3());
    expect(run({ allowOrphans: true }).errors).toEqual(["File public/media/tts/stray.mp3 is not in the manifest (orphan file)."]);
  });

  it("detects hash/text mismatches, wrong file names, sizes and non-production entries", () => {
    const [a, b, c, d, e] = writeValidSet();
    writeManifest([{ ...a, text: "Guten Abend!" }, { ...b, key: "tts/renamed.mp3" }, { ...c, size: 1 }, { ...d, provider: "fake" }, { ...e, driver: "gridfs", mime: "audio/wav" }]);
    const errors = run().errors.join("\n");
    expect(errors).toContain(`${a.hash}: hash does not match its text/voice/rate`);
    expect(errors).toContain(`${b.hash}: file name tts/renamed.mp3 does not match the hash`);
    expect(errors).toContain(`${c.hash}: size`);
    expect(errors).toContain(`${d.hash}: generated by the fake (silent) provider`);
    expect(errors).toContain(`${e.hash}: driver "gridfs"`);
    expect(errors).toContain(`${e.hash}: mime "audio/wav"`);
  });

  it("detects duplicate entries and byte-identical clips", () => {
    const entries = writeValidSet();
    writeManifest([...entries, entries[0]]);
    expect(run().errors).toContain(`Duplicate manifest entry for hash ${entries[0].hash}.`);
    writeManifest(entries);
    writeFileSync(join(mediaDir, entries[1].key), readFileSync(join(mediaDir, entries[0].key)));
    const r = run();
    expect(r.warnings.some((w) => w.includes("byte-identical"))).toBe(true);
  });

  it("flags implausibly short clips", () => {
    const [a] = writeValidSet();
    const tiny = makeMp3({ seconds: 0.048 });
    writeFileSync(join(mediaDir, a.key), tiny);
    writeManifest([{ ...a, size: tiny.length }, ...JSON.parse(readFileSync(manifestPath, "utf8")).entries.slice(1)]);
    expect(run().errors.some((e) => e.startsWith(`${a.hash}: only 0.05 s long`))).toBe(true);
  });

  it("the committed Module 1 audio state is reported, never silently valid", () => {
    // Real audio has not been generated in this repository state: the check must fail
    // clearly (it turns green once `bun run audio:generate` has produced every clip).
    const r = verifyAudio({ moduleDefs: AUDIO_CONTENT, manifestPath: "content/audio/manifest.json", mediaDir: "public/media" });
    expect(r.summary.neededClips).toBe(curriculumCues(AUDIO_CONTENT).size);
    if (r.summary.validClips < r.summary.neededClips) expect(r.ok).toBe(false);
  });
});

describe("audio generation --prune", () => {
  it("removes entries and files no content needs", () => {
    const entries = writeValidSet();
    const registry = fileManifestRegistry({ manifestPath, mediaDir });
    const keep = new Set(entries.slice(1).map((e) => e.hash));
    expect(registry.prune(keep)).toEqual([entries[0].hash]);
    registry.save();
    expect(JSON.parse(readFileSync(manifestPath, "utf8")).entries).toHaveLength(entries.length - 1);
    expect(() => readFileSync(join(mediaDir, entries[0].key))).toThrow();
  });
});
