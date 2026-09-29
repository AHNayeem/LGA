import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { MODULE_1 } from "@/content/curriculum/a1/module-01/index.js";
import { exerciseSchema } from "@/lib/validation/content";
import { detectAudioType, extensionMatches } from "@/lib/media/fileTypes";
import { exerciseAudioTargets, exerciseMediaIds, requiredExerciseCues } from "@/lib/audio/cues";
import { toClientExercise } from "@/lib/exercises/engine";
import { mediaListQuerySchema, validateCurriculumAudio } from "@/lib/services/mediaService";
import { makeMp3 } from "@/tests/helpers/mp3";
import { wavBytes } from "@/tests/helpers/recordings";
import * as P from "@/components/admin/editor/payload";

// CMS Phase 2 pure pieces: file checks, the exercise → media relationship, resolution
// order in the engine, and the editor payloads.

const MEDIA = new ObjectId().toHexString();
const MEDIA2 = new ObjectId().toHexString();
const listening = MODULE_1.exercises.find((e) => e.slug === "m1-begruessung-hoeren");
const parse = (ex) => exerciseSchema.parse({ levelCode: "A1", sourceType: "original", ...ex, refs: [] });

describe("curriculum upload validation", () => {
  it("extension must name the detected format", () => {
    const mp3 = detectAudioType(makeMp3());
    const wav = detectAudioType(wavBytes());
    expect(extensionMatches("Dialog.MP3", mp3)).toBe(true);
    expect(extensionMatches("dialog.wav", mp3)).toBe(false);
    expect(extensionMatches("dialog", mp3)).toBe(false);
    expect(extensionMatches("x.mp3.wav", wav)).toBe(true);
    expect(extensionMatches("x.wav.mp3", wav)).toBe(false);
  });

  it("validates size, signature, declared type, extension and MP3 structure", () => {
    expect(validateCurriculumAudio(makeMp3({ seconds: 2 }), { declaredType: "audio/mpeg", filename: "a.mp3" })).toMatchObject({ mime: "audio/mpeg", durationSec: 2 });
    expect(() => validateCurriculumAudio(makeMp3(), { declaredType: "audio/wav", filename: "a.mp3" })).toThrow(/does not match/);
    expect(() => validateCurriculumAudio(new TextEncoder().encode("#!/bin/sh\necho pwned\n"), { filename: "a.mp3" })).toThrow(/Unsupported/);
    const truncated = makeMp3().slice(0, 100); // one frame and a bit
    expect(() => validateCurriculumAudio(truncated, { filename: "a.mp3" })).toThrow(/damaged/);
  });

  it("list filters from the URL are validated, invalid values dropped", () => {
    expect(mediaListQuerySchema.parse({ source: "learner", status: "deleted", usage: "x", q: "  bahnhof ", page: "2" })).toEqual({
      q: "bahnhof",
      source: undefined,
      status: undefined,
      usage: undefined,
      page: 2,
      pageSize: undefined,
    });
  });
});

describe("exercise → media relationship", () => {
  it("existing exercises are unchanged by the optional mediaId", () => {
    for (const ex of MODULE_1.exercises) {
      const parsed = parse(ex);
      expect(exerciseMediaIds(parsed)).toEqual([]);
    }
  });

  it("mediaId is accepted on the stimulus and item audio, and must be an id", () => {
    const withMedia = parse({ ...listening, stimulus: { ...listening.stimulus, audio: { ...listening.stimulus.audio, mediaId: MEDIA } } });
    expect(withMedia.stimulus.audio.mediaId).toBe(MEDIA);
    expect(() => parse({ ...listening, stimulus: { ...listening.stimulus, audio: { ...listening.stimulus.audio, mediaId: "../etc/passwd" } } })).toThrow();
    // A recording never replaces the cue: the lines are still required (transcript + fallback).
    expect(() => parse({ ...listening, stimulus: { ...listening.stimulus, audio: { lines: [], mediaId: MEDIA } } })).toThrow();
  });

  it("targets and required cues: an attached usable recording covers its target only", () => {
    const ex = {
      stimulus: { audio: { lines: [{ text: "Eins" }, { text: "Zwei" }], mediaId: MEDIA } },
      items: [
        { id: "q1", audio: { text: "Drei", mediaId: MEDIA2 } },
        { id: "q2", audio: { text: "Vier" } },
        { id: "q3", modelAudio: { text: "Fünf" } },
      ],
    };
    expect(exerciseAudioTargets(ex).map((t) => [t.target, t.mediaId, t.cues.length])).toEqual([
      ["stimulus", MEDIA, 2],
      ["q1", MEDIA2, 1],
      ["q2", null, 1],
    ]);
    expect(requiredExerciseCues(ex).map((c) => c.text)).toEqual(["Eins", "Zwei", "Drei", "Vier"]); // default: nothing covered
    expect(requiredExerciseCues(ex, { hasMedia: (id) => id === MEDIA }).map((c) => c.text)).toEqual(["Drei", "Vier"]);
    expect(requiredExerciseCues(ex, { hasMedia: () => true }).map((c) => c.text)).toEqual(["Vier"]);
  });
});

describe("engine: stimulus audio sources", () => {
  const ex = parse({ ...listening, stimulus: { ...listening.stimulus, audio: { ...listening.stimulus.audio, mediaId: MEDIA } } });
  const tts = (cue) => (cue.text ? { type: "asset", url: `/tts/${cue.text.length}` } : null);

  it("one recording replaces the per-line sequence when the resolver can play it", () => {
    const audio = (cue) => (cue.mediaId ? { type: "asset", url: `/api/media/${cue.mediaId}` } : tts(cue));
    expect(toClientExercise(ex, { exerciseId: "x", audio }).stimulus.audio.sources).toEqual([{ type: "asset", url: `/api/media/${MEDIA}` }]);
  });

  it("falls back to the lines when the recording is unusable, and never leaks the media id otherwise", () => {
    const client = toClientExercise(ex, { exerciseId: "x", audio: tts });
    expect(client.stimulus.audio.sources).toHaveLength(4);
    expect(JSON.stringify(client)).not.toContain(MEDIA);
  });
});

describe("editor payloads keep attached recordings", () => {
  it("stimulus and item mediaId round-trip; removing clears them", () => {
    const raw = parse({
      ...listening,
      stimulus: { ...listening.stimulus, audio: { ...listening.stimulus.audio, mediaId: MEDIA } },
      items: listening.items.map((i, n) => (n === 0 ? { ...i, audio: { text: "Frage eins", mediaId: MEDIA2 } } : i)),
    });
    const state = P.exerciseState(raw);
    expect(state.stimulus.mediaId).toBe(MEDIA);
    expect(state.items[0].audio.mediaId).toBe(MEDIA2);
    expect(parse(P.exercisePayload(state))).toEqual(raw);

    const cleared = { ...state, stimulus: { ...state.stimulus, mediaId: "" }, items: state.items.map((i, n) => (n === 0 ? { ...i, audio: { ...i.audio, mediaId: "" } } : i)) };
    const payload = P.exercisePayload(cleared);
    expect(payload.stimulus.audio).not.toHaveProperty("mediaId");
    expect(payload.items[0].audio).toEqual({ text: "Frage eins", voice: "female", rate: "slow" });
  });
});
