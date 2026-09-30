import { EXPLANATION_LOCALES, LEARNING_LANGUAGE } from "@/lib/i18n/locales";

// Payload primitives shared by the admin editors (components/admin/editor/payload.js) and
// the bulk vocabulary import (lib/content/vocabularyImport.js), plus the vocabulary payload
// builder both of them send. A payload is the plain object the content schemas validate on
// the server. No validation happens here: builders only drop empty optional values, so an
// untouched optional field is never sent as "".

export const LOCALES = Object.freeze([LEARNING_LANGUAGE, ...EXPLANATION_LOCALES]);

export function locOptional(v) {
  const out = {};
  for (const k of LOCALES) if (typeof v?.[k] === "string" && v[k].trim()) out[k] = v[k];
  return Object.keys(out).length ? out : undefined;
}

// Required localised fields are always sent, so the server reports which language is missing.
export const locRequired = (v) => locOptional(v) ?? {};

export const str = (v) => (v == null || String(v).trim() === "" ? undefined : String(v));
export const slugList = (v) =>
  String(v ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

export const withOptional = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export function slugify(value) {
  return String(value ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function commonPayload(s) {
  return {
    tags: slugList(s.tags),
    refs: s.refs.filter((r) => r.referenceId).map((r) => ({ referenceId: r.referenceId, ...(str(r.note) ? { note: r.note } : {}) })),
    sourceType: s.sourceType,
    ...(str(s.sourceReference) ? { sourceReference: s.sourceReference } : {}),
  };
}

// An attached image from the media library: its id plus alt text and caption for this
// place. No id = no image.
export const imagePayload = (s) =>
  str(s?.mediaId) ? withOptional({ mediaId: s.mediaId, alt: locRequired(s.alt), caption: locOptional(s.caption) }) : undefined;

export const vocabularyPayload = (s) =>
  withOptional({
    levelCode: s.levelCode,
    slug: str(s.slug),
    lemma: s.lemma,
    article: s.article || null,
    plural: str(s.plural) ?? null,
    pos: s.pos,
    meanings: locRequired(s.meanings),
    example: locOptional(s.example),
    notes: locOptional(s.notes),
    image: imagePayload(s.image),
    topics: slugList(s.topics),
    ...commonPayload(s),
  });
