import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";
import { SKILL_LABELS } from "@/lib/content/skills";
import { localize } from "@/lib/i18n/locales";
import { ExamResultCard } from "@/components/journey/LevelOverview";
import { GOETHE_PART_COVERAGE } from "@/lib/learning/goethe";

const pct = (r) => `${Math.round((r ?? 0) * 100)}%`;

const DISCLAIMER =
  "LGA practice material follows the published structure of the Goethe-Zertifikat. It is not an official Goethe-Institut product: results are your practice performance against LGA's own targets, not official results or a prediction of one.";

// Why an exercise is suggested (journey.goethePrep: fixed rules, see there).
export function suggestionReason(reason) {
  if (reason.kind === "mistake") return `Your last attempt got ${reason.score} of ${reason.maxScore} points.`;
  if (reason.kind === "started") return "Not practised yet, from a lesson you have started.";
  return "Not practised yet; the next one in the course order.";
}

// What the learner has done in a part, in numbers the data supports.
function Evidence({ part }) {
  if (part.practised === 0) return null;
  const bits = [];
  if (part.graded) {
    bits.push(`${part.perfect} fully right`);
    if (part.toImprove) bits.push(`${part.toImprove} to practise again`);
  }
  return bits.length ? <span className="text-ink-muted"> · {bits.join(" · ")}</span> : null;
}

function PartStats({ part }) {
  if (part.practised === 0) return <span className="text-ink-muted">Not started yet</span>;
  return (
    <span className="tabular-nums">
      {part.practised} of {part.total} practised
      {part.ratio != null && <> · {pct(part.ratio)} of points</>}
      {!part.graded && " · self-rated"}
    </span>
  );
}

