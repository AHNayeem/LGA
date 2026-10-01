import { lessonCompletion } from "@/lib/learning/progress";
import { MAX_BOX, REVIEW_RESULTS, reviewCard } from "@/lib/learning/srs";

// The learner state every learner-facing view is computed from, in one shape for both
// kinds of learner:
//
//   signed in   built on the server from userProgress, userVocabulary and examAttempts
//               (learnerStateFromDocs below; the database stays the source of truth)
//   guest       kept in this browser only (lib/learning/guestStore.js), never sent to the
//               server and never used for any server-side decision
//
//   {
//     version,
//     lessons: { [lessonId]: { blocksDone: [blockKey], completedAt,
//                exercises: { [exerciseId]: { skill, attempts, bestRatio, passedAt,
//                             last: { score, maxScore, ratio, passed, at } } } } },
//     vocab:   { [vocabId]: { box, dueAt, reps, lapses, lastResult, lastReviewedAt } },
//     exams:   { [examId]: [ { at, score, maxScore, ratio, passed, passThreshold,
//                              sections: [{ key, title, score, maxScore, ratio }] } ] }   newest first
//     profile: { goal, startModule, levelCode } | null
//   }
//
// The lesson entry is the userProgress document's shape, so lib/learning/progress.js
// works on either. The apply* functions below are the guest counterparts of the
// progress repository's atomic updates and follow the same rules.

export const LEARNER_STATE_VERSION = 1;
export const MAX_EXAM_RESULTS = 10;

export const LEARNING_GOALS = Object.freeze(["from_zero", "improve", "goethe", "skills"]);

export function emptyLearnerState() {
  return { version: LEARNER_STATE_VERSION, lessons: {}, vocab: {}, exams: {}, profile: null };
}

const iso = (d) => (d ? new Date(d).toISOString() : null);
const isObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);

// Stored guest state is untrusted input from the browser (another version, edited by
// hand, corrupted, or written by an older build): every field is checked and anything that
// doesn't look right is dropped, never repaired, so the views can rely on the shape above.
// Sizes are bounded too, so a bloated entry can't slow every page down. None of this makes
// the values trustworthy: the server never reads them.

const MAX_LESSONS = 2000;
const MAX_BLOCKS = 60;
const MAX_EXERCISES_PER_LESSON = 60;
const MAX_WORDS = 10_000;
const MAX_EXAMS = 100;
const MAX_SECTIONS = 20;
const MAX_KEY = 100;

const isKey = (v) => typeof v === "string" && v.length > 0 && v.length <= MAX_KEY;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isCount = (v) => Number.isInteger(v) && v >= 0;
const isRatio = (v) => v === null || (isNum(v) && v >= 0 && v <= 1);
const isDate = (v) => typeof v === "string" && v.length <= 40 && !Number.isNaN(Date.parse(v));
const dateOrNull = (v) => (isDate(v) ? v : null);
const entries = (v, max) => (isObject(v) ? Object.entries(v).filter(([k]) => isKey(k)).slice(0, max) : []);

function cleanResult(r) {
  if (!isObject(r) || !isNum(r.score) || !isNum(r.maxScore) || r.score < 0 || r.maxScore < 0 || r.score > r.maxScore) return null;
  if (!isRatio(r.ratio ?? null) || typeof r.passed !== "boolean") return null;
  return { score: r.score, maxScore: r.maxScore, ratio: r.ratio ?? null, passed: r.passed, at: dateOrNull(r.at) };
}

function cleanExercise(e) {
  if (!isObject(e) || !isCount(e.attempts) || e.attempts < 1 || !isRatio(e.bestRatio ?? null)) return null;
  const last = e.last == null ? null : cleanResult(e.last);
  if (e.last != null && !last) return null;
  return {
    skill: typeof e.skill === "string" && e.skill.length <= 40 ? e.skill : null,
    attempts: e.attempts,
    bestRatio: e.bestRatio ?? null,
    passedAt: dateOrNull(e.passedAt),
    last,
  };
}

