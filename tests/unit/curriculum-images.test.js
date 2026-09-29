import { describe, expect, it } from "vitest";
import { makeGif, makeJpeg, makePng, makeWebp, SVG } from "@/tests/helpers/images";
import { makeMp3 } from "@/tests/helpers/mp3";
import { wavBytes } from "@/tests/helpers/recordings";
import { detectImageType, readImageDimensions } from "@/lib/media/imageInfo";
import { detectAudioType } from "@/lib/media/fileTypes";
import { contentImageIds, contentImageRefs } from "@/lib/media/imageRefs";
import { validateCurriculumImage, validateCurriculumUpload } from "@/lib/services/mediaService";
import { exerciseSchema, lessonSchema, vocabularySchema } from "@/lib/validation/content";
import { toClientExercise } from "@/lib/exercises/engine";
import { imagePayload, imageState, lessonPayload, lessonState, stimulusPayload, stimulusState, vocabularyPayload, vocabularyState } from "@/components/admin/editor/payload";

// CMS Phase 5: image detection, header parsing, validation order, schemas and editor
// payloads. No database.

const ID = "65f000000000000000000001";

describe("image detection and dimensions", () => {
  it("detects PNG, JPEG, WebP and GIF by signature and reads their dimensions", () => {
    const cases = [
      [makePng({ width: 4, height: 3 }), "image/png", { width: 4, height: 3 }],
      [makeJpeg({ width: 640, height: 480 }), "image/jpeg", { width: 640, height: 480 }],
      [makeWebp({ width: 320, height: 200 }), "image/webp", { width: 320, height: 200 }],
      [makeGif(), "image/gif", { width: 1, height: 1 }],
    ];
    for (const [bytes, mime, dims] of cases) {
      const detected = detectImageType(bytes);
      expect(detected?.mime).toBe(mime);
      expect(readImageDimensions(bytes, detected)).toEqual(dims);
    }
  });

  it("never mistakes audio for an image or the other way round (RIFF: WAVE vs. WEBP)", () => {
    expect(detectImageType(wavBytes())).toBeNull();
    expect(detectImageType(makeMp3())).toBeNull();
    expect(detectAudioType(makeWebp())).toBeNull();
    expect(detectAudioType(makePng())).toBeNull();
    expect(detectImageType(SVG)).toBeNull();
  });

  it("rejects damaged structure: truncated PNG, JPEG without a frame header, GIF without trailer", () => {
    expect(readImageDimensions(makePng({ headerOnly: true }), detectImageType(makePng()))).toBeNull();
    const noSof = makeJpeg({ sof: false });
    expect(readImageDimensions(noSof, detectImageType(noSof))).toBeNull();
    const gif = makeGif().slice(0, -1);
    expect(readImageDimensions(gif, detectImageType(gif))).toBeNull();
  });
});

describe("image validation", () => {
  it("checks signature, declared type, extension, structure and dimensions; never trusts the client type", () => {
    expect(validateCurriculumImage(makePng(), { declaredType: "image/png", filename: "schild.png" })).toMatchObject({ kind: "image", mime: "image/png", width: 4, height: 3 });
    expect(validateCurriculumImage(makeJpeg(), { declaredType: "", filename: "foto.JPEG" }).mime).toBe("image/jpeg");
    expect(() => validateCurriculumImage(makePng(), { declaredType: "image/jpeg", filename: "a.png" })).toThrow(/does not match/);
    expect(() => validateCurriculumImage(makePng(), { declaredType: "image/png", filename: "a.jpg" })).toThrow(/must end in \.png/);
    expect(() => validateCurriculumImage(makePng(), { filename: "noextension" })).toThrow(/must end in/);
    expect(() => validateCurriculumImage(makePng({ headerOnly: true }), { filename: "a.png" })).toThrow(/damaged or incomplete/);
    expect(() => validateCurriculumImage(makePng({ claim: { width: 9000, height: 10 } }), { filename: "a.png" })).toThrow(/at most 8000 px/);
    expect(() => validateCurriculumImage(makePng({ claim: { width: 7000, height: 7000 } }), { filename: "a.png" })).toThrow(/at most 8000 px/);
    expect(() => validateCurriculumImage(new Uint8Array(), { filename: "a.png" })).toThrow(/empty/);
  });

  it("dispatches on the bytes: images, audio, and neither (SVG, HTML) with one message", () => {
    expect(validateCurriculumUpload(makeGif(), { filename: "a.gif" }).kind).toBe("image");
    expect(validateCurriculumUpload(makeMp3(), { filename: "a.mp3" }).kind).toBe("audio");
    expect(() => validateCurriculumUpload(SVG, { declaredType: "image/svg+xml", filename: "a.svg" })).toThrow(/Unsupported file.*PNG, JPEG, WebP or GIF/);
    expect(() => validateCurriculumUpload(new TextEncoder().encode("<html><script>x</script></html>"), { filename: "a.png" })).toThrow(/Unsupported file/);
    // An image posing as audio (or the reverse) fails the declared-type check.
    expect(() => validateCurriculumUpload(makePng(), { declaredType: "audio/mpeg", filename: "a.png" })).toThrow(/does not match/);
  });
});

