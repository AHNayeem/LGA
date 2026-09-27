import { SKILLS, SKILL_LABELS } from "@/lib/content/skills";
import { localize } from "@/lib/i18n/locales";

const STATUS = {
  met: { label: "Reached", className: "bg-success-50 text-success-700" },
  not_met: { label: "Not yet", className: "bg-warning-50 text-warning-700" },
  not_assessed: { label: "Not assessed here", className: "bg-canvas text-ink-muted" },
};

const pct = (v) => (typeof v === "number" ? `${Math.round(v * 100)}%` : "–");

// Shows each skill's current score (latest attempts) against the configured target.
export default function SkillMastery({ mastery, locale = "en" }) {
  const skills = SKILLS.filter((s) => mastery.skills[s]);
  return (
    <section aria-labelledby="mastery-heading" className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mastery-heading" className="text-lg font-semibold">
          Skills
        </h2>
        <p className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${mastery.mastered ? "bg-success-50 text-success-700" : "bg-canvas text-ink-muted"}`}>
          {mastery.mastered ? "Module mastered" : "Not mastered yet"}
        </p>
      </div>
      <ul className="mt-4 space-y-3">
        {skills.map((skill) => {
          const r = mastery.skills[skill];
          const b = mastery.breakdown?.[skill];
          const status = STATUS[r.status] ?? STATUS.not_met;
          return (
            <li key={skill} data-skill={skill}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {localize(SKILL_LABELS[skill], locale)} <span lang="de" className="font-normal text-ink-muted">({SKILL_LABELS[skill].de})</span>
                  {!r.required && <span className="ml-1 text-xs text-ink-muted">optional</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-ink-muted">
                    {pct(r.score)} / target {pct(r.threshold)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
                </span>
              </div>
              {r.status !== "not_assessed" && (
                <div className="relative mt-1.5 h-2 rounded-full bg-line" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${r.met ? "bg-success-700" : "bg-brand-600"}`}
                    style={{ width: `${Math.round((r.score ?? 0) * 100)}%` }}
                  />
                  <div className="absolute top-[-3px] h-3.5 w-0.5 bg-ink" style={{ left: `${Math.round(r.threshold * 100)}%` }} />
                </div>
              )}
              {b && b.attempted < b.exercises && (
                <p className="mt-1 text-xs text-ink-muted">
                  {b.attempted} of {b.exercises} exercises done. Exercises you haven&apos;t done count as 0.
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-ink-muted">
        Scores use your latest attempt at each exercise. Targets are this app&apos;s learning goals, not official Goethe pass marks.
      </p>
    </section>
  );
}
