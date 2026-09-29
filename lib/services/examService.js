import { randomBytes } from "node:crypto";
import { z } from "zod";
import { serialize } from "@/lib/db/serialize";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { levelCode as levelCodeSchema, objectIdString, parseOrThrow, slug as slugSchema, toObjectId } from "@/lib/validation/common";
import { isVisibleToLearners } from "@/lib/content/lifecycle";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import { examRepository, exerciseRepository, levelRepository, LEARNER_VISIBLE } from "@/lib/repositories/contentRepository";
import * as attemptRepo from "@/lib/repositories/examAttemptRepository";
import { ATTEMPT_STATUS } from "@/lib/repositories/examAttemptRepository";
import { assertCanPreview, assertLearner } from "@/lib/services/curriculumService";
import { createExerciseAudioResolver } from "@/lib/services/audioService";
import { createImageResolver } from "@/lib/services/imageService";
import { contentImageIds } from "@/lib/media/imageRefs";
import { exerciseCues } from "@/lib/audio/cues";
import { buildExamSnapshot, examExerciseIds, examReadiness, snapshotExercises, snapshotQuestionCount, toClientExam } from "@/lib/exams/exam";
import { examAnswersSchema, examResultView, gradeExam, sanitizeExamAnswers } from "@/lib/exams/scoring";
import { logger } from "@/lib/logger";

// Exams for learners and the CMS preview. Server-authoritative throughout:
//   - the client sends only ids and raw answers; every score is computed here
//   - an attempt freezes the exam and its exercises (snapshot) and a secret shuffle seed
//     when it starts; grading and review always use that snapshot
//   - answers are sent once, on submission; a submitted or expired attempt never changes
//   - every attempt read and write is scoped to the acting learner
// Exam results are kept apart from lesson progress, exercise attempts and mastery: an exam
// never marks a lesson, module or level as complete.

// Time allowed after the deadline for the final submission to arrive (network, the
// client's automatic submission at 0:00). After that the attempt is closed as expired.
export const SUBMIT_GRACE_MS = 60_000;

const idParam = (value) => {
  const r = objectIdString.safeParse(value);
  if (!r.success) throw new NotFoundError();
  return r.data;
};

function isTimedOut(attempt, now = new Date()) {
  return Boolean(attempt.deadlineAt) && now.getTime() > new Date(attempt.deadlineAt).getTime() + SUBMIT_GRACE_MS;
}

async function expireAttempt(actor, attempt) {
  const closed = await attemptRepo.closeOpenAttempt(actor.id, attempt._id, {
    status: ATTEMPT_STATUS.expired,
    submittedAt: null,
    submitReason: "timeout",
    result: null,
  });
  if (closed) logger.info("exam_expired", { userId: actor.id, attemptId: String(attempt._id) });
  return closed ?? (await attemptRepo.findOwnAttempt(actor.id, attempt._id));
}

// --- Visibility -----------------------------------------------------------------------
// An exam is available to learners only when the exam and its level are approved and
// published, and every exercise it uses is published and scored automatically. Anything
// less and the exam doesn't exist for learners (fail closed, as for lessons).

async function loadAvailableExam(filter) {
  const exam = await examRepository.findOne({ ...filter, ...LEARNER_VISIBLE });
  if (!exam) return null;
  const level = await levelRepository.findOne({ code: exam.levelCode, ...LEARNER_VISIBLE });
  if (!level) return null;
  const exercises = await exerciseRepository.findManyByIds(examExerciseIds(exam), LEARNER_VISIBLE);
  const byId = new Map(exercises.map((d) => [String(d._id), d]));
  if (!examReadiness(exam, byId, { isLive: isVisibleToLearners }).ready) return null;
  return { exam, level, exercisesById: byId };
}

function historyEntry(a) {
  return {
    id: a._id,
    status: a.status,
    startedAt: a.startedAt,
    deadlineAt: a.deadlineAt ?? null,
    submittedAt: a.submittedAt ?? null,
    score: a.result?.score ?? null,
    maxScore: a.result?.maxScore ?? null,
    ratio: a.result?.ratio ?? null,
    passed: a.result ? a.result.passed : null,
  };
}

