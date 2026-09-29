import { exerciseCues, requiredExerciseCues, vocabularyCues } from "@/lib/audio/cues";
import { APPROVAL_BASIS, PUBLISH_STATUS, REVIEW_STATUS } from "@/lib/content/lifecycle";
import { EXERCISE_BLOCK_TYPES } from "@/lib/validation/content";
import { findMissingAudio } from "@/lib/services/audioService";
import { getModuleReview } from "@/lib/services/contentService";

// Pre-publish report for one module (read-only). Errors block publishing to learners;
// warnings are things a person must know (e.g. approvals that were not real reviews).
//
//   - every required audio clip exists (listening stimuli, per-item audio), reported per
//     lesson so the module test's listening part is visible on its own
//   - no published item depends on an unpublished one; nothing published is unapproved
//   - provenance is unchanged (e.g. still "ai_generated")
//   - approval basis (human review vs. test fixture) and unreviewed Bangla are surfaced

const TEST_BLOCKS = new Set(["mini_test", "mastery_check"]);

function hasBangla(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(hasBangla);
  if (typeof value.bn === "string" && value.bn.trim()) return true;
  return Object.values(value).some(hasBangla);
}

export async function checkModuleReadiness(actor, moduleId, { expectedSourceType = null } = {}) {
  const data = await getModuleReview(actor, moduleId);
  const errors = [];
  const warnings = [];
  const exById = new Map(data.exercises.map((e) => [e.id, e]));
  const all = [
    ["module", data.module],
    ...data.lessons.map((d) => ["lesson", d]),
    ...data.exercises.map((d) => ["exercise", d]),
    ...data.grammarTopics.map((d) => ["grammar", d]),
    ...data.vocabulary.map((d) => ["vocabulary", d]),
  ];
  const published = new Set(all.filter(([, d]) => d.publishStatus === PUBLISH_STATUS.published).map(([, d]) => d.id));

  // Audio, per lesson.
  const audio = { requiredMissing: 0, optionalMissing: 0, listeningExercises: 0, byLesson: [] };
  for (const lesson of data.lessons) {
    const entry = { lesson: lesson.slug, requiredMissing: 0, testListeningMissing: 0 };
    for (const b of lesson.blocks) {
      if (!EXERCISE_BLOCK_TYPES.includes(b.type)) continue;
      const ex = exById.get(String(b.refId));
      if (!ex) continue;
      const required = requiredExerciseCues(ex);
      if (required.length) audio.listeningExercises++;
      const missing = (await findMissingAudio(required)).length;
      entry.requiredMissing += missing;
      if (TEST_BLOCKS.has(b.type) || lesson.slug.includes("test")) entry.testListeningMissing += missing;
      if (missing) errors.push(`${lesson.slug} › ${ex.slug}: ${missing} required audio clip(s) missing`);
      const optional = exerciseCues(ex).length - required.length;
      if (optional > 0) {
        const optionalMissing = (await findMissingAudio(exerciseCues(ex))).length - missing;
        audio.optionalMissing += optionalMissing;
      }
    }
    audio.requiredMissing += entry.requiredMissing;
    audio.byLesson.push(entry);
  }
  const vocabMissing = (await findMissingAudio(data.vocabulary.flatMap(vocabularyCues))).length;
  if (vocabMissing) warnings.push(`${vocabMissing} vocabulary audio clip(s) missing (cards fall back to "audio not available").`);
  if (audio.optionalMissing) warnings.push(`${audio.optionalMissing} model-answer audio clip(s) missing.`);

  // Lifecycle consistency and dependencies.
  for (const [kind, d] of all) {
    if (d.publishStatus === PUBLISH_STATUS.published && d.reviewStatus !== REVIEW_STATUS.approved) {
      errors.push(`${kind} ${d.slug}: published but not approved`);
    }
  }
  for (const lesson of data.lessons.filter((l) => published.has(l.id))) {
    const deps = lesson.blocks.flatMap((b) => (b.vocabIds ?? []).concat(b.refId ? [b.refId] : [])).map(String);
    const unpublished = deps.filter((id) => !published.has(id));
    if (unpublished.length) errors.push(`lesson ${lesson.slug}: published but uses ${unpublished.length} unpublished item(s)`);
  }

  // Provenance and approvals.
  if (expectedSourceType) {
    const wrong = all.filter(([, d]) => d.sourceType !== expectedSourceType);
    for (const [kind, d] of wrong) errors.push(`${kind} ${d.slug}: sourceType is "${d.sourceType}", expected "${expectedSourceType}"`);
  }
  const approved = all.filter(([, d]) => d.reviewStatus === REVIEW_STATUS.approved);
  const fixture = approved.filter(([, d]) => d.approvalBasis === APPROVAL_BASIS.testFixture).length;
  if (fixture) warnings.push(`${fixture} item(s) carry a TEST-FIXTURE approval: not a genuine content review. Do not release to real learners.`);
  const aiGenerated = all.filter(([, d]) => d.sourceType === "ai_generated").length;
  if (aiGenerated) warnings.push(`${aiGenerated} item(s) are ai_generated; learners see the "not yet reviewed by a native speaker" notice.`);
  const bangla = all.filter(([, d]) => hasBangla(d)).length;
  if (bangla) warnings.push(`${bangla} item(s) contain Bangla text that needs review by a Bangla speaker.`);

  const count = (key) => Object.fromEntries(Object.entries(Object.groupBy(all, ([, d]) => d[key] ?? "none")).map(([k, v]) => [k, v.length]));
  return {
    ok: errors.length === 0,
    module: data.module.slug,
    items: all.length,
    reviewStatus: count("reviewStatus"),
    publishStatus: count("publishStatus"),
    sourceType: count("sourceType"),
    approvals: { total: approved.length, testFixture: fixture, humanReview: approved.length - fixture },
    audio: { ...audio, vocabularyMissing: vocabMissing },
    errors,
    warnings,
  };
}
