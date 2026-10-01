import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/errors";
import { getExplanationReport } from "@/lib/services/explanationReportService";
import { pickText } from "@/lib/i18n/locales";
import { PageHeader } from "@/components/admin/list";

export const metadata = { title: "Explanation coverage" };

// Read-only content QA (explanationReportService, the same report as
// `bun run content:check -- --explanations`): which exercises explain why an answer is
// right, and where a wrong answer at least gets the lesson's grammar rule. Fixing an item
// happens in the exercise editor, under the normal review rules. Not linked from the admin
// navigation: open /admin/explanations directly.

const STATUS = {
  missing: { label: "Missing", className: "bg-danger-50 text-danger-700" },
  fallback: { label: "Grammar rule", className: "bg-warning-50 text-warning-700" },
  complete: { label: "Complete", className: "bg-success-50 text-success-700" },
  ungraded: { label: "Not scored", className: "bg-canvas text-ink-muted" },
};
const REASON = {
  not_grammar_skill: "not a grammar exercise",
  no_grammar_topic: "lesson has no grammar topic",
  several_grammar_topics: "lesson has several grammar topics",
};
const FILTERS = [
  { value: "open", label: "Needs explanations" },
  { value: "missing", label: "No fallback" },
  { value: "all", label: "All" },
];

const first = (v) => (Array.isArray(v) ? v[0] : v);
const de = (t) => pickText(t, "de").text;

export default async function ExplanationsPage({ searchParams }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const level = first(sp.level) ?? "a1";
  const show = FILTERS.some((f) => f.value === first(sp.show)) ? first(sp.show) : "open";
  let report;
  try {
    report = await getExplanationReport(admin, level);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const s = report.summary;
  const rows = report.rows.filter((r) => (show === "all" ? true : show === "missing" ? r.status === "missing" : r.status === "missing" || r.status === "fallback"));

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title={`Explanation coverage · ${report.level.code}`}
        description="Which exercises explain why an answer is right. Without an explanation, a wrong answer in a grammar exercise shows the lesson's grammar rule; everywhere else only the correct answer. Checked on the stored content in every state; read-only."
      />

      <section aria-label="Summary" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          ["Scored items explained", `${s.explainedItems} / ${s.gradedItems}`, "explained-items"],
          ["Exercises complete", s.complete, null],
          ["Grammar rule fallback", s.fallback, null],
          ["Missing, no fallback", s.missing, "explanations-missing"],
          ["Not scored", s.ungraded, null],
        ].map(([label, value, testid]) => (
          <div key={label} className="rounded-lg border border-line bg-surface px-3 py-2 shadow-xs">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="text-xl font-semibold tabular-nums" data-testid={testid ?? undefined}>
              {value}
            </p>
          </div>
        ))}
      </section>

      <nav aria-label="Filter" className="mt-5 flex flex-wrap gap-2 text-[13px]">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/explanations?level=${encodeURIComponent(level)}&show=${f.value}`}
            aria-current={show === f.value ? "page" : undefined}
            className={`rounded-md border px-3 py-1.5 ${show === f.value ? "border-brand-600 bg-brand-50 font-medium text-brand-700" : "border-line bg-surface hover:bg-canvas"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface shadow-xs">
        <table className="w-full text-left text-[13px]">
          <thead className="text-xs text-ink-muted">
            <tr>
              {["Module", "Lesson", "Exercise", "Skill", "Item types", "Explained", "Wrong answer shows", ""].map((h, i) => (
                <th key={i} scope="col" className="px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-ink-muted">
                  Nothing to show for this filter.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={`${r.lesson.slug}-${r.blockKey}`} className="border-t border-line align-top" data-explanation-row={r.exercise.slug}>
                <td className="px-3 py-2 tabular-nums">M{r.module.order}</td>
                <td className="px-3 py-2">
                  <span lang="de">{de(r.lesson.title)}</span>
                  <span className="block text-xs text-ink-muted">{r.blockKey}</span>
                </td>
                <td className="px-3 py-2">
                  <span lang="de">{de(r.exercise.title)}</span>
                  <span className="block text-xs text-ink-muted">{r.exercise.slug}</span>
                </td>
                <td className="px-3 py-2">{r.exercise.skill}</td>
                <td className="px-3 py-2 text-xs">{r.itemTypes.join(", ")}</td>
                <td className="px-3 py-2 tabular-nums">
                  {r.explained} / {r.gradedItems}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[r.status].className}`}>{STATUS[r.status].label}</span>
                  {r.status !== "complete" && r.status !== "ungraded" && (
                    <span className="block text-xs text-ink-muted">
                      {r.fallback.topic ? <span lang="de">{de(r.fallback.topic.title)}</span> : `Correct answer only (${REASON[r.fallback.reason] ?? r.fallback.reason})`}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Link href={`/admin/exercises/${r.exercise.id}`} className="text-xs font-medium text-brand-700 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
