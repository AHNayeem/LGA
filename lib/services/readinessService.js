import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { APPROVAL_BASIS, isVisibleToLearners, PUBLISH_STATUS, REVIEW_STATUS } from "@/lib/content/lifecycle";
import { COLLECTIONS } from "@/lib/db/collections";
import { toLevelCode } from "@/lib/services/curriculumService";
import { examRepository, exerciseRepository, levelRepository, moduleRepository, referenceRepository } from "@/lib/repositories/contentRepository";
import { findCurriculumUploadsByIds } from "@/lib/repositories/mediaAssetRepository";
import { exerciseSchema, grammarTopicSchema, lessonSchema, vocabularySchema, EXERCISE_BLOCK_TYPES } from "@/lib/validation/content";
import { gradeExercise, isGradedExercise } from "@/lib/exercises/engine";
import { keyAnswers } from "@/lib/exercises/answerKey";
import { exerciseMediaIds } from "@/lib/audio/cues";
import { isUsableCurriculumMedia, missingRequiredAudio } from "@/lib/services/audioService";
import { unusableImageRefs } from "@/lib/services/imageService";
import { examReadiness } from "@/lib/exams/exam";
import { getModuleReview, lessonDependencies } from "@/lib/services/contentService";
import { moduleReadinessReport } from "@/lib/services/publishCheckService";
import { getLevelStructure } from "@/lib/services/journeyService";
import { checkContinuation } from "@/lib/learning/continuation";
import { GOETHE_PART_SKILLS } from "@/lib/learning/goethe";
import { serialize } from "@/lib/db/serialize";
import { LEVEL_REVIEW_NOTES, REVIEW_FINDINGS } from "@/content/curriculum/a1/review-findings";

// Level-wide curriculum readiness (read-only): what is live for learners, what could be
// published, and what stops the rest. It checks the STORED content, so it also catches
// problems introduced by CMS edits after seeding (the source files have their own
// integrity tests in tests/unit/curriculum-*.test.js).
//
// Per lesson, one readiness state, the first that applies:
//   blocked        structural problems: broken or archived references, duplicate block
//                  keys, invalid content, answer keys that don't score, unusable media,
//                  invalid Goethe links
//   needs_audio    required listening audio has no playable source
//   needs_review   the lesson or anything it uses isn't approved, carries a test-fixture
//                  approval, or has an open finding from the content QA
//                  (content/curriculum/a1/review-findings.js)
//   ready          everything approved by a person, audio present, no open findings
// and separately whether learners can open it now (`live`). "Ready" is a factual check,
// never a judgement of educational quality: that stays a person's review.
//
// Level/module problems: lesson order gaps or duplicates, a published level or module
// with no lesson a learner can open, and the "Continue"/"next module" sequence
// (lib/learning/continuation.js).
//
// Nothing here writes, publishes or approves anything.

export const LESSON_READINESS = Object.freeze({ blocked: "blocked", needsAudio: "needs_audio", needsReview: "needs_review", ready: "ready" });

const TYPE_BY_COLLECTION = { exercises: "exercise", grammarTopics: "grammar", vocabulary: "word" };
const SCHEMAS = { exercises: exerciseSchema, grammarTopics: grammarTopicSchema, vocabulary: vocabularySchema };

function assertCanRead(actor) {
  if (!hasPermission(actor, PERMISSIONS.contentReadDrafts)) throw new ForbiddenError();
}

// Stored documents keep unset optional fields as null (e.g. sourceReference: null from the
// CMS); the schemas describe the authoring input, where they are simply absent. Nullable
// fields default to null, so dropping top-level nulls validates what was actually saved.
const asInput = (doc) => Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== null));

function issueText(error) {
  const first = error.issues[0];
  return `${first.path.join(".") || "(root)"}: ${first.message}${error.issues.length > 1 ? ` (+${error.issues.length - 1} more)` : ""}`;
}