describe("content schemas", () => {
  const vocab = { levelCode: "A1", slug: "apfel", lemma: "Apfel", article: "der", pos: "noun", meanings: { en: "apple" }, sourceType: "original" };

  it("an attached image needs a valid id and alt text in at least one language", () => {
    expect(vocabularySchema.safeParse({ ...vocab, image: { mediaId: ID, alt: { en: "A red apple" } } }).success).toBe(true);
    const noAlt = vocabularySchema.safeParse({ ...vocab, image: { mediaId: ID, alt: {} } });
    expect(noAlt.success).toBe(false);
    expect(noAlt.error.issues[0].path).toEqual(["image", "alt"]);
    expect(vocabularySchema.safeParse({ ...vocab, image: { mediaId: ID } }).success).toBe(false);
    expect(vocabularySchema.safeParse({ ...vocab, image: { mediaId: "x", alt: { en: "a" } } }).success).toBe(false);
    expect(vocabularySchema.safeParse({ ...vocab, image: { mediaId: ID, alt: { en: "a".repeat(251) } } }).success).toBe(false);
  });

  it("images on intro blocks and stimuli; a picture-only stimulus is allowed; other blocks have none", () => {
    const lesson = (block) => lessonSchema.safeParse({ moduleId: ID, slug: "l", order: 1, title: { de: "L" }, blocks: [block], sourceType: "original" });
    const image = { mediaId: ID, alt: { de: "Ein Schild" }, caption: { en: "At the station" } };
    const intro = lesson({ type: "intro", key: "intro", body: { en: "Hi" }, image });
    expect(intro.success).toBe(true);
    expect(intro.data.blocks[0].image).toEqual(image);
    // Unknown keys are stripped on other block types (never stored).
    expect(lesson({ type: "grammar", key: "g", refId: ID, image }).data.blocks[0]).not.toHaveProperty("image");
    const ex = exerciseSchema.safeParse({
      levelCode: "A1",
      slug: "schild",
      skill: "reading",
      title: { de: "Schild" },
      stimulus: { image },
      items: [{ type: "true_false", id: "q1", statement: { de: "x" }, answer: true }],
      sourceType: "original",
    });
    expect(ex.success).toBe(true);
  });

  it("lists the image references of each content kind", () => {
    const lesson = { blocks: [{ type: "intro", key: "intro", image: { mediaId: ID } }, { type: "intro", key: "b" }] };
    expect(contentImageRefs("lessons", lesson)).toMatchObject([{ target: "block:intro", path: "blocks.0.image" }]);
    expect(contentImageIds("vocabulary", { image: { mediaId: ID } })).toEqual([ID]);
    expect(contentImageIds("exercises", { stimulus: { image: { mediaId: ID } } })).toEqual([ID]);
    expect(contentImageIds("vocabulary", { image: null })).toEqual([]);
    expect(contentImageIds("grammarTopics", { image: { mediaId: ID } })).toEqual([]);
  });
});

describe("learner payload", () => {
  it("resolves the stimulus image through the resolver; without one (or unusable) it is null", () => {
    const ex = {
      _id: ID,
      skill: "reading",
      title: { de: "Schild" },
      stimulus: { text: { de: "Gleis 3" }, image: { mediaId: ID, alt: { en: "Sign" } } },
      items: [{ type: "true_false", id: "q1", statement: { de: "x" }, answer: true }],
    };
    const image = (ref) => ({ src: `/api/media/${ref.mediaId}`, width: 4, height: 3, alt: ref.alt, caption: null });
    expect(toClientExercise(ex, { image }).stimulus.image).toEqual({ src: `/api/media/${ID}`, width: 4, height: 3, alt: { en: "Sign" }, caption: null });
    expect(toClientExercise(ex, { image: () => null }).stimulus.image).toBeNull();
    expect(toClientExercise(ex).stimulus.image).toBeNull();
    expect(toClientExercise({ ...ex, stimulus: { text: { de: "x" } } }).stimulus.image).toBeNull();
  });
});

describe("editor payloads", () => {
  it("round-trips an image and drops it when no image is chosen", () => {
    const image = { mediaId: ID, alt: { de: "Ein Apfel", en: "An apple" }, caption: { en: "Fruit" } };
    expect(imagePayload(imageState(image))).toEqual(image);
    expect(imagePayload(imageState({ mediaId: ID, alt: { en: "x" } }))).toEqual({ mediaId: ID, alt: { en: "x" } });
    expect(imagePayload(imageState(null))).toBeUndefined();
    // Removing the image keeps the typed alt text in the form, but nothing is sent.
    expect(imagePayload({ ...imageState(image), mediaId: "" })).toBeUndefined();
    // Alt text is always sent when an image is chosen, so the server reports it missing.
    expect(imagePayload({ mediaId: ID, alt: imageState(null).alt, caption: imageState(null).caption })).toEqual({ mediaId: ID, alt: {} });
  });

  it("words, intro blocks and stimuli carry the image; without one the payload is unchanged", () => {
    const image = { mediaId: ID, alt: { en: "An apple" } };
    const word = { levelCode: "A1", slug: "apfel", lemma: "Apfel", article: "der", plural: null, pos: "noun", meanings: { en: "apple" }, topics: [], tags: [], refs: [], sourceType: "original" };
    expect(vocabularyPayload(vocabularyState({ ...word, image }))).toEqual({ ...word, image });
    expect(vocabularyPayload(vocabularyState(word))).toEqual(word);
    expect(vocabularyPayload(vocabularyState({ ...word, image: null }))).toEqual(word);

    const lesson = { moduleId: ID, slug: "l", order: 1, title: { de: "L" }, tags: [], refs: [], sourceType: "original", blocks: [{ type: "intro", key: "intro", body: { en: "Hi" }, image }] };
    expect(lessonPayload(lessonState(lesson)).blocks).toEqual(lesson.blocks);

    const stim = { text: { de: "Gleis 3" }, image, transcriptPolicy: "after_submit", maxPlays: null };
    expect(stimulusPayload(stimulusState(stim))).toEqual(stim);
  });
});
