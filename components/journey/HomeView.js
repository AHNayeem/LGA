import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";
import ModuleCard from "@/components/learn/ModuleCard";
import ProgressBar from "@/components/learn/ProgressBar";
import SkillBars from "@/components/journey/SkillBars";
import SaveProgressNudge from "@/components/learn/SaveProgressNudge";
import { SKILL_LABELS } from "@/lib/content/skills";
import { localize } from "@/lib/i18n/locales";
import { GOAL_OPTIONS } from "@/lib/learning/profile";
import { moduleHref } from "@/lib/learning/journey";
import { practiceHref } from "@/lib/learning/topics";
import { topicResultText } from "@/components/practice/TopicStatus";

const pct = (r) => `${Math.round((r ?? 0) * 100)}%`;
const btn = "inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700";

function PlanItem({ item, locale }) {
  const body = {
    lesson: {
      label: item.detail ? "Continue your lesson" : "Next lesson",
      title: <LocalizedText text={item.title} prefer="de" />,
      note: (
        <>
          <LocalizedText text={item.context} prefer="de" />
          {item.detail && ` · ${item.detail.stepsDone} of ${item.detail.stepsTotal} steps done`}
        </>
      ),
    },
    review: { label: "Review words", title: `${item.count} ${item.count === 1 ? "word is" : "words are"} due`, note: "Words you know come back less often." },
    mistake: {
      label: `Practise again · ${localize(SKILL_LABELS[item.skill], locale)}`,
      title: <LocalizedText text={item.title} prefer="de" />,
      note: (
        <>
          Last time {item.score}/{item.maxScore} · <LocalizedText text={item.context} prefer="de" />
        </>
      ),
    },
    goethe: {
      label: item.goal === "skills" ? "Skill practice" : "Goethe practice",
      title: item.title,
      note: `${item.practised} of ${item.total} exercises for this exam part practised`,
    },
    exam: { label: "Practice exam", title: <LocalizedText text={item.title} prefer="de" />, note: "All lessons are done. Check yourself under exam conditions." },
  }[item.kind];
  return (
    <li>
      <Link href={item.href} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 hover:border-brand-600/40" data-plan={item.kind}>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium uppercase tracking-wide text-ink-muted">{body.label}</span>
          <span className="block font-medium">{body.title}</span>
          <span className="block text-sm text-ink-muted">{body.note}</span>
        </span>
        {item.minutes && <span className="shrink-0 text-sm tabular-nums text-ink-muted">about {item.minutes} min</span>}
        <span aria-hidden="true" className="text-ink-muted">
          →
        </span>
      </Link>
    </li>
  );
}

