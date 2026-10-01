import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";
import { SKILL_LABELS } from "@/lib/content/skills";
import { localize } from "@/lib/i18n/locales";
import SaveProgressNudge from "@/components/learn/SaveProgressNudge";

const pct = (r) => `${Math.round((r ?? 0) * 100)}%`;

// The end of a lesson: what the learner achieved (latest result per exercise), what to
// practise again (anything below 100%) and one clear next step.
export default function LessonResult({ data, locale, hrefFor, moduleHref, mode, selfHref }) {
  const { completion } = data;
  const results = data.results ?? [];
  const graded = results.filter((r) => r.graded && r.last);
  const score = graded.reduce((n, r) => n + r.last.score, 0);
  const max = graded.reduce((n, r) => n + r.last.maxScore, 0);
  const toPractise = results.filter((r) => r.graded && r.last && (r.last.ratio ?? 0) < 1);
  const firstOpen = data.blocks.find((b) => !b.done);
  const nextHref = data.nextLesson ? `${moduleHref}/${data.nextLesson.slug}` : moduleHref;

  return (
    <section aria-labelledby="result-heading" className="space-y-6" data-testid="lesson-result">
      <div className={`rounded-xl border p-5 ${completion.complete ? "border-success-700/30 bg-success-50" : "border-line bg-surface"}`}>
        <h2 id="result-heading" className="text-xl font-semibold">
          {completion.complete
            ? "Lesson complete!"
            : completion.done === 0
              ? `Not started yet: ${completion.total} steps to do`
              : `${completion.done} of ${completion.total} steps done, ${completion.total - completion.done} still open`}
        </h2>
        {max > 0 && (
          <p className="mt-1 text-sm">
            Exercises: <strong className="tabular-nums">{score} / {max} points</strong> ({pct(score / max)}), from your latest attempt at each.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {completion.complete ? (
            <Link href={nextHref} className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
              {data.nextLesson ? (
                <>
                  Next lesson: <LocalizedText text={data.nextLesson.title} prefer="de" className="ml-1" />
                </>
              ) : (
                "Finish the module"
              )}
            </Link>
          ) : (
            firstOpen && (
              <Link href={hrefFor(firstOpen.key)} className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
                Continue with the open step
              </Link>
            )
          )}
          {toPractise.length > 0 && (
            <Link href="/review" className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
              Review your mistakes
            </Link>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h3 className="font-semibold">Your results</h3>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
            {results.map((r) => {
              const weak = r.graded && r.last && (r.last.ratio ?? 0) < 1;
              return (
                <li key={r.blockKey} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm" data-result={r.blockKey}>
                  <span className="min-w-0">
                    <LocalizedText text={r.title} prefer="de" className="font-medium" />
                    <span className="ml-2 text-xs text-ink-muted">{localize(SKILL_LABELS[r.skill], locale)}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    {!r.last ? (
                      <span className="text-ink-muted">Not done yet</span>
                    ) : !r.graded ? (
                      <span className="text-ink-muted">Practised (not scored)</span>
                    ) : (
                      <span className={`tabular-nums ${weak ? "text-warning-700" : "text-success-700"}`}>
                        {r.last.score}/{r.last.maxScore}
                      </span>
                    )}
                    {(weak || !r.last) && (
                      <Link href={hrefFor(r.blockKey)} className="font-medium text-brand-700 hover:underline">
                        {r.last ? "Practise again" : "Do it now"}
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {mode === "guest" && <SaveProgressNudge next={selfHref} />}
    </section>
  );
}