function examSummary(exam, questionCount) {
  return {
    id: exam._id,
    levelCode: exam.levelCode,
    slug: exam.slug,
    order: exam.order,
    title: exam.title,
    description: exam.description ?? null,
    instructions: exam.instructions ?? null,
    durationMinutes: exam.durationMinutes ?? null,
    passThreshold: exam.passThreshold,
    reviewPolicy: exam.reviewPolicy,
    questionCount,
    sections: exam.sections.map((s) => ({ key: s.key, title: s.title })),
    aiGenerated: exam.sourceType === "ai_generated",
  };
}

const questionCountOf = (exam, exercisesById) => examExerciseIds(exam).reduce((n, id) => n + (exercisesById.get(id)?.items.length ?? 0), 0);

// Published exams of a level, with the learner's own attempt summary.
export async function listLearnerExams(actor, levelCode) {
  assertLearner(actor);
  const code = levelCodeSchema.safeParse(String(levelCode ?? "").toUpperCase());
  if (!code.success) throw new NotFoundError();
  const { items } = await examRepository.list({ levelCode: code.data, ...LEARNER_VISIBLE }, { pageSize: 50 });
  const available = (await Promise.all(items.map((e) => loadAvailableExam({ _id: e._id })))).filter(Boolean);
  const attempts = await attemptRepo.listOwnAttemptsForExams(actor.id, available.map((a) => a.exam._id));
  return serialize(
    available.map(({ exam, exercisesById }) => {
      const own = attempts.filter((a) => String(a.examId) === String(exam._id));
      const graded = own.filter((a) => a.result);
      return {
        ...examSummary(exam, questionCountOf(exam, exercisesById)),
        attempts: {
          count: graded.length,
          best: graded.length ? Math.max(...graded.map((a) => a.result.ratio ?? 0)) : null,
          passed: graded.some((a) => a.result.passed),
          last: own[0] ? historyEntry(own[0]) : null,
          open: own.find((a) => a.status === ATTEMPT_STATUS.inProgress && !isTimedOut(a)) ? true : false,
        },
      };
    }),
  );
}

// Exam start page: what the exam contains, the rules, and the learner's history.
export async function getLearnerExam(actor, { level: levelParam, exam: examParam }) {
  assertLearner(actor);
  const code = levelCodeSchema.safeParse(String(levelParam ?? "").toUpperCase());
  const slug = slugSchema.safeParse(examParam);
  if (!code.success || !slug.success) throw new NotFoundError();
  const found = await loadAvailableExam({ levelCode: code.data, slug: slug.data });
  if (!found) throw new NotFoundError();
  const history = await attemptRepo.listOwnAttempts(actor.id, found.exam._id);
  const open = history.find((a) => a.status === ATTEMPT_STATUS.inProgress && !isTimedOut(a));
  return serialize({
    exam: examSummary(found.exam, questionCountOf(found.exam, found.exercisesById)),
    level: { code: found.level.code, title: found.level.title },
    openAttemptId: open?._id ?? null,
    history: history.map(historyEntry),
  });
}

// --- Taking an exam -----------------------------------------------------------------------

const startSchema = z.object({ examId: objectIdString });

