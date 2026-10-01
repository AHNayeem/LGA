import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DRAFT_MAX_AGE_MS,
  EXAM_DRAFT_VERSION,
  EXAM_SUBMIT_GRACE_MS,
  clearExamDraft,
  isDraftExpired,
  normalizeDraft,
  paperItemIds,
  pruneExamDrafts,
  readExamDraft,
  writeExamDraft,
} from "@/lib/exams/draft";
import { SUBMIT_GRACE_MS } from "@/lib/services/examService";

// Exam drafts in the browser (lib/exams/draft.js): untrusted, scoped, versioned, expiring.

const NOW = Date.parse("2026-10-01T10:00:00Z");
const PAPER = { sections: [{ exercises: [{ id: "e1", items: [{ id: "q1" }, { id: "q2" }] }, { id: "e2", items: [{ id: "q1" }] }] }] };
const OPTS = { itemIds: paperItemIds(PAPER), taskCount: 2, durationMs: 60 * 60_000, now: NOW };
const draft = (extra = {}) => ({ v: EXAM_DRAFT_VERSION, answers: { e1: { q1: "a" } }, index: 1, startedAt: NOW - 10 * 60_000, savedAt: NOW - 1000, ...extra });

function memoryStorage() {
  const m = new Map();
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    keys: () => [...m.keys()],
  };
}

describe("exam draft normalisation", () => {
  it("keeps answers to the paper's own questions only", () => {
    const d = normalizeDraft(draft({ answers: { e1: { q1: "a", q2: true, q9: "x" }, e9: { q1: "x" }, e2: { q1: { l1: "r2" } } } }), OPTS);
    expect(d).toEqual({ answers: { e1: { q1: "a", q2: true }, e2: { q1: { l1: "r2" } } }, index: 1, startedAt: NOW - 10 * 60_000 });
  });

  it("drops malformed values, versions and ages", () => {
    for (const raw of [null, "x", [], { ...draft(), v: 99 }, draft({ savedAt: "now" }), draft({ savedAt: NOW - DRAFT_MAX_AGE_MS - 1 }), draft({ savedAt: NOW + 3_600_000 })]) {
      expect(normalizeDraft(raw, OPTS)).toBeNull();
    }
    const d = normalizeDraft(draft({ answers: { e1: { q1: "x".repeat(5000), q2: { a: 1 } }, e2: "junk" }, index: 7, startedAt: NOW + 3_600_000 }), OPTS);
    expect(d).toEqual({ answers: {}, index: 0, startedAt: null });
  });

  it("a guest's timed attempt expires after the deadline plus the server's grace", () => {
    const d = normalizeDraft(draft({ startedAt: NOW - 60 * 60_000 - EXAM_SUBMIT_GRACE_MS + 1 }), OPTS);
    expect(isDraftExpired(d, OPTS.durationMs, NOW)).toBe(false); // still within the grace: submitted automatically
    expect(isDraftExpired({ startedAt: NOW - 60 * 60_000 - EXAM_SUBMIT_GRACE_MS - 1 }, OPTS.durationMs, NOW)).toBe(true);
    expect(isDraftExpired({ startedAt: NOW - 10 * 60 * 60_000 }, null, NOW)).toBe(false); // untimed exams don't expire
    expect(SUBMIT_GRACE_MS).toBe(EXAM_SUBMIT_GRACE_MS);
  });
});

describe("exam draft storage", () => {
  beforeEach(() => {
    globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() };
  });
  afterEach(() => {
    delete globalThis.window;
  });

  it("round-trips per scope in localStorage (survives closing the browser), the preview in sessionStorage", () => {
    writeExamDraft("guest:x1:3", { answers: { e1: { q1: "a" } }, index: 1, startedAt: NOW }, { now: NOW });
    writeExamDraft("attempt:a1", { answers: { e2: { q1: "b" } }, index: 0 }, { now: NOW });
    writeExamDraft("preview:x1", { answers: {}, index: 0 }, { session: true, now: NOW });
    expect(readExamDraft("guest:x1:3", OPTS)).toEqual({ answers: { e1: { q1: "a" } }, index: 1, startedAt: NOW });
    expect(readExamDraft("guest:x1:4", OPTS)).toBeNull(); // another exam version starts fresh
    expect(readExamDraft("attempt:a1", OPTS).answers).toEqual({ e2: { q1: "b" } });
    expect(window.localStorage.keys()).toEqual(["lga:exam-draft:v1:guest:x1:3", "lga:exam-draft:v1:attempt:a1"]);
    expect(window.sessionStorage.keys()).toEqual(["lga:exam-draft:v1:preview:x1"]);
    clearExamDraft("guest:x1:3");
    expect(readExamDraft("guest:x1:3", OPTS)).toBeNull();
  });

  it("prunes stale, unreadable and old-version drafts, and the unversioned session drafts of earlier builds", () => {
    const ls = window.localStorage;
    writeExamDraft("attempt:old", { answers: {}, index: 0 }, { now: NOW - DRAFT_MAX_AGE_MS - 1 });
    writeExamDraft("attempt:new", { answers: {}, index: 0 }, { now: NOW });
    ls.setItem("lga:exam-draft:v1:attempt:bad", "{nope");
    ls.setItem("lga:exam-draft:v0:attempt:x", "{}");
    ls.setItem("lga:guest:v1", "{}"); // not a draft: untouched
    window.sessionStorage.setItem("lga:exam:a1", "{}");
    pruneExamDrafts(NOW);
    expect(ls.keys().sort()).toEqual(["lga:exam-draft:v1:attempt:new", "lga:guest:v1"]);
    expect(window.sessionStorage.keys()).toEqual([]);
  });

  it("storage that throws never breaks the exam", () => {
    const boom = () => {
      throw new Error("blocked");
    };
    globalThis.window = { localStorage: { getItem: boom, setItem: boom, removeItem: boom, key: boom, length: 1 }, sessionStorage: { getItem: boom } };
    expect(() => writeExamDraft("attempt:a1", { answers: {}, index: 0 })).not.toThrow();
    expect(readExamDraft("attempt:a1", OPTS)).toBeNull();
    expect(() => clearExamDraft("attempt:a1")).not.toThrow();
    expect(() => pruneExamDrafts()).not.toThrow();
  });
});
