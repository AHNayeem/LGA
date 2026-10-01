// Usage: bun run content:check [-- --module a1/hallo] [--source-type ai_generated]
//        bun run content:check -- --all [--level a1] [--json]
//        bun run content:check -- --explanations [--level a1] [--json] [--missing-only]
//
// Read-only pre-publish report against the configured database. Exits 1 on errors.
//
// --module   one module: required audio, lifecycle consistency, unpublished dependencies,
//            provenance, approval basis (human review vs. test fixture), unreviewed Bangla.
// --all      the whole level (lib/services/readinessService.js): per lesson whether
//            learners can open it and what blocks it (structural problems, missing audio,
//            review state, open QA findings), the exams, and the "Continue" sequence.
//            --json prints the full report instead of the table.
// --explanations  per exercise: how many scored items have an explanation, and whether a
//            wrong answer falls back to the lesson's grammar rule (lib/content/explanationReport.js).
//            Informational: never exits 1. --missing-only lists only exercises with no fallback.
import { closeClient } from "@/lib/db/client";
import { getEnv } from "@/lib/config/env";
import { ROLES } from "@/lib/auth/roles";
import { moduleRepository } from "@/lib/repositories/contentRepository";
import { checkModuleReadiness } from "@/lib/services/publishCheckService";
import { checkLevelReadiness } from "@/lib/services/readinessService";
import { getExplanationReport } from "@/lib/services/explanationReportService";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

// Read-only system actor: the report needs draft access but writes nothing.
const SYSTEM = { id: "000000000000000000000000", role: ROLES.ADMIN };

const STATUS_LABEL = { blocked: "BLOCKED", needs_audio: "needs audio", needs_review: "needs review", ready: "ready" };
const pad = (v, n) => String(v).padEnd(n);

function printLevel(r) {
  const s = r.summary;
  console.log(`Level ${r.level.code}: ${r.level.reviewStatus}/${r.level.publishStatus}${r.level.visible ? "" : " (learners see nothing)"}`);
  console.log(
    `${s.lessons} lessons: ${s.live} live · ${s.ready} ready · ${s.needs_review} need review · ${s.needs_audio} need audio · ${s.blocked} blocked · ${s.openFindings} open QA findings\n`,
  );
  for (const m of r.modules) {
    console.log(`M${m.order} ${m.slug}  ${m.reviewStatus}/${m.publishStatus}  live ${m.live}/${m.lessons.length}  required audio missing ${m.audio.requiredMissing}`);
    for (const l of m.lessons) {
      const approved = `${l.approval.approved}/${l.approval.total} approved${l.approval.testFixture ? ` (${l.approval.testFixture} test fixture)` : ""}`;
      const extra = [l.audioMissing ? `${l.audioMissing} audio missing` : null, l.findings.length ? `${l.findings.length} QA finding(s)` : null].filter(Boolean).join(", ");
      console.log(`   ${pad(l.order, 3)}${pad(l.slug, 32)}${pad(l.live ? "LIVE" : "-", 6)}${pad(STATUS_LABEL[l.status], 14)}${approved}${extra ? ` · ${extra}` : ""}`);
      for (const p of l.problems) console.log(`        ERROR ${p}`);
      for (const w of l.warnings) console.log(`        WARN  ${w}`);
      for (const f of l.findings) console.log(`        QA    ${f.id} ${f.slug}${f.items ? ` ${f.items.join("/")}` : ""}: ${f.note}`);
    }
    for (const e of m.errors) console.log(`   ERROR ${e}`);
    for (const w of m.warnings) console.log(`   WARN  ${w}`);
  }
  for (const e of r.exams) {
    console.log(`\nExam ${e.slug}  ${e.reviewStatus}/${e.publishStatus}  ${e.live ? "LIVE" : "-"}  ${STATUS_LABEL[e.status]}${e.audioMissing ? ` · ${e.audioMissing} audio missing` : ""}`);
    for (const p of e.problems) console.log(`   ERROR ${p}`);
    for (const w of e.warnings) console.log(`   WARN  ${w}`);
    for (const f of e.findings) console.log(`   QA    ${f.id} ${f.slug}${f.items ? ` ${f.items.join("/")}` : ""}: ${f.note}`);
  }
  console.log("");
  for (const e of r.errors) console.log(`ERROR ${e}`);
  for (const w of r.warnings) console.log(`WARN  ${w}`);
  for (const n of r.notes) console.log(`NOTE  ${n}`);
  console.log(r.ok ? "\nNo blocking structural problems." : `\n${s.errors} blocking problem(s).`);
}

const FALLBACK_REASON = {
  linked: "grammar rule",
  not_grammar_skill: "not a grammar exercise",
  no_grammar_topic: "lesson has no grammar topic",
  several_grammar_topics: "lesson has several grammar topics",
};

function printExplanations(r, { missingOnly }) {
  const s = r.summary;
  console.log(`Level ${r.level.code}: ${s.exercises} exercises · ${s.explainedItems}/${s.gradedItems} scored items explained`);
  console.log(`  complete ${s.complete} · grammar fallback ${s.fallback} · missing ${s.missing} · not scored ${s.ungraded}
`);
  for (const row of r.rows) {
    if (row.status === "ungraded" || row.status === "complete") continue;
    if (missingOnly && row.status !== "missing") continue;
    const where = `M${row.module.order} ${row.lesson.slug} · ${row.blockKey}`;
    const fallback = row.fallback.topic ? `→ ${row.fallback.topic.slug}` : `(${FALLBACK_REASON[row.fallback.reason] ?? row.fallback.reason})`;
    console.log(`${pad(row.status.toUpperCase(), 9)}${pad(where, 52)}${pad(row.exercise.slug, 34)}${pad(row.exercise.skill, 11)}${pad(`${row.explained}/${row.gradedItems}`, 7)}${pad(row.itemTypes.join(","), 22)}${fallback}`);
  }
}

try {
  console.log(`Database: ${getEnv().MONGODB_DB}`);
  if (args.includes("--explanations")) {
    const report = await getExplanationReport(SYSTEM, option("level", "a1"));
    if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
    else printExplanations(report, { missingOnly: args.includes("--missing-only") });
  } else if (args.includes("--all")) {
    const report = await checkLevelReadiness(SYSTEM, option("level", "a1"));
    if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
    else printLevel(report);
    if (!report.ok) process.exitCode = 1;
  } else {
    const [levelCode, slug] = option("module", "a1/hallo").split("/");
    const expectedSourceType = option("source-type", "ai_generated");
    const mod = await moduleRepository.findOne({ levelCode: levelCode.toUpperCase(), slug });
    if (!mod) throw new Error(`Module ${levelCode}/${slug} not found. Run \`bun run seed\` first.`);
    const report = await checkModuleReadiness(SYSTEM, String(mod._id), { expectedSourceType });
    const { errors, warnings, ...summary } = report;
    console.log(JSON.stringify(summary, null, 2));
    for (const w of warnings) console.log(`WARN  ${w}`);
    for (const e of errors) console.log(`ERROR ${e}`);
    console.log(report.ok ? "\nReady: no blocking issues." : `\n${errors.length} blocking issue(s).`);
    if (!report.ok) process.exitCode = 1;
  }
} catch (err) {
  console.error("content:check failed:", err.message);
  process.exitCode = 1;
} finally {
  await closeClient();
}
