import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";
import ModuleCard from "@/components/learn/ModuleCard";
import ProgressBar from "@/components/learn/ProgressBar";
import SkillBars from "@/components/journey/SkillBars";
import { moduleHref } from "@/lib/learning/journey";

const pct = (r) => `${Math.round((r ?? 0) * 100)}%`;

export function ExamResultCard({ exam, locale = "en" }) {
  return (
    <Link href={exam.href} className="block rounded-xl border border-line bg-surface p-5 hover:border-brand-600/40" data-exam={exam.slug}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Practice exam · Goethe format</p>
      <LocalizedText as="p" text={exam.title} prefer="de" className="mt-1 text-lg font-semibold" />
      {exam.description && <LocalizedText as="p" text={exam.description} prefer={locale} className="mt-1 line-clamp-2 text-sm text-ink-muted" />}
      <p className="mt-3 text-sm text-ink-muted">
        {exam.questionCount} questions{exam.durationMinutes ? ` · ${exam.durationMinutes} min` : " · untimed"} · LGA practice target {pct(exam.passThreshold)}
      </p>
      <p className="mt-1 text-sm">
        {exam.latest ? (
          <>
            Last result <strong className="tabular-nums">{pct(exam.latest.ratio)}</strong> · best {pct(exam.best)} · {exam.taken} {exam.taken === 1 ? "attempt" : "attempts"}
          </>
        ) : (
          <span className="text-ink-muted">Not taken yet</span>
        )}
      </p>
    </Link>
  );
}

// The level page: overall progress, skills across the level, the modules in order and
// the practice exams. Every number comes from journey.levelView.
export default function LevelOverview({ view, locale = "en" }) {
  const code = view.level.code;
  const c = view.continueAt;
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/dashboard" className="hover:underline">
          Learn
        </Link>
      </nav>
      <LocalizedText as="h1" text={view.level.title} prefer="de" className="mt-1 text-2xl font-semibold tracking-tight" />
      {view.level.description && <LocalizedText as="p" text={view.level.description} prefer={locale} className="mt-1 max-w-prose text-ink-muted" />}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-8">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-medium">
                {view.lessons.completed} of {view.lessons.total} lessons · {view.modulesCompleted} of {view.modulesAvailable} modules completed
              </span>
            </div>
            <ProgressBar value={view.lessons.total ? (view.lessons.completed / view.lessons.total) * 100 : 0} label="Level progress" className="mt-2" />
            {view.complete ? (
              <p className="mt-4 text-sm font-medium text-success-700">
                Every lesson of this level is complete.{" "}
                <Link href={`/goethe/${code.toLowerCase()}`} className="underline">
                  Continue with the Goethe preparation
                </Link>
              </p>
            ) : (
              c && (
                <Link href={c.href} className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
                  {c.started ? "Continue" : "Start"}: Modul {c.module.order} · <LocalizedText text={c.lesson.title} prefer="de" className="ml-1" />
                </Link>
              )
            )}
          </div>

          <section aria-labelledby="modules-heading">
            <h2 id="modules-heading" className="text-lg font-semibold">
              Modules
            </h2>
            <ul className="mt-3 grid gap-4 md:grid-cols-2">
              {view.modules.map((m) => (
                <li key={m.module.id}>
                  <ModuleCard summary={m} href={moduleHref(code, m.module.slug)} locale={locale} />
                </li>
              ))}
            </ul>
            {view.modules.length === 0 && <p className="mt-3 text-ink-muted">No modules have been published for this level yet.</p>}
          </section>

          {view.exams.length > 0 && (
            <section aria-labelledby="exams-heading">
              <h2 id="exams-heading" className="text-lg font-semibold">
                Practice exams
              </h2>
              <p className="mt-1 max-w-prose text-sm text-ink-muted">
                Goethe-style practice exams for the whole level. You can take them at any time; the results are kept separately from your lesson progress.
              </p>
              <ul className="mt-3 grid gap-4 md:grid-cols-2">
                {view.exams.map((e) => (
                  <li key={e.id}>
                    <ExamResultCard exam={e} locale={locale} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section aria-labelledby="skills-heading" className="rounded-xl border border-line bg-surface p-5">
            <h2 id="skills-heading" className="font-semibold">
              Your skills in {code}
            </h2>
            <div className="mt-3">
              <SkillBars skills={view.skills} locale={locale} />
            </div>
            <p className="mt-4 text-xs text-ink-muted">
              Each score uses your latest attempt at every exercise of that skill in {code}; exercises you haven&apos;t done count as 0. Targets are LGA&apos;s learning
              goals, not official Goethe pass marks.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
