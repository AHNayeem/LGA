import { SKILLS, SKILL_LABELS } from "@/lib/content/skills";
import { localize } from "@/lib/i18n/locales";

const pct = (v) => `${Math.round((v ?? 0) * 100)}%`;

// Level-wide skills (journey.levelSkills), two real numbers per skill:
//   "% right"   the score on the exercises attempted so far (latest attempts)
//   the bar     progress towards the LGA target for the whole level: every exercise of
//               the skill counts, the ones not done yet as 0 (the marker is the target)
// A skill with no attempt yet says so instead of showing 0%. Speaking is practice only
// (self-rated), so it shows how much was practised, never a score.
export default function SkillBars({ skills, locale = "en", compact = false }) {
  const rows = SKILLS.filter((s) => skills.skills[s] || skills.ungraded?.[s]);
  return (
    <ul className={compact ? "space-y-2" : "space-y-3"} data-testid="skill-bars">
      {rows.map((skill) => {
        const r = skills.skills[skill];
        const b = skills.breakdown?.[skill];
        const u = skills.ungraded?.[skill];
        const label = (
          <span className="font-medium">
            <span lang="de">{SKILL_LABELS[skill].de}</span> <span className="font-normal text-ink-muted">· {localize(SKILL_LABELS[skill], locale)}</span>
          </span>
        );
        if (!b && u) {
          return (
            <li key={skill} data-skill={skill} className="text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                {label}
                <span className="text-ink-muted">{u.practised ? `${u.practised} of ${u.exercises} practised · self-rated` : "Not started yet"}</span>
              </div>
            </li>
          );
        }
        if (!r || r.status === "not_assessed" || !b) return null;
        const started = b.attempted > 0;
        return (
          <li key={skill} data-skill={skill} className="text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {label}
              {started ? (
                <span className="flex items-center gap-2">
                  <span className="tabular-nums" data-testid="skill-score">
                    {pct(b.performance)} right
                  </span>
                  {r.met && <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">Target reached</span>}
                </span>
              ) : (
                <span className="text-ink-muted" data-testid="skill-score">
                  Not started yet
                </span>
              )}
            </div>
            {started && (
              <>
                <div
                  className="relative mt-1.5 h-2 rounded-full bg-line"
                  role="img"
                  aria-label={`Towards the level target: ${pct(r.score)} of ${pct(r.threshold)}`}
                >
                  <div className={`h-full rounded-full ${r.met ? "bg-success-700" : "bg-brand-600"}`} style={{ width: pct(r.score) }} />
                  <div className="absolute top-[-3px] h-3.5 w-0.5 bg-ink" style={{ left: pct(r.threshold) }} />
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {b.attempted} of {b.exercises} exercises done{!compact && ` · level target ${pct(r.threshold)}, now ${pct(r.score)}`}
                </p>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