// Starts an attempt, or resumes the open one. A timed-out open attempt is closed as
// expired first. The exam must be available to learners right now.
export async function startExamAttempt(actor, input) {
  assertLearner(actor);
  const { examId } = parseOrThrow(startSchema, input, "Invalid request.");
  await enforceRateLimit(RATE_LIMITS.learningByUser, actor.id);
  const found = await loadAvailableExam({ _id: toObjectId(examId) });
  if (!found) throw new NotFoundError();

  for (let tries = 0; tries < 2; tries++) {
    const open = await attemptRepo.findOpenAttempt(actor.id, examId);
    if (open && !isTimedOut(open)) return serialize({ attemptId: open._id, resumed: true });
    if (open) await expireAttempt(actor, open);

    const now = new Date();
    const snapshot = buildExamSnapshot(found.exam, found.exercisesById);
    const inserted = await attemptRepo.insertOpenAttempt({
      userId: toObjectId(actor.id),
      examId: found.exam._id,
      examVersion: found.exam.version,
      levelCode: found.exam.levelCode,
      status: ATTEMPT_STATUS.inProgress,
      seed: randomBytes(16).toString("hex"),
      snapshot,
      startedAt: now,
      deadlineAt: snapshot.durationMinutes ? new Date(now.getTime() + snapshot.durationMinutes * 60_000) : null,
      submittedAt: null,
      submitReason: null,
      answers: null,
      result: null,
      updatedAt: now,
    });
    if (inserted) {
      logger.info("exam_started", { userId: actor.id, examId, attemptId: String(inserted._id) });
      return serialize({ attemptId: inserted._id, resumed: false });
    }
    // A concurrent start won the unique index; loop once to resume it.
  }
  throw new ConflictError("This exam is already being started. Reload the page.");
}

async function resolvers(snapshot) {
  const exercises = snapshotExercises(snapshot);
  const audio = await createExerciseAudioResolver(exercises, exercises.flatMap(exerciseCues));
  const image = await createImageResolver(exercises.flatMap((ex) => contentImageIds("exercises", ex)));
  return { audio, image };
}

function attemptHeader(attempt) {
  const s = attempt.snapshot;
  return {
    id: attempt._id,
    examId: attempt.examId,
    status: attempt.status,
    exam: { levelCode: s.levelCode, slug: s.slug, title: s.title, reviewPolicy: s.reviewPolicy, durationMinutes: s.durationMinutes, aiGenerated: s.aiGenerated },
    startedAt: attempt.startedAt,
    deadlineAt: attempt.deadlineAt ?? null,
  };
}

async function resultFor(attempt) {
  const { audio, image } = await resolvers(attempt.snapshot);
  return examResultView(attempt.snapshot, attempt, { seedPrefix: attempt.seed, audio, image });
}

// The attempt page: the running exam (questions without answer keys, deadline and the
// server's clock for the timer), or the result once it's finished.
export async function getExamAttempt(actor, attemptId) {
  assertLearner(actor);
  let attempt = await attemptRepo.findOwnAttempt(actor.id, idParam(attemptId));
  if (!attempt) throw new NotFoundError();
  if (attempt.status === ATTEMPT_STATUS.inProgress && isTimedOut(attempt)) attempt = await expireAttempt(actor, attempt);

  if (attempt.status === ATTEMPT_STATUS.inProgress) {
    const { audio, image } = await resolvers(attempt.snapshot);
    return serialize({
      ...attemptHeader(attempt),
      serverNow: new Date(),
      graceSeconds: SUBMIT_GRACE_MS / 1000,
      paper: toClientExam(attempt.snapshot, { seedPrefix: attempt.seed, audio, image }),
    });
  }
  return serialize({ ...attemptHeader(attempt), view: await resultFor(attempt) });
}

const submitSchema = z.object({
  attemptId: objectIdString,
  answers: examAnswersSchema,
  reason: z.enum(["user", "timer"]).default("user"),
});

// Grades and closes an open attempt. Rejected (nothing written) when the attempt isn't
// the learner's, is already submitted or expired, or the time is up (then it is closed as
// expired). Unanswered questions score 0.
export async function submitExamAttempt(actor, input) {
  assertLearner(actor);
  const { attemptId, answers, reason } = parseOrThrow(submitSchema, input, "Invalid submission.");
  await enforceRateLimit(RATE_LIMITS.learningByUser, actor.id);
  const attempt = await attemptRepo.findOwnAttempt(actor.id, attemptId);
  if (!attempt) throw new NotFoundError();
  if (attempt.status !== ATTEMPT_STATUS.inProgress) throw new ConflictError("This exam has already been submitted.");
  if (isTimedOut(attempt)) {
    await expireAttempt(actor, attempt);
    throw new ConflictError("The time for this exam is up. The attempt was closed without a score.");
  }

  const kept = sanitizeExamAnswers(attempt.snapshot, answers);
  const result = gradeExam(attempt.snapshot, kept, { seedPrefix: attempt.seed });
  const closed = await attemptRepo.closeOpenAttempt(actor.id, attemptId, {
    status: ATTEMPT_STATUS.submitted,
    submittedAt: new Date(),
    submitReason: reason,
    answers: kept,
    result,
  });
  if (!closed) throw new ConflictError("This exam has already been submitted.");
  logger.info("exam_submitted", { userId: actor.id, attemptId, score: result.score, maxScore: result.maxScore, passed: result.passed });
  return serialize({ ...attemptHeader(closed), view: await resultFor(closed) });
}