// The answer key scores 100% with the right answers and doesn't pass with wrong ones.
export function answerKeyProblem(exercise, id) {
  try {
    const right = gradeExercise(exercise, keyAnswers(exercise, id), { exerciseId: id });
    if (!right.passed) return "the answer key does not pass its own exercise";
    if (!isGradedExercise(exercise)) return exercise.skill === "speaking" ? null : "only speaking practice may be ungraded";
    if (right.ratio !== 1) return `the answer key scores ${Math.round(right.ratio * 100)}%, not 100%`;
    const wrong = gradeExercise(exercise, keyAnswers(exercise, id, { wrong: true }), { exerciseId: id });
    if (wrong.passed) return "wrong answers pass the exercise";
    return null;
  } catch (err) {
    return `the answer key can't be checked (${err.message})`;
  }
}

// Goethe links on an exercise: every reference must exist; a Goethe exam part must be a
// child of an exam specification and match the exercise's skill.
function goetheProblems(ex, refsById) {
  const out = [];
  for (const link of ex.refs ?? []) {
    const ref = refsById.get(String(link.referenceId));
    if (!ref) {
      out.push(`links to a reference that doesn't exist (${link.referenceId})`);
      continue;
    }
    if (ref.kind !== "exam_spec") continue;
    const parent = ref.parentId ? refsById.get(String(ref.parentId)) : null;
    if (!parent) {
      out.push(`links to the whole exam "${ref.title}" instead of one exam part`);
      continue;
    }
    const key = ref.slug.startsWith(`${parent.slug}-`) ? ref.slug.slice(parent.slug.length + 1) : null;
    const skill = key ? GOETHE_PART_SKILLS[key] : undefined;
    if (!skill) out.push(`links to an unknown Goethe part "${ref.slug}"`);
    else if (skill !== ex.skill) out.push(`is a ${ex.skill} exercise but is linked to Goethe ${ref.title} (${skill})`);
  }
  return out;
}

async function loadReferences(docs) {
  const ids = new Set(docs.flatMap((d) => (d.refs ?? []).map((r) => String(r.referenceId))));
  const refs = await referenceRepository.findManyByIds([...ids]);
  const parents = await referenceRepository.findManyByIds(refs.map((r) => r.parentId).filter(Boolean));
  return new Map(serialize([...refs, ...parents]).map((r) => [r.id, r]));
}

async function usableRecordingIds(exercises) {
  const ids = [...new Set(exercises.flatMap(exerciseMediaIds).map(String))];
  if (ids.length === 0) return new Set();
  return new Set((await findCurriculumUploadsByIds(ids)).filter(isUsableCurriculumMedia).map((a) => String(a._id)));
}

// Open QA findings by collection and slug (the findings list covers A1).
function findingsIndex(levelCode) {
  const index = new Map();
  for (const f of levelCode === "A1" ? REVIEW_FINDINGS : []) {
    for (const t of f.targets) {
      const key = `${t.collection}:${t.slug}`;
      if (!index.has(key)) index.set(key, []);
      index.get(key).push({ id: f.id, kind: f.kind, note: f.note, items: t.items ?? null, slug: t.slug });
    }
  }
  return index;
}

// Problems of one stored item (exercise, grammar topic, word), computed once per module.
async function itemProblems(collection, doc, ctx) {
  const problems = [];
  const parsed = SCHEMAS[collection].safeParse(asInput(doc));
  if (!parsed.success) problems.push(`invalid content: ${issueText(parsed.error)}`);
  if (doc.publishStatus === PUBLISH_STATUS.archived) problems.push("is archived");
  if (collection === COLLECTIONS.exercises) {
    if (parsed.success) {
      const key = answerKeyProblem(parsed.data, doc.id);
      if (key) problems.push(key);
    }
    const unusable = exerciseMediaIds(doc).map(String).filter((id) => !ctx.recordings.has(id));
    if (unusable.length) problems.push(`${unusable.length} attached recording(s) are missing or archived`);
    problems.push(...goetheProblems(doc, ctx.refs));
  }
  const images = await unusableImageRefs(collection, doc);
  if (images.length) problems.push(`${images.length} attached image(s) are missing or archived`);
  return problems;
}

