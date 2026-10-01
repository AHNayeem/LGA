// Exam drafts: the answers of a running practice exam kept in this browser, so a reload or
// closing and reopening the browser doesn't lose them. Dependency-free (runs in the
// browser; the server shares the grace constant).
//
//   signed in   scoped to the attempt (`attempt:<id>`). The server keeps the attempt and its
//               deadline; answers are only sent on submission (examService).
//   guest       scoped to the exam and its version (`guest:<examId>:<version>`), plus the
//               time the guest started, because nothing is stored on the server: the
//               deadline is recomputed from it and the exam's duration.
//   preview     the CMS preview keeps its draft for this tab only (sessionStorage).
//
// A draft is untrusted input: normalizeDraft keeps only answers to the paper's own
// questions and drops anything malformed. The server never reads a draft; it validates and
// grades whatever is submitted, exactly as without one.
//
// Drafts are removed after a successful submission, when the server rejects the attempt as
// finished, when a guest's time ran out (plus the grace below, the server's rule for
// attempts), and by pruneExamDrafts after DRAFT_MAX_AGE_MS without a change.

export const EXAM_DRAFT_VERSION = 1;
// After the deadline, the final submission may still arrive for this long (network, the
// automatic submission at 0:00). Later, the attempt counts as expired, with no result.
export const EXAM_SUBMIT_GRACE_MS = 60_000;
export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60_000;

const PREFIX = `lga:exam-draft:v${EXAM_DRAFT_VERSION}:`;
const MAX_VALUE_LENGTH = 1000;
const MAX_LIST = 60;

const isObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);

function cleanValue(v) {
  if (typeof v === "string") return v.length <= MAX_VALUE_LENGTH ? v : undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (Array.isArray(v)) return v.length <= MAX_LIST && v.every((x) => typeof x === "string" && x.length <= MAX_VALUE_LENGTH) ? v : undefined;
  if (isObject(v)) {
    const e = Object.entries(v);
    return e.length <= MAX_LIST && e.every(([k, x]) => k.length <= 100 && typeof x === "string" && x.length <= MAX_VALUE_LENGTH) ? v : undefined;
  }
  return undefined;
}

// The paper's question ids: { [exerciseId]: Set(itemId) }.
export function paperItemIds(paper) {
  const out = {};
  for (const s of paper.sections ?? []) for (const ex of s.exercises ?? []) out[ex.id] = new Set((ex.items ?? []).map((i) => i.id));
  return out;
}

// → { answers, index, startedAt } or null when there is nothing usable.
export function normalizeDraft(raw, { itemIds, taskCount, durationMs = null, now = Date.now() }) {
  if (!isObject(raw) || raw.v !== EXAM_DRAFT_VERSION) return null;
  if (!Number.isFinite(raw.savedAt) || raw.savedAt > now + 60_000 || now - raw.savedAt > DRAFT_MAX_AGE_MS) return null;
  const answers = {};
  for (const [exId, items] of Object.entries(isObject(raw.answers) ? raw.answers : {})) {
    const allowed = itemIds[exId];
    if (!allowed || !isObject(items)) continue;
    for (const [itemId, value] of Object.entries(items)) {
      const clean = allowed.has(itemId) ? cleanValue(value) : undefined;
      if (clean !== undefined) (answers[exId] ??= {})[itemId] = clean;
    }
  }
  const index = Number.isInteger(raw.index) && raw.index >= 0 && raw.index < taskCount ? raw.index : 0;
  // A start time in the future or before the longest possible attempt can't be right.
  const oldest = durationMs != null ? now - durationMs - DRAFT_MAX_AGE_MS : -Infinity;
  const startedAt = Number.isFinite(raw.startedAt) && raw.startedAt <= now + 60_000 && raw.startedAt >= oldest ? raw.startedAt : null;
  return { answers, index, startedAt };
}

// A guest's timed attempt whose time (plus the grace) ran out while they were away.
export function isDraftExpired(draft, durationMs, now = Date.now()) {
  return Boolean(durationMs && draft?.startedAt != null && now > draft.startedAt + durationMs + EXAM_SUBMIT_GRACE_MS);
}

function store(session) {
  try {
    return session ? window.sessionStorage : window.localStorage;
  } catch {
    return null; // storage blocked
  }
}

export function readExamDraft(scope, opts, { session = false } = {}) {
  try {
    const raw = store(session)?.getItem(PREFIX + scope);
    return raw ? normalizeDraft(JSON.parse(raw), opts) : null;
  } catch {
    return null;
  }
}

export function writeExamDraft(scope, { answers, index, startedAt = null }, { session = false, now = Date.now() } = {}) {
  try {
    store(session)?.setItem(PREFIX + scope, JSON.stringify({ v: EXAM_DRAFT_VERSION, answers, index, startedAt, savedAt: now }));
  } catch {
    // Quota or storage blocked: answers stay in memory only.
  }
}

export function clearExamDraft(scope, { session = false } = {}) {
  try {
    store(session)?.removeItem(PREFIX + scope);
  } catch {
    // ignore
  }
}

// Removes drafts nobody touched for DRAFT_MAX_AGE_MS, unreadable ones, and those of older
// draft versions, and the unversioned sessionStorage drafts of earlier builds.
export function pruneExamDrafts(now = Date.now()) {
  try {
    const ls = window.localStorage;
    for (let i = ls.length - 1; i >= 0; i--) {
      const key = ls.key(i);
      if (!key?.startsWith("lga:exam-draft:")) continue;
      if (!key.startsWith(PREFIX)) {
        ls.removeItem(key);
        continue;
      }
      let savedAt = null;
      try {
        savedAt = JSON.parse(ls.getItem(key))?.savedAt;
      } catch {
        // unreadable: removed below
      }
      if (!Number.isFinite(savedAt) || now - savedAt > DRAFT_MAX_AGE_MS) ls.removeItem(key);
    }
    const ss = window.sessionStorage;
    for (let i = ss.length - 1; i >= 0; i--) {
      const key = ss.key(i);
      if (key?.startsWith("lga:exam:")) ss.removeItem(key); // the unversioned drafts of earlier builds
    }
  } catch {
    // storage blocked
  }
}