// --- CMS preview ------------------------------------------------------------------------
// A reviewer takes an exam in any lifecycle state through the same exam UI, graded by the
// same functions, without writing anything: no attempt, no rate-limit counter, no log.
// The timer runs only in the browser. The preview always shows the full review (the
// reviewer checks the answer keys) and says which policy learners get.

async function loadPreviewExam(examId) {
  const exam = await examRepository.findById(idParam(examId));
  if (!exam) throw new NotFoundError();
  const exercises = await exerciseRepository.findManyByIds(examExerciseIds(exam));
  const byId = new Map(exercises.map((d) => [String(d._id), d]));
  const level = await levelRepository.findOne({ code: exam.levelCode });
  return { exam, level, exercisesById: byId };
}

function previewSeed(exam) {
  return `preview:${exam._id}:${exam.version}`;
}

function previewStatus(exam, level, exercisesById) {
  const readiness = examReadiness(exam, exercisesById, { isLive: isVisibleToLearners });
  return {
    reviewStatus: exam.reviewStatus,
    publishStatus: exam.publishStatus,
    version: exam.version,
    levelVisible: isVisibleToLearners(level),
    problems: readiness.problems,
    learnerVisible: isVisibleToLearners(exam) && isVisibleToLearners(level) && readiness.ready,
  };
}

// Only the exercises that still exist are included, so a broken exam can still be checked.
function previewSnapshot(exam, exercisesById) {
  const present = { ...exam, sections: exam.sections.map((s) => ({ ...s, exerciseIds: s.exerciseIds.filter((id) => exercisesById.has(String(id))) })) };
  return buildExamSnapshot(present, exercisesById);
}

export async function getExamPreview(actor, examId) {
  assertCanPreview(actor);
  const { exam, level, exercisesById } = await loadPreviewExam(examId);
  const snapshot = previewSnapshot(exam, exercisesById);
  const { audio, image } = await resolvers(snapshot);
  return serialize({
    id: exam._id,
    preview: previewStatus(exam, level, exercisesById),
    exam: { levelCode: exam.levelCode, slug: exam.slug, title: exam.title, reviewPolicy: exam.reviewPolicy, durationMinutes: exam.durationMinutes ?? null, aiGenerated: snapshot.aiGenerated },
    questionCount: snapshotQuestionCount(snapshot),
    paper: toClientExam(snapshot, { seedPrefix: previewSeed(exam), audio, image }),
  });
}

const previewSubmitSchema = z.object({ examId: objectIdString, answers: examAnswersSchema });

export async function previewExamSubmission(actor, input) {
  assertCanPreview(actor);
  const { examId, answers } = parseOrThrow(previewSubmitSchema, input, "Invalid submission.");
  const { exam, exercisesById } = await loadPreviewExam(examId);
  const snapshot = previewSnapshot(exam, exercisesById);
  const seedPrefix = previewSeed(exam);
  const kept = sanitizeExamAnswers(snapshot, answers);
  const result = gradeExam(snapshot, kept, { seedPrefix });
  const { audio, image } = await resolvers(snapshot);
  const fake = { status: ATTEMPT_STATUS.submitted, startedAt: null, submittedAt: new Date(), submitReason: "user", answers: kept, result };
  return serialize({
    preview: true,
    learnerPolicy: exam.reviewPolicy,
    view: examResultView(snapshot, fake, { policy: "full", seedPrefix, audio, image }),
  });
}