function approvalOf(docs) {
  const notApproved = docs.filter((d) => d.reviewStatus !== REVIEW_STATUS.approved).length;
  const fixture = docs.filter((d) => d.reviewStatus === REVIEW_STATUS.approved && d.approvalBasis === APPROVAL_BASIS.testFixture).length;
  return { total: docs.length, approved: docs.length - notApproved, notApproved, testFixture: fixture };
}

// Duplicate positions make the order ambiguous (an error); gaps are harmless for learners
// (lessons are sorted, "next" skips them) but usually mean something is missing (a warning).
function orderProblems(label, docs) {
  const orders = docs.map((d) => d.order).sort((a, b) => a - b);
  const errors = [];
  const warnings = [];
  const dups = orders.filter((o, i) => i > 0 && orders[i - 1] === o);
  if (dups.length) errors.push(`${label}: duplicate order ${[...new Set(dups)].join(", ")}`);
  const gaps = orders.filter((o, i) => i > 0 && o - orders[i - 1] > 1).length;
  if (gaps) warnings.push(`${label}: the order has ${gaps} gap(s) (${orders.join(", ")})`);
  return { errors, warnings };
}

async function moduleReadiness(actor, mod, ctx) {
  const data = await getModuleReview(actor, String(mod._id));
  const report = await moduleReadinessReport(data);
  const byId = {
    exercises: new Map(data.exercises.map((d) => [d.id, d])),
    grammarTopics: new Map(data.grammarTopics.map((d) => [d.id, d])),
    vocabulary: new Map(data.vocabulary.map((d) => [d.id, d])),
  };
  const recordings = await usableRecordingIds(data.exercises);
  const refs = await loadReferences([...data.exercises, ...data.grammarTopics, ...data.vocabulary]);
  const problemsOf = new Map();
  for (const [collection, docs] of Object.entries(byId)) {
    for (const doc of docs.values()) problemsOf.set(`${collection}:${doc.id}`, await itemProblems(collection, doc, { recordings, refs }));
  }

  // Archived lessons are retired on purpose: not part of the journey, not reported.
  const current = data.lessons.filter((l) => l.publishStatus !== PUBLISH_STATUS.archived);
  const order = orderProblems("lessons", current);
  const errors = [...order.errors];
  const warnings = [...order.warnings];
  const lessons = [];
  const usage = new Map(); // exercise id → lesson slugs (the same exercise in two lessons)

  for (const lesson of [...current].sort((a, b) => a.order - b.order)) {
    const problems = [];
    const lessonParse = lessonSchema.safeParse(asInput(lesson));
    if (!lessonParse.success) problems.push(`lesson: invalid content: ${issueText(lessonParse.error)}`);
    if (!lesson.blocks?.length) problems.push("lesson: has no blocks");
    const keys = (lesson.blocks ?? []).map((b) => b.key);
    const dupKeys = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
    if (dupKeys.length) problems.push(`lesson: duplicate block key(s) ${dupKeys.join(", ")}`);
    const lessonImages = await unusableImageRefs(COLLECTIONS.lessons, lesson);
    if (lessonImages.length) problems.push(`lesson: ${lessonImages.length} attached image(s) are missing or archived`);

    const deps = lessonDependencies(lesson);
    const depDocs = [];
    const findings = [];
    const lessonWarnings = [];
    const check = (collection, ids) => {
      const seen = new Set();
      for (const raw of ids) {
        const id = String(raw);
        if (seen.has(id)) {
          lessonWarnings.push(`${TYPE_BY_COLLECTION[collection]} ${byId[collection].get(id)?.slug ?? id} is used twice in this lesson`);
          continue;
        }
        seen.add(id);
        const doc = byId[collection].get(id);
        if (!doc) {
          problems.push(`broken reference: ${TYPE_BY_COLLECTION[collection]} ${id} doesn't exist`);
          continue;
        }
        depDocs.push(doc);
        for (const p of problemsOf.get(`${collection}:${id}`)) problems.push(`${TYPE_BY_COLLECTION[collection]} ${doc.slug}: ${p}`);
        findings.push(...(ctx.findings.get(`${collection}:${doc.slug}`) ?? []));
        if (collection === COLLECTIONS.exercises) usage.set(id, [...(usage.get(id) ?? []), lesson.slug]);
      }
    };
    check(COLLECTIONS.exercises, deps.exercises);
    check(COLLECTIONS.grammarTopics, deps.grammar);
    check(COLLECTIONS.vocabulary, deps.vocabulary);

    const exerciseDocs = depDocs.filter((d) => byId.exercises.has(d.id));
    const audioMissing = exerciseDocs.reduce((n, d) => n + (d.missingAudio ?? 0), 0);
    const approval = approvalOf([lesson, ...depDocs]);
    const live = ctx.openable.has(lesson.id);
    const status = problems.length
      ? LESSON_READINESS.blocked
      : audioMissing > 0
        ? LESSON_READINESS.needsAudio
        : approval.notApproved || approval.testFixture || findings.length
          ? LESSON_READINESS.needsReview
          : LESSON_READINESS.ready;
    if (lesson.publishStatus === PUBLISH_STATUS.published && isVisibleToLearners(lesson) && !live && isVisibleToLearners(mod)) {
      lessonWarnings.push("published, but learners can't open it: something it uses isn't approved and published");
    }
    lessons.push({
      id: lesson.id,
      slug: lesson.slug,
      order: lesson.order,
      title: lesson.title,
      reviewStatus: lesson.reviewStatus,
      publishStatus: lesson.publishStatus,
      live,
      status,
      audioMissing,
      approval,
      findings,
      problems,
      warnings: lessonWarnings,
    });
  }
  for (const [id, slugs] of usage) {
    if (slugs.length > 1) warnings.push(`exercise ${byId.exercises.get(id)?.slug ?? id} is used in ${slugs.length} lessons (${slugs.join(", ")}); progress is kept per lesson`);
  }

  const visible = isVisibleToLearners(mod) && ctx.levelVisible;
  const openable = lessons.filter((l) => l.live).length;
  if (isVisibleToLearners(mod) && openable === 0) {
    errors.push("the module is published, but learners can't open any of its lessons (they see an empty module)");
  }

  return {
    id: String(mod._id),
    slug: mod.slug,
    order: mod.order,
    title: mod.title,
    reviewStatus: mod.reviewStatus,
    publishStatus: mod.publishStatus,
    visible,
    lessons,
    counts: Object.fromEntries(Object.values(LESSON_READINESS).map((s) => [s, lessons.filter((l) => l.status === s).length])),
    live: openable,
    audio: { requiredMissing: report.audio.requiredMissing, vocabularyMissing: report.audio.vocabularyMissing },
    approvals: report.approvals,
    items: report.items,
    // The module pre-publish check (content:check) and the structural checks above.
    errors: [...errors, ...report.errors.filter((e) => !e.includes("audio clip"))],
    warnings: [...warnings, ...report.warnings],
  };
}