// Practice on the learner home: weak grammar topics when there are any (only from
// attempted exercises), and the two ways in. Kept small: the plan above stays the first thing.
function PracticeCard({ practice, code }) {
  const base = practiceHref(code);
  return (
    <section aria-labelledby="practice-heading" data-testid="practice-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="practice-heading" className="text-lg font-semibold">
          Practice
        </h2>
        <Link href={base} className="text-sm font-medium text-brand-700 hover:underline">
          All topics
        </Link>
      </div>
      {practice.weakTopics.length > 0 && (
        <ul className="mt-3 space-y-2" data-testid="dashboard-weak-topics">
          {practice.weakTopics.map((t) => (
            <li key={t.id}>
              <Link href={t.href} className="flex items-center gap-3 rounded-xl border border-warning-700/20 bg-warning-50 p-4 hover:border-warning-700/40">
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium uppercase tracking-wide text-warning-700">Needs practice · Grammar</span>
                  <LocalizedText text={t.title} prefer="de" className="block font-medium" />
                  <span className="block text-sm text-ink-muted">{topicResultText(t)}</span>
                </span>
                <span aria-hidden="true" className="text-ink-muted">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href={`${base}#grammar`} className="rounded-xl border border-line bg-surface p-4 hover:border-brand-600/40">
          <span className="block font-medium">Grammar</span>
          <span className="block text-sm text-ink-muted">{practice.grammarCount} topics</span>
        </Link>
        <Link href={`${base}#words`} className="rounded-xl border border-line bg-surface p-4 hover:border-brand-600/40">
          <span className="block font-medium">Words</span>
          <span className="block text-sm text-ink-muted">by topic</span>
        </Link>
      </div>
    </section>
  );
}

// The learner home: one primary action, today's plan, progress, review and Goethe
// preparation. Every number comes from journey.homeView (docs/LEARNER.md).
export default function HomeView({ view, guest = false, name = null, locale = "en" }) {
  const { overview, plan } = view;
  const c = overview.continueAt;
  const code = view.level.code;
  const goal = GOAL_OPTIONS.find((g) => g.value === view.profile?.goal);
  const started = overview.lessons.completed > 0 || plan.items.some((i) => i.kind !== "lesson") || c?.started;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        {name ? (
          <>
            <span lang="de">Hallo</span>, {name}!
          </>
        ) : (
          <span lang="de">Willkommen!</span>
        )}
      </h1>
      <p className="mt-1 text-ink-muted">
        You are learning <LocalizedText text={view.level.title} prefer="de" />
        {goal && <> · Goal: {goal.label.toLowerCase()}</>}
      </p>

      {/* The one thing to do now. */}
      <section aria-labelledby="now-heading" className="mt-6 rounded-2xl border border-brand-600/30 bg-brand-50 p-5 sm:p-6">
        <h2 id="now-heading" className="text-sm font-medium text-brand-700">
          {c ? (c.started ? "Continue learning" : overview.lessons.completed ? "Up next" : "Start here") : overview.complete ? "Level complete" : "What to do now"}
        </h2>
        {c ? (
          <>
            <p className="mt-1 text-xl font-semibold">
              Modul {c.module.order} · <LocalizedText text={c.lesson.title} prefer="de" />
            </p>
            <p className="text-sm text-ink-muted">
              <LocalizedText text={c.module.title} prefer="de" />
              {c.lesson.estimatedMinutes && ` · about ${c.lesson.estimatedMinutes} min`}
              {c.started && ` · ${c.lesson.stepsDone} of ${c.lesson.stepsTotal} steps done`}
            </p>
            <Link href={c.href} className={`${btn} mt-4`} data-testid="primary-action">
              {c.started ? "Continue" : "Start"}: <LocalizedText text={c.lesson.title} prefer="de" className="ml-1" />
            </Link>
          </>
        ) : overview.complete ? (
          <>
            <p className="mt-1 text-lg font-semibold">You have completed every {code} lesson.</p>
            <p className="text-sm text-ink-muted">Review your mistakes and check yourself with the practice exam.</p>
            <Link href={`/goethe/${code.toLowerCase()}`} className={`${btn} mt-4`} data-testid="primary-action">
              Goethe preparation
            </Link>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">No lessons have been published yet. Please come back soon.</p>
        )}
      </section>

      {!view.profile && (
        <p className="mt-4 text-sm">
          <Link href="/start" className="font-medium text-brand-700 hover:underline">
            Tell us your goal and where to start
          </Link>{" "}
          <span className="text-ink-muted">– takes a minute, no account needed.</span>
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-8">
          {plan.items.length > 0 && (
            <section aria-labelledby="today-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="today-heading" className="text-lg font-semibold">
                  Today&apos;s plan
                </h2>
                {plan.knownMinutes && <p className="text-sm text-ink-muted">Lessons: about {plan.knownMinutes} min</p>}
              </div>
              <ol className="mt-3 space-y-2" data-testid="today-plan">
                {plan.items.map((item, i) => (
                  <PlanItem key={`${item.kind}-${i}`} item={item} locale={locale} />
                ))}
              </ol>
            </section>
          )}

          {view.practice?.grammarCount > 0 && <PracticeCard practice={view.practice} code={code} />}

        </div>

        <aside className="space-y-4">
          <section aria-labelledby="progress-heading" className="rounded-xl border border-line bg-surface p-5">
            <h2 id="progress-heading" className="font-semibold">
              Your {code}
            </h2>
            <p className="mt-2 text-sm" data-testid="lessons-completed">
              {overview.lessons.completed} of {overview.lessons.total} lessons completed
            </p>
            <ProgressBar value={overview.lessons.total ? (overview.lessons.completed / overview.lessons.total) * 100 : 0} label="Lessons completed" className="mt-1.5" />
            <div className="mt-4">
              <SkillBars skills={overview.skills} locale={locale} compact />
            </div>
            <Link href={`/learn/${code.toLowerCase()}`} className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline">
              Skills and modules in detail
            </Link>
          </section>

          <Link href="/review" className="block rounded-xl border border-line bg-surface p-5 hover:border-brand-600/40" data-testid="review-card">
            <h2 className="font-semibold">
              <span lang="de">Wiederholen</span> · Review
            </h2>
            <p className="mt-1 text-sm">
              <span data-testid="review-due">
                {view.reviewDue} {view.reviewDue === 1 ? "word" : "words"} to review
              </span>{" "}
              · {view.mistakes} {view.mistakes === 1 ? "exercise" : "exercises"} to practise again
            </p>
            {view.weakSkills.length > 0 && (
              <p className="mt-1 text-xs text-ink-muted">Needs work: {view.weakSkills.map((w) => localize(SKILL_LABELS[w.skill], locale)).join(", ")}</p>
            )}
          </Link>

          {view.goethe.length > 0 && (
            <Link href={`/goethe/${code.toLowerCase()}`} className="block rounded-xl border border-line bg-surface p-5 hover:border-brand-600/40" data-testid="goethe-card">
              <h2 className="font-semibold">Goethe Prep</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {view.goethe.map((g) => (
                  <li key={g.key} className="flex justify-between gap-2">
                    <span lang="de">{g.title}</span>
                    <span className="tabular-nums text-ink-muted">
                      {g.practised}/{g.total} practised{g.ratio != null ? ` · ${pct(g.ratio)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              {view.exams[0]?.latest && (
                <p className="mt-2 text-xs text-ink-muted">
                  Last practice exam: {pct(view.exams[0].latest.ratio)} (LGA practice target {pct(view.exams[0].latest.passThreshold)})
                </p>
              )}
            </Link>
          )}

          {guest && started && <SaveProgressNudge next="/dashboard" compact />}
        </aside>
      </div>

      {/* After the plan and the summaries, so phones see what to do first. */}
      <div className="mt-8">
          <section aria-labelledby="modules-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="modules-heading" className="text-lg font-semibold">
                Your path through <LocalizedText text={view.level.title} prefer="de" />
              </h2>
              <Link href={`/learn/${code.toLowerCase()}`} className="text-sm font-medium text-brand-700 hover:underline">
                All modules
              </Link>
            </div>
            {overview.modules.length > 0 ? (
              <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {overview.modules.map((m) => (
                  <li key={m.module.id}>
                    <ModuleCard summary={m} href={moduleHref(code, m.module.slug)} locale={locale} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">No modules have been published yet.</p>
            )}
          </section>
      </div>
    </div>
  );
}
