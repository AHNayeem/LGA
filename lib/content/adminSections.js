import { pickText } from "@/lib/i18n/locales";

// Admin CMS sections: URL segment ↔ content collection. Pure data, safe for client code.
export const ADMIN_SECTIONS = Object.freeze([
  { segment: "levels", kind: "levels", label: "Levels", singular: "level" },
  { segment: "modules", kind: "modules", label: "Modules", singular: "module" },
  { segment: "lessons", kind: "lessons", label: "Lessons", singular: "lesson" },
  { segment: "vocabulary", kind: "vocabulary", label: "Vocabulary", singular: "word" },
  { segment: "grammar", kind: "grammarTopics", label: "Grammar", singular: "grammar topic" },
  { segment: "exercises", kind: "exercises", label: "Exercises", singular: "exercise" },
  { segment: "exams", kind: "exams", label: "Exams", singular: "exam" },
]);

const BY_KIND = new Map(ADMIN_SECTIONS.map((s) => [s.kind, s]));

export function sectionForKind(kind) {
  return BY_KIND.get(kind) ?? null;
}

export function listHref(kind, params = {}) {
  const s = sectionForKind(kind);
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== "")).toString();
  return `/admin/${s.segment}${qs ? `?${qs}` : ""}`;
}

// Modules keep their review overview at /admin/modules/:id; the form lives under /edit.
export function editHref(kind, id) {
  const s = sectionForKind(kind);
  return kind === "modules" ? `/admin/modules/${id}/edit` : `/admin/${s.segment}/${id}`;
}

// CMS draft preview of a lesson through the learner lesson UI (read-only).
export function lessonPreviewHref(id) {
  return `/admin/lessons/${id}/preview`;
}

// CMS preview of an exam through the learner exam UI (nothing is stored).
export function examPreviewHref(id) {
  return `/admin/exams/${id}/preview`;
}

export function newHref(kind, params) {
  const s = sectionForKind(kind);
  const qs = params ? new URLSearchParams(params).toString() : "";
  return `/admin/${s.segment}/new${qs ? `?${qs}` : ""}`;
}

// Nouns are shown with their article, as learners see them.
export function wordForm(v) {
  return v.article ? `${v.article} ${v.lemma}` : v.lemma;
}

// Human-readable label for any content document (German first).
export function contentLabel(kind, doc) {
  if (!doc) return "";
  if (kind === "vocabulary") return wordForm(doc);
  if (kind === "levels") return `${doc.code} · ${pickText(doc.title, "de").text}`;
  return pickText(doc.title, "de").text || doc.slug || "";
}