async function examsReadiness(levelCode, ctx) {
  const { items } = await examRepository.list({ levelCode, publishStatus: { $ne: PUBLISH_STATUS.archived } }, { pageSize: 100 });
  const out = [];
  for (const exam of items) {
    const exercises = serialize(await exerciseRepository.findManyByIds(exam.sections.flatMap((s) => s.exerciseIds)));
    const byId = new Map(exercises.map((e) => [e.id, e]));
    const readiness = examReadiness(serialize(exam), byId, { isLive: isVisibleToLearners });
    const recordings = await usableRecordingIds(exercises);
    const refs = await loadReferences(exercises);
    const problems = [...readiness.problems];
    let audioMissing = 0;
    const findings = [];
    for (const ex of exercises) {
      audioMissing += (await missingRequiredAudio(ex)).length;
      for (const p of await itemProblems(COLLECTIONS.exercises, ex, { recordings, refs })) problems.push(`exercise ${ex.slug}: ${p}`);
      findings.push(...(ctx.findings.get(`exercises:${ex.slug}`) ?? []));
    }
    const unknownSections = exam.sections.filter((s) => !GOETHE_PART_SKILLS[s.key]).map((s) => s.key);
    const warnings = unknownSections.length ? [`section(s) ${unknownSections.join(", ")} don't match a Goethe part, so results can't link to part practice`] : [];
    const approval = approvalOf([serialize(exam), ...exercises]);
    const live = isVisibleToLearners(exam) && ctx.levelVisible;
    const status = problems.some((p) => !p.includes("not published"))
      ? LESSON_READINESS.blocked
      : audioMissing > 0
        ? LESSON_READINESS.needsAudio
        : approval.notApproved || approval.testFixture || findings.length
          ? LESSON_READINESS.needsReview
          : LESSON_READINESS.ready;
    out.push({
      id: String(exam._id),
      slug: exam.slug,
      title: exam.title,
      reviewStatus: exam.reviewStatus,
      publishStatus: exam.publishStatus,
      live,
      status,
      audioMissing,
      approval,
      findings,
      problems,
      warnings,
    });
  }
  return out;
}

