// Where curriculum content may attach an image from the media library. An attachment is
// `image: { mediaId, alt: {de?,en?,bn?}, caption? }` (imageRefSchema in
// lib/validation/content.js). Alt text lives on the attachment, because what an image
// must convey depends on where it is used.
//
//   vocabulary   image                 picture of the word (flashcard answer side)
//   exercises    stimulus.image        reading/listening picture, sign, situation
//   lessons      blocks[i].image       intro blocks only
//
// Pure: works on stored documents (ObjectIds) and editor payloads (strings) alike.

export const IMAGE_REFERENCE_PATHS = Object.freeze({
  vocabulary: ["image.mediaId"],
  exercises: ["stimulus.image.mediaId"],
  lessons: ["blocks.image.mediaId"],
});

// [{ target, path, label, ref }] for every attached image of one document.
export function contentImageRefs(kind, doc) {
  if (!doc) return [];
  if (kind === "vocabulary") return doc.image?.mediaId ? [{ target: "image", path: "image", label: "Word image", ref: doc.image }] : [];
  if (kind === "exercises") {
    return doc.stimulus?.image?.mediaId ? [{ target: "stimulus-image", path: "stimulus.image", label: "Stimulus image", ref: doc.stimulus.image }] : [];
  }
  if (kind === "lessons") {
    return (doc.blocks ?? []).flatMap((b, i) =>
      b.image?.mediaId ? [{ target: `block:${b.key}`, path: `blocks.${i}.image`, label: `Block ${i + 1} (${b.key})`, ref: b.image }] : [],
    );
  }
  return [];
}

export function contentImageIds(kind, doc) {
  return contentImageRefs(kind, doc).map((r) => String(r.ref.mediaId));
}
