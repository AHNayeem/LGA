import * as mediaRepo from "@/lib/repositories/mediaAssetRepository";
import { contentImageRefs } from "@/lib/media/imageRefs";

// Curriculum images: uploads of kind "image" in the media library (source native |
// licensed, visibility linked), attached to content by id (lib/media/imageRefs.js).
// Images are optional everywhere: an image that can't be used (archived, deleted, not an
// image) is left out of the learner view, and the rest of the lesson renders as before.

export function isUsableCurriculumImage(asset) {
  // "archived" is MEDIA_STATUS.archived (audioService); not imported to avoid a cycle.
  return Boolean(asset) && asset.kind === "image" && mediaRepo.CURRICULUM_UPLOAD_SOURCES.includes(asset.source) && asset.status !== "archived";
}

async function usableImages(ids) {
  if (ids.length === 0) return new Map();
  const assets = await mediaRepo.findCurriculumUploadsByIds(ids);
  return new Map(assets.filter(isUsableCurriculumImage).map((a) => [String(a._id), a]));
}

// One batched lookup for every image on a page. The resolver turns an attachment into
// what the browser needs: the authorised media URL, the intrinsic size (so the layout
// keeps the aspect ratio before the file loads) and the alt text. No storage details.
export async function createImageResolver(ids) {
  const usable = await usableImages(ids.map(String));
  return (ref) => {
    if (!ref?.mediaId) return null;
    const id = String(ref.mediaId);
    const asset = usable.get(id);
    if (!asset) return null;
    return { src: `/api/media/${id}`, width: asset.width ?? null, height: asset.height ?? null, alt: ref.alt, caption: ref.caption ?? null };
  };
}

// Attached images of one document that can't be used (save and publish checks).
export async function unusableImageRefs(kind, doc) {
  const refs = contentImageRefs(kind, doc);
  if (refs.length === 0) return [];
  const usable = await usableImages(refs.map((r) => String(r.ref.mediaId)));
  return refs.filter((r) => !usable.has(String(r.ref.mediaId).toLowerCase()));
}

// Admin view of an image: what an editor needs to recognise and preview it.
export function adminImageSummary(asset) {
  return {
    id: String(asset._id),
    kind: "image",
    title: asset.title ?? null,
    source: asset.source,
    status: asset.status ?? "active",
    mime: asset.mime,
    size: asset.size ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
    alt: asset.alt ?? null,
    originalName: asset.originalName ?? null,
    usable: isUsableCurriculumImage(asset),
  };
}

// Summaries of the images a document attaches, by id. A deleted id is reported, not hidden.
export async function contentImageSummaries(kind, doc) {
  const ids = [...new Set(contentImageRefs(kind, doc).map((r) => String(r.ref.mediaId)))];
  if (ids.length === 0) return {};
  const byId = new Map((await mediaRepo.findCurriculumUploadsByIds(ids)).map((a) => [String(a._id), a]));
  return Object.fromEntries(
    ids.map((id) => {
      const asset = byId.get(id);
      if (asset?.kind === "image") return [id, adminImageSummary(asset)];
      return [id, { id, kind: "image", title: null, usable: false, status: asset ? "not an image" : "missing" }];
    }),
  );
}