export async function checkLevelReadiness(actor, levelParam) {
  assertCanRead(actor);
  const code = toLevelCode(levelParam);
  const level = await levelRepository.findOne({ code });
  if (!level) throw new NotFoundError();
  const levelVisible = isVisibleToLearners(level);

  // What learners can open right now: the same structure the learner pages use.
  let structure = null;
  if (levelVisible) structure = serialize(await getLevelStructure(code));
  const openable = new Set(structure ? structure.modules.flatMap((m) => m.lessons.map((l) => l.id)) : []);

  const { items: mods } = await moduleRepository.list({ levelCode: code, publishStatus: { $ne: PUBLISH_STATUS.archived } }, { pageSize: 100 });
  const ctx = { levelVisible, openable, findings: findingsIndex(code) };
  const modules = [];
  for (const mod of mods) modules.push(await moduleReadiness(actor, mod, ctx));
  const exams = await examsReadiness(code, ctx);

  const order = orderProblems("modules", mods);
  const errors = [...order.errors];
  const warnings = [...order.warnings];
  if (levelVisible && openable.size === 0) errors.push("the level is published, but learners can't open any lesson");
  if (!levelVisible) warnings.push("the level isn't published: learners see nothing of it");
  const continuation = structure ? checkContinuation(structure) : { ok: true, lessons: 0, visited: 0, problems: [] };
  errors.push(...continuation.problems);

  const lessons = modules.flatMap((m) => m.lessons);
  const findingIds = new Set([...lessons, ...exams].flatMap((x) => x.findings.map((f) => f.id)));
  return {
    level: { code: level.code, title: level.title, reviewStatus: level.reviewStatus, publishStatus: level.publishStatus, visible: levelVisible },
    summary: {
      modules: modules.length,
      lessons: lessons.length,
      live: lessons.filter((l) => l.live).length,
      ...Object.fromEntries(Object.values(LESSON_READINESS).map((s) => [s, lessons.filter((l) => l.status === s).length])),
      audioMissing: lessons.reduce((n, l) => n + l.audioMissing, 0),
      openFindings: findingIds.size,
      errors: errors.length + modules.reduce((n, m) => n + m.errors.length, 0) + lessons.reduce((n, l) => n + l.problems.length, 0),
    },
    modules,
    exams,
    continuation,
    notes: code === "A1" ? LEVEL_REVIEW_NOTES : [],
    errors,
    warnings,
    ok: errors.length === 0 && modules.every((m) => m.errors.length === 0) && lessons.every((l) => l.problems.length === 0),
  };
}
