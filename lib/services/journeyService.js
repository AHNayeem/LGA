import { serialize } from "@/lib/db/serialize";
import { NotFoundError } from "@/lib/errors";
import { levelRepository, LEARNER_VISIBLE } from "@/lib/repositories/contentRepository";
import * as progressRepo from "@/lib/repositories/progressRepository";
import * as userVocabRepo from "@/lib/repositories/userVocabularyRepository";
import * as examAttemptRepo from "@/lib/repositories/examAttemptRepository";
import { buildCurriculumStructure, findVisibleLevel } from "@/lib/services/curriculumService";
import { listExamSummaries } from "@/lib/services/examService";
import { learnerStateFromDocs } from "@/lib/learning/state";
import { goetheHref } from "@/lib/learning/journey";

// The learner journey (dashboard, level, module, review and Goethe pages):
//
//   getLevelStructure(code)          the level's published content, no learner data
//   loadLearnerState(actor, s)       a signed-in learner's stored state for that content
//
// Pages then call the pure views in lib/learning/journey.js. For guests the page sends
// the structure to the browser, which runs the same views on the guest's own state, so
// no learner state is ever read from or written to the database for a guest.

// The lowest published level: the one a new learner starts with (A1 first).
export async function getStartLevelCode() {
  const { items } = await levelRepository.list(LEARNER_VISIBLE, { pageSize: 1 });
  return items[0]?.code ?? null;
}

export async function listPublishedLevels() {
  const { items } = await levelRepository.list(LEARNER_VISIBLE, { pageSize: 10 });
  return serialize(items.map((l) => ({ code: l.code, title: l.title })));
}

export async function getLevelStructure(levelCode) {
  const found = await findVisibleLevel(levelCode);
  if (!found) throw new NotFoundError();
  const [curriculum, exams] = await Promise.all([buildCurriculumStructure(found.level, found.modules), listExamSummaries(found.level.code)]);
  return { ...curriculum, exams };
}

function vocabIdsOf(structure) {
  const ids = new Set();
  for (const m of structure.modules) {
    for (const l of m.lessons) for (const b of l.blocks) for (const id of b.vocabIds ?? []) ids.add(id);
  }
  return [...ids];
}

// Everything the journey views need for this learner and this level: lesson progress,
// word review states, graded exam results and the learning profile.
export async function loadLearnerState(actor, structure) {
  if (!actor?.id) return learnerStateFromDocs();
  const lessonIds = structure.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const [progress, vocab, examAttempts] = await Promise.all([
    progressRepo.listLessonProgress(actor.id, lessonIds),
    userVocabRepo.findStates(actor.id, vocabIdsOf(structure), { limit: 5000 }),
    examAttemptRepo.listOwnAttemptsForExams(actor.id, (structure.exams ?? []).map((e) => e.id)),
  ]);
  return learnerStateFromDocs({
    progress: serialize(progress),
    vocab: serialize(vocab),
    examAttempts: serialize(examAttempts),
    profile: actor.learningProfile ?? null,
  });
}

// { [goethePartKey]: href } for the level: exam results link each section to the practice
// of the same Goethe part.
export async function goethePracticeLinks(levelCode) {
  const structure = await getLevelStructure(levelCode).catch(() => null);
  return Object.fromEntries((structure?.goethe ?? []).map((g) => [g.key, goetheHref(structure.level.code, g.key)]));
}
