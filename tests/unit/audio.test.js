import { describe, expect, it } from "vitest";
import { cueHash, exerciseCues, normalizeCue, requiredExerciseCues, uniqueCues, vocabularyCues } from "@/lib/audio/cues";
import { generateAudio, memoryRegistry, storageSink } from "@/lib/audio/generate";
import { createFakeTtsProvider } from "@/lib/audio/providers/fake";
import { createGoogleTtsProvider } from "@/lib/audio/providers/google";
import { createTtsProvider } from "@/lib/audio/providers";
import { createMemoryStorage } from "@/lib/storage/memoryStorage";
import { resolveAudioSource } from "@/lib/media/audioSource";

describe("audio cues", () => {
  it("hash depends on text, voice and rate, and is Unicode-stable", () => {
    const base = cueHash({ text: "Guten Tag!", voice: "female", rate: "slow" });
    expect(cueHash({ text: " Guten Tag! ", voice: "female", rate: "slow" })).toBe(base);
    expect(cueHash({ text: "Güten Tag!" })).toBe(cueHash({ text: "Güten Tag!" }));
    expect(cueHash({ text: "Guten Tag!", voice: "male", rate: "slow" })).not.toBe(base);
    expect(cueHash({ text: "Guten Tag!", voice: "female", rate: "normal" })).not.toBe(base);
    expect(cueHash({ text: "Guten Abend!", voice: "female", rate: "slow" })).not.toBe(base);
  });

  it("collects stimulus, item and model-answer cues; only listening audio is required", () => {
    const ex = {
      stimulus: { audio: { lines: [{ text: "Hallo!", voice: "male" }, { text: "Hi!" }] } },
      items: [{ audio: { text: "zwölf" } }, { modelAudio: { text: "Ich heiße Lena." } }, {}],
    };
    expect(exerciseCues(ex).map((c) => c.text)).toEqual(["Hallo!", "Hi!", "zwölf", "Ich heiße Lena."]);
    expect(requiredExerciseCues(ex).map((c) => c.text)).toEqual(["Hallo!", "Hi!", "zwölf"]);
  });

  it("vocabulary audio uses the article form", () => {
    const cues = vocabularyCues({ lemma: "Sprache", article: "die", example: { de: "Ich spreche zwei Sprachen." } });
    expect(cues.map((c) => c.text)).toEqual(["die Sprache", "Ich spreche zwei Sprachen."]);
  });
});

describe("generation pipeline", () => {
  const cues = uniqueCues([
    normalizeCue({ text: "eins" }),
    normalizeCue({ text: "zwei" }),
    normalizeCue({ text: "eins" }), // duplicate collapses
  ]);

  it("generates each missing cue once and is idempotent", async () => {
    const provider = createFakeTtsProvider();
    const storage = createMemoryStorage();
    const registry = memoryRegistry();
    const first = await generateAudio({ cues, provider, sink: storageSink(storage), registry });
    expect(first).toMatchObject({ total: 2, generated: 2, skipped: 0, failed: [] });
    const second = await generateAudio({ cues, provider, sink: storageSink(storage), registry });
    expect(second).toMatchObject({ generated: 0, skipped: 2 });
    expect(provider.calls).toHaveLength(2);

    const [entry] = registry.entries.values();
    expect(entry).toMatchObject({ driver: "memory", mime: "audio/wav", provider: "fake" });
    expect(entry.key).toMatch(/^tts\/[0-9a-f]{32}\.wav$/);
    const file = await storage.get(entry.key);
    expect(Buffer.from(file.body.slice(0, 4)).toString()).toBe("RIFF");
  });

  it("dry run reports missing cues without calling the provider", async () => {
    const provider = createFakeTtsProvider();
    const stats = await generateAudio({ cues, provider, sink: storageSink(createMemoryStorage()), registry: memoryRegistry(), dryRun: true });
    expect(stats).toMatchObject({ missing: 2, generated: 0 });
    expect(provider.calls).toHaveLength(0);
  });

  it("records provider failures without aborting the run", async () => {
    const provider = {
      name: "flaky",
      async synthesize(cue) {
        if (cue.text === "eins") throw new Error("quota");
        return createFakeTtsProvider().synthesize(cue);
      },
    };
    const stats = await generateAudio({ cues, provider, sink: storageSink(createMemoryStorage()), registry: memoryRegistry() });
    expect(stats.generated).toBe(1);
    expect(stats.failed).toEqual([expect.objectContaining({ text: "eins", error: "quota" })]);
  });
});

describe("TTS providers", () => {
  it("google provider needs a key and sends it as a header, not in the URL", async () => {
    expect(() => createGoogleTtsProvider({})).toThrow(/GOOGLE_TTS_API_KEY/);
    let seen;
    const fetchImpl = async (url, init) => {
      seen = { url, init };
      return { ok: true, json: async () => ({ audioContent: Buffer.from("ID3fake").toString("base64") }) };
    };
    const p = createGoogleTtsProvider({ apiKey: "secret-key", fetchImpl });
    const out = await p.synthesize({ text: "Hallo", voice: "male", rate: "slow", lang: "de-DE" });
    expect(seen.url).not.toContain("secret-key");
    expect(seen.init.headers["X-Goog-Api-Key"]).toBe("secret-key");
    const body = JSON.parse(seen.init.body);
    // Defaults come from Google's current de-DE list (Wavenet-B/-D are no longer offered).
    expect(body.voice).toEqual({ languageCode: "de-DE", name: "de-DE-Neural2-E" });
    expect(body.audioConfig).toEqual({ audioEncoding: "MP3", speakingRate: 0.85 });
    expect(body.audioConfig.speakingRate).toBeLessThan(1);
    expect(out).toMatchObject({ mime: "audio/mpeg", ext: "mp3" });
  });

  it("surfaces provider HTTP errors", async () => {
    const p = createGoogleTtsProvider({ apiKey: "k", fetchImpl: async () => ({ ok: false, status: 403, text: async () => "denied" }) });
    await expect(p.synthesize({ text: "x", voice: "female", rate: "slow" })).rejects.toThrow(/403/);
  });

  it("rejects unknown providers", () => {
    expect(() => createTtsProvider("magic")).toThrow(/Unknown TTS provider/);
  });
});

describe("runtime audio source", () => {
  it("never synthesises in production; dev may fall back to the browser voice", () => {
    expect(resolveAudioSource({ mediaId: "abc" })).toMatchObject({ type: "asset", url: "/api/media/abc" });
    expect(resolveAudioSource({ text: "Hallo", allowSpeechFallback: false })).toEqual({ type: "unavailable" });
    expect(resolveAudioSource({ text: "Hallo", allowSpeechFallback: true })).toMatchObject({ type: "speech-synthesis" });
  });
});