function cleanLesson(l) {
  if (!isObject(l)) return null;
  const exercises = {};
  for (const [id, e] of entries(l.exercises, MAX_EXERCISES_PER_LESSON)) {
    const clean = cleanExercise(e);
    if (clean) exercises[id] = clean;
  }
  const blocksDone = Array.isArray(l.blocksDone) ? [...new Set(l.blocksDone.filter(isKey))].slice(0, MAX_BLOCKS) : [];
  return { blocksDone, exercises, completedAt: dateOrNull(l.completedAt) };
}

function cleanWord(v) {
  if (!isObject(v) || !Number.isInteger(v.box) || v.box < 1 || v.box > MAX_BOX || !isDate(v.dueAt)) return null;
  return {
    box: v.box,
    dueAt: v.dueAt,
    reps: isCount(v.reps) ? v.reps : 0,
    lapses: isCount(v.lapses) ? v.lapses : 0,
    lastResult: REVIEW_RESULTS.includes(v.lastResult) ? v.lastResult : null,
    lastReviewedAt: dateOrNull(v.lastReviewedAt),
  };
}

const isTitle = (t) => typeof t === "string" || (isObject(t) && Object.values(t).every((x) => typeof x === "string"));

function cleanExamResult(r) {
  if (!isObject(r) || !isNum(r.score) || !isNum(r.maxScore) || r.score < 0 || r.maxScore < 0) return null;
  if (!isRatio(r.ratio ?? null) || typeof r.passed !== "boolean" || !isRatio(r.passThreshold ?? null) || !Array.isArray(r.sections)) return null;
  const sections = [];
  for (const sec of r.sections.slice(0, MAX_SECTIONS)) {
    if (!isObject(sec) || !isKey(sec.key) || !isTitle(sec.title) || !isNum(sec.score) || !isNum(sec.maxScore) || !isRatio(sec.ratio ?? null)) return null;
    sections.push({ key: sec.key, title: sec.title, score: sec.score, maxScore: sec.maxScore, ratio: sec.ratio ?? null });
  }
  return { at: dateOrNull(r.at), score: r.score, maxScore: r.maxScore, ratio: r.ratio ?? null, passed: r.passed, passThreshold: r.passThreshold ?? null, sections };
}

function cleanProfile(p) {
  if (!isObject(p) || !LEARNING_GOALS.includes(p.goal)) return null;
  return {
    goal: p.goal,
    levelCode: typeof p.levelCode === "string" && /^[A-C][12]$/.test(p.levelCode) ? p.levelCode : null,
    startModule: typeof p.startModule === "string" && /^[a-z0-9-]{1,100}$/.test(p.startModule) ? p.startModule : null,
  };
}

export function normalizeLearnerState(raw) {
  if (!isObject(raw) || raw.version !== LEARNER_STATE_VERSION) return emptyLearnerState();
  const state = emptyLearnerState();
  for (const [id, l] of entries(raw.lessons, MAX_LESSONS)) {
    const clean = cleanLesson(l);
    if (clean) state.lessons[id] = clean;
  }
  for (const [id, v] of entries(raw.vocab, MAX_WORDS)) {
    const clean = cleanWord(v);
    if (clean) state.vocab[id] = clean;
  }
  for (const [id, list] of entries(raw.exams, MAX_EXAMS)) {
    if (!Array.isArray(list)) continue;
    const results = list.slice(0, MAX_EXAM_RESULTS).map(cleanExamResult).filter(Boolean);
    if (results.length) state.exams[id] = results;
  }
  state.profile = cleanProfile(raw.profile);
  return state;
}

function lessonEntry(state, lessonId) {
  return state.lessons[lessonId] ?? { blocksDone: [], exercises: {}, completedAt: null };
}

function withLesson(state, lessonId, entry) {
  return { ...state, lessons: { ...state.lessons, [lessonId]: entry } };
}

// Sets completedAt once, when every block is done (like markLessonCompleted).
// `blocks`: the lesson's blocks as [{ key, type, refId }].
function finishLesson(entry, blocks, now) {
  if (entry.completedAt || !blocks) return entry;
  return lessonCompletion({ blocks }, entry).complete ? { ...entry, completedAt: iso(now) } : entry;
}