// Goethe Prep: for each exam part, the lesson exercises that prepare it and how the
// learner is doing on them, then the practice exams with the latest result per section.
export function GoetheOverview({ view, locale = "en" }) {
  const code = view.level.code;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <p className="text-sm font-medium text-ink-muted">Goethe Prep · {code}</p>
      <h1 className="text-2xl font-semibold tracking-tight">Prepare for the Goethe exam</h1>
      <p className="mt-1 max-w-prose text-ink-muted">
        Learn the language in the lessons, practise each exam part with the exercises below, then check yourself with a practice exam. Your results show where to practise next.
      </p>

      <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-3" aria-label="How to prepare">
        <li className="rounded-xl border border-line bg-surface p-4">
          <span className="font-semibold">1. Practise each part</span>
          <span className="block text-ink-muted">Hören, Lesen, Schreiben and Sprechen, with exercises from your lessons.</span>
        </li>
        <li className="rounded-xl border border-line bg-surface p-4">
          <span className="font-semibold">2. Take a practice exam</span>
          <span className="block text-ink-muted">Timed, in the exam format, scored right away.</span>
        </li>
        <li className="rounded-xl border border-line bg-surface p-4">
          <span className="font-semibold">3. Work on weak parts</span>
          <span className="block text-ink-muted">Each result links to the practice for that part.</span>
        </li>
      </ol>

      <section aria-labelledby="parts-heading" className="mt-8">
        <h2 id="parts-heading" className="text-lg font-semibold">
          Exam parts
        </h2>
        {view.sections.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No practice for the exam parts has been published yet.</p>
        ) : (
          <ul className="mt-3 grid gap-4 md:grid-cols-2">
            {view.sections.map((part) => (
              <li key={part.key}>
                <Link href={part.href} className="block h-full rounded-xl border border-line bg-surface p-5 hover:border-brand-600/40" data-part={part.key}>
                  <p lang="de" className="text-lg font-semibold">
                    {part.title}
                  </p>
                  {(part.minutes || part.parts) && (
                    <p className="text-xs text-ink-muted">
                      In the exam: {part.parts ? `${part.parts} parts` : ""}
                      {part.parts && part.minutes ? ", " : ""}
                      {part.minutes ? `about ${part.minutes} min` : ""}
                    </p>
                  )}
                  <p className="mt-3 text-sm">
                    <PartStats part={part} />
                    <Evidence part={part} />
                  </p>
                  {part.total > 0 && (
                    <p className="mt-1 text-xs text-ink-muted">
                      {part.total} {part.total === 1 ? "exercise" : "exercises"} in {part.lessons} {part.lessons === 1 ? "lesson" : "lessons"}
                      {GOETHE_PART_COVERAGE[part.key]?.notCovered ? " · LGA covers only part of it" : ""}
                    </p>
                  )}
                  {part.next && (
                    <p className="mt-2 text-sm">
                      <span className="font-medium">Suggested: </span>
                      <LocalizedText text={part.next.exercise.title} prefer="de" />
                      <span className="block text-xs text-ink-muted">{suggestionReason(part.next.reason)}</span>
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="goethe-exams-heading" className="mt-10">
        <h2 id="goethe-exams-heading" className="text-lg font-semibold">
          Practice exams
        </h2>
        {view.exams.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No practice exam has been published yet.</p>
        ) : (
          <ul className="mt-3 grid gap-4 md:grid-cols-2">
            {view.exams.map((exam) => (
              <li key={exam.id} className="space-y-3">
                <ExamResultCard exam={exam} locale={locale} />
                {exam.latest && (
                  <div className="rounded-xl border border-line bg-surface p-4 text-sm" data-testid="exam-sections">
                    <p className="font-medium">Your last result per part</p>
                    <ul className="mt-2 space-y-1">
                      {exam.latest.sections.map((s) => (
                        <li key={s.key} className="flex flex-wrap justify-between gap-2">
                          <LocalizedText text={s.title} prefer="de" />
                          <span className="flex gap-3">
                            <span className={`tabular-nums ${s.belowTarget ? "text-danger-700" : "text-success-700"}`}>{pct(s.ratio)}</span>
                            {s.practiceHref && (
                              <Link href={s.practiceHref} className="font-medium text-brand-700 hover:underline">
                                Practise
                              </Link>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-ink-muted">LGA practice target: {pct(exam.latest.passThreshold)} per exam.</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 max-w-3xl text-xs text-ink-muted">{DISCLAIMER}</p>
    </div>
  );
}

const STATUS = {
  new: { label: "Not practised", className: "bg-canvas text-ink-muted" },
  practised: { label: "Practised", className: "bg-brand-50 text-brand-700" },
  mistakes: { label: "Practise again", className: "bg-warning-50 text-warning-700" },
  passed: { label: "Passed", className: "bg-success-50 text-success-700" },
  perfect: { label: "All right", className: "bg-success-50 text-success-700" },
};

// One exam part: what the exam asks (the published format), what LGA practises of it and
// what not, the suggested next exercise with its reason, then every exercise by module.
export function GoetheSection({ view, locale = "en" }) {
  const { section } = view;
  const code = view.level.code;
  const coverage = GOETHE_PART_COVERAGE[section.key] ?? null;
  const byModule = [];
  for (const e of section.exercises) {
    const last = byModule[byModule.length - 1];
    if (last?.module.slug === e.module.slug) last.items.push(e);
    else byModule.push({ module: e.module, items: [e] });
  }
  const exam = view.exams[0];
  const examPart = exam?.latest?.sections.find((s) => s.key === section.key);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href={`/goethe/${code.toLowerCase()}`} className="hover:underline">
          Goethe Prep
        </Link>
      </nav>
      <h1 lang="de" className="mt-1 text-2xl font-semibold tracking-tight">
        {section.title}
      </h1>
      <p className="mt-1 text-ink-muted">
        {section.total > 0 ? (
          <>
            {section.total} {section.total === 1 ? "exercise" : "exercises"} from {section.lessons} {section.lessons === 1 ? "lesson" : "lessons"} prepare this exam part.{" "}
            <PartStats part={section} />
            <Evidence part={section} />.
          </>
        ) : (
          "No exercises for this exam part have been published yet."
        )}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {section.teile.length > 0 && (
          <section aria-labelledby="format-heading" className="rounded-xl border border-line bg-surface p-4 text-sm" data-testid="part-format">
            <h2 id="format-heading" className="font-semibold">
              In the exam
            </h2>
            <p className="text-xs text-ink-muted">
              {section.teile.length} {section.teile.length === 1 ? "Teil" : "Teile"}
              {section.minutes ? `, about ${section.minutes} minutes` : ""}. From the published exam format.
            </p>
            <ol className="mt-2 space-y-1">
              {section.teile.map((t, i) => (
                <li key={i}>
                  <span className="font-medium" lang="de">
                    Teil {i + 1}:
                  </span>{" "}
                  {t}
                </li>
              ))}
            </ol>
          </section>
        )}
        {coverage && (
          <section aria-labelledby="coverage-heading" className="rounded-xl border border-line bg-surface p-4 text-sm" data-testid="part-coverage">
            <h2 id="coverage-heading" className="font-semibold">
              What LGA practises
            </h2>
            <p className="mt-1">{coverage.covered}</p>
            {coverage.notCovered && (
              <p className="mt-2 rounded-lg bg-warning-50 px-3 py-2 text-warning-700">
                <span className="font-semibold">Not practised in LGA: </span>
                {coverage.notCovered}
              </p>
            )}
          </section>
        )}
      </div>

      {examPart && (
        <p className="mt-4 text-sm">
          In your last practice exam: <strong className={examPart.belowTarget ? "text-danger-700" : "text-success-700"}>{pct(examPart.ratio)}</strong> in this part
          {examPart.belowTarget ? ", below the LGA practice target." : "."}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-start gap-2">
        {section.next ? (
          <div>
            <Link
              href={section.next.exercise.href}
              className="inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
              data-testid="part-primary"
            >
              {section.next.reason.kind === "mistake" ? "Practise again" : "Practise"}: <LocalizedText text={section.next.exercise.title} prefer="de" className="ml-1" />
            </Link>
            <p className="mt-1 text-xs text-ink-muted" data-testid="part-reason">
              Why this one: {suggestionReason(section.next.reason)}
            </p>
          </div>
        ) : (
          section.total > 0 && <p className="text-sm text-ink-muted">You have practised every exercise for this part. Try the practice exam to check yourself.</p>
        )}
        {exam && (
          <Link href={exam.href} className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
            Practice exam
          </Link>
        )}
      </div>

      <ol className="mt-8 space-y-6">
        {byModule.map((g) => (
          <li key={g.module.slug}>
            <h2 className="text-sm font-semibold">
              Modul {g.module.order} · <LocalizedText text={g.module.title} prefer="de" />
            </h2>
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
              {g.items.map((e) => (
                <li key={e.id} data-part-exercise={e.id}>
                  <Link href={e.href} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-canvas">
                    <span className="min-w-0">
                      <LocalizedText text={e.title} prefer="de" className="font-medium" />
                      <span className="block text-xs text-ink-muted">
                        <LocalizedText text={e.lesson.title} prefer="de" /> · {localize(SKILL_LABELS[e.skill], locale)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {e.graded && e.last && <span className="tabular-nums text-ink-muted">{e.last.score}/{e.last.maxScore}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[e.status].className}`}>{STATUS[e.status].label}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-xs text-ink-muted">{DISCLAIMER}</p>
    </div>
  );
}
