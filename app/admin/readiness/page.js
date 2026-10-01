import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/errors";
import { checkLevelReadiness } from "@/lib/services/readinessService";
import { REVIEW_FINDING_KINDS } from "@/content/curriculum/a1/review-findings";
import { pickText } from "@/lib/i18n/locales";
import { PageHeader } from "@/components/admin/list";

export const metadata = { title: "Curriculum readiness" };

// Read-only readiness of a whole level (readinessService.checkLevelReadiness, the same
// report as `bun run content:check -- --all`). Nothing here changes content: acting on a
// problem happens on the module review page and in the editors, under the normal rules.
// Not linked from the admin navigation yet: open /admin/readiness directly.

const STATUS = {
  blocked: { label: "Blocked", className: "bg-danger-50 text-danger-700" },
  needs_audio: { label: "Needs audio", className: "bg-warning-50 text-warning-700" },
  needs_review: { label: "Needs review", className: "bg-warning-50 text-warning-700" },
  ready: { label: "Ready", className: "bg-success-50 text-success-700" },
};

const first = (v) => (Array.isArray(v) ? v[0] : v);
const de = (t) => pickText(t, "de").text;

function Badge({ status }) {
  const s = STATUS[status];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>;
}

function Messages({ errors = [], warnings = [], findings = [] }) {
  if (!errors.length && !warnings.length && !findings.length) return null;
  return (
    <ul className="mt-1 space-y-0.5 text-xs">
      {errors.map((e, i) => (
        <li key={`e${i}`} className="text-danger-700">
          <span className="font-semibold">Error:</span> {e}
        </li>
      ))}
      {warnings.map((w, i) => (
        <li key={`w${i}`} className="text-warning-700">
          <span className="font-semibold">Warning:</span> {w}
        </li>
      ))}
      {findings.map((f, i) => (
        <li key={`f${i}`} className="text-ink-muted">
          <span className="font-semibold text-ink">
            {f.id} · {REVIEW_FINDING_KINDS[f.kind]}:
          </span>{" "}
          {f.slug}
          {f.items ? ` ${f.items.join("/")}` : ""}: {f.note}
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, testid }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-xs">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="text-xl font-semibold tabular-nums" data-testid={testid}>
        {value}
      </p>
    </div>
  );
}

export default async function ReadinessPage({ searchParams }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  let report;
  try {
    report = await checkLevelReadiness(admin, first(sp.level) ?? "a1");
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const s = report.summary;

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title={`Curriculum readiness · ${report.level.code}`}
        description="What learners can open now, and what stops the rest. Checked on the stored content; read-only. “Ready” means technically valid, approved by a person, with its audio and no open QA finding. It is not a judgement of educational quality."
      />

      <section aria-label="Summary" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Lessons" value={s.lessons} />
        <Stat label="Live for learners" value={s.live} testid="readiness-live" />
        <Stat label="Ready" value={s.ready} />
        <Stat label="Need review" value={s.needs_review} />
        <Stat label="Need audio" value={s.needs_audio} />
        <Stat label="Blocked" value={s.blocked} testid="readiness-blocked" />
        <Stat label="Open QA findings" value={s.openFindings} />
      </section>

      <section aria-labelledby="level-heading" className="mt-5 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] shadow-xs">
        <h2 id="level-heading" className="font-semibold">
          Level {report.level.code}: {report.level.reviewStatus} / {report.level.publishStatus}
        </h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          “Continue” sequence: {report.continuation.ok ? `checked over ${report.continuation.lessons} live lesson(s), no problems.` : "problems found (see below)."}
        </p>
        <Messages errors={report.errors} warnings={report.warnings} />
      </section>

      <div className="mt-5 space-y-4">
        {report.modules.map((m) => (
          <section key={m.id} aria-labelledby={`m-${m.id}`} className="rounded-lg border border-line bg-surface shadow-xs" data-module={m.slug}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-2.5">
              <h2 id={`m-${m.id}`} className="text-[13px] font-semibold">
                Modul {m.order} · <span lang="de">{de(m.title)}</span>
                <span className="ml-2 font-normal text-ink-muted">
                  {m.reviewStatus} / {m.publishStatus} · {m.live} of {m.lessons.length} lessons live · {m.audio.requiredMissing} required audio clip(s) missing
                </span>
              </h2>
              <Link href={`/admin/modules/${m.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                Module review
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="text-xs text-ink-muted">
                  <tr>
                    <th scope="col" className="px-4 py-1.5 font-medium">
                      #
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Lesson
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Learners
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Readiness
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Approved
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Audio missing
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {m.lessons.map((l) => (
                    <tr key={l.id} className="align-top" data-lesson={l.slug} data-status={l.status}>
                      <td className="px-4 py-2 tabular-nums text-ink-muted">{l.order}</td>
                      <td className="px-2 py-2">
                        <span lang="de" className="font-medium">
                          {de(l.title)}
                        </span>
                        <span className="ml-1 text-xs text-ink-muted">{l.slug}</span>
                        <Messages errors={l.problems} warnings={l.warnings} findings={l.findings} />
                      </td>
                      <td className="px-2 py-2">{l.live ? <span className="font-medium text-success-700">Live</span> : <span className="text-ink-muted">Not live</span>}</td>
                      <td className="px-2 py-2">
                        <Badge status={l.status} />
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {l.approval.approved}/{l.approval.total}
                        {l.approval.testFixture > 0 && <span className="block text-xs text-warning-700">{l.approval.testFixture} test fixture</span>}
                      </td>
                      <td className="px-2 py-2 tabular-nums">{l.audioMissing || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(m.errors.length > 0 || m.warnings.length > 0) && (
              <div className="border-t border-line px-4 py-2">
                <Messages errors={m.errors} warnings={m.warnings} />
              </div>
            )}
          </section>
        ))}
        {report.modules.length === 0 && <p className="text-[13px] text-ink-muted">This level has no modules.</p>}
      </div>

      <section aria-labelledby="exams-heading" className="mt-6">
        <h2 id="exams-heading" className="text-sm font-semibold">
          Practice exams
        </h2>
        <ul className="mt-2 space-y-2">
          {report.exams.map((e) => (
            <li key={e.id} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-[13px] shadow-xs" data-exam={e.slug}>
              <div className="flex flex-wrap items-center gap-2">
                <span lang="de" className="font-medium">
                  {de(e.title)}
                </span>
                <span className="text-xs text-ink-muted">
                  {e.reviewStatus} / {e.publishStatus} · {e.live ? "live" : "not live"}
                  {e.audioMissing ? ` · ${e.audioMissing} audio clip(s) missing` : ""}
                </span>
                <Badge status={e.status} />
                <Link href={`/admin/exams/${e.id}`} className="ml-auto text-xs font-medium text-brand-700 hover:underline">
                  Exam editor
                </Link>
              </div>
              <Messages errors={e.problems} warnings={e.warnings} findings={e.findings} />
            </li>
          ))}
          {report.exams.length === 0 && <li className="text-[13px] text-ink-muted">No practice exams.</li>}
        </ul>
      </section>

      {report.notes.length > 0 && (
        <section aria-labelledby="notes-heading" className="mt-6 text-[13px]">
          <h2 id="notes-heading" className="text-sm font-semibold">
            Level-wide review notes
          </h2>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink-muted">
            {report.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