// A graded result from the server (never computed in the browser): attempts +1, last
// replaced, best ratio kept, first pass time kept. Mirrors recordExerciseResult.
export function applyExerciseResult(state, { lessonId, exerciseId, skill, result, blocks = null, now = new Date() }) {
  const entry = lessonEntry(state, lessonId);
  const prev = entry.exercises[exerciseId];
  const bestRatio = result.ratio == null ? (prev?.bestRatio ?? null) : Math.max(prev?.bestRatio ?? 0, result.ratio);
  const next = {
    skill,
    attempts: (prev?.attempts ?? 0) + 1,
    bestRatio,
    passedAt: prev?.passedAt ?? (result.passed ? iso(now) : null),
    last: { score: result.score, maxScore: result.maxScore, ratio: result.ratio, passed: result.passed, at: iso(now) },
  };
  const updated = { ...entry, exercises: { ...entry.exercises, [exerciseId]: next } };
  return withLesson(state, lessonId, finishLesson(updated, blocks, now));
}

export function applyBlockDone(state, { lessonId, blockKey, blocks = null, now = new Date() }) {
  const entry = lessonEntry(state, lessonId);
  const blocksDone = entry.blocksDone.includes(blockKey) ? entry.blocksDone : [...entry.blocksDone, blockKey];
  return withLesson(state, lessonId, finishLesson({ ...entry, blocksDone }, blocks, now));
}

// Self-rated flashcards: the same Leitner rule as the server (srs.reviewCard).
export function applyVocabReview(state, { vocabId, result, now = new Date() }) {
  const next = reviewCard(state.vocab[vocabId] ?? null, result, now);
  const stored = { ...next, dueAt: iso(next.dueAt), lastReviewedAt: iso(next.lastReviewedAt) };
  return { ...state, vocab: { ...state.vocab, [vocabId]: stored } };
}

// An exam result graded by the server, reduced to what the views need.
export function examResultSummary(result, at) {
  return {
    at: iso(at),
    score: result.score,
    maxScore: result.maxScore,
    ratio: result.ratio,
    passed: result.passed,
    passThreshold: result.passThreshold,
    sections: (result.sections ?? []).map((s) => ({ key: s.key, title: s.title, score: s.score, maxScore: s.maxScore, ratio: s.ratio })),
  };
}

export function applyExamResult(state, { examId, result, now = new Date() }) {
  const list = [examResultSummary(result, now), ...(state.exams[examId] ?? [])].slice(0, MAX_EXAM_RESULTS);
  return { ...state, exams: { ...state.exams, [examId]: list } };
}

export function applyProfile(state, profile) {
  return { ...state, profile: profile ? { ...profile } : null };
}

// --- Signed-in learners: the same shape from the stored documents ----------------------

export function learnerStateFromDocs({ progress = [], vocab = [], examAttempts = [], profile = null } = {}) {
  const state = emptyLearnerState();
  for (const p of progress) {
    state.lessons[String(p.scopeId)] = {
      blocksDone: p.blocksDone ?? [],
      exercises: p.exercises ?? {},
      completedAt: iso(p.completedAt),
    };
  }
  for (const v of vocab) {
    state.vocab[String(v.vocabId)] = {
      box: v.box,
      dueAt: iso(v.dueAt),
      reps: v.reps ?? 0,
      lapses: v.lapses ?? 0,
      lastResult: v.lastResult ?? null,
      lastReviewedAt: iso(v.lastReviewedAt),
    };
  }
  // Newest first; expired attempts have no result and are left out.
  const graded = examAttempts.filter((a) => a.result).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  for (const a of graded) {
    const id = String(a.examId);
    const list = (state.exams[id] ??= []);
    if (list.length < MAX_EXAM_RESULTS) list.push(examResultSummary(a.result, a.submittedAt));
  }
  state.profile = profile ?? null;
  // Dates in the progress entries (last.at, passedAt) are serialised by the caller.
  return state;
}
