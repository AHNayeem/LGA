import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";
import { SKILL_LABELS } from "@/lib/content/skills";
import { localize } from "@/lib/i18n/locales";
import { goetheHref } from "@/lib/learning/journey";
import { GOETHE_PART_TITLES } from "@/lib/learning/goethe";

// Review: words due (the `deck` slot: flashcards for signed-in learners, GuestReviewDeck
// for guests) and exercises to practise again. A mistake is an exercise whose latest
// attempt was below 100% (journey.mistakes); each one links back to the exercise in its
// lesson, and disappears once it is fully right.
export default function ReviewView({ view, deck, locale = "en" }) {
  const { due, mistakes, weakSkills } = view;
  const code = view.level.code;
  const nothing = due.count === 0 && mistakes.count === 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        <span lang="de">Wiederholen</span> · Review
      </h1>
      <p className="mt-1 text-ink-muted">
        {nothing
          ? "Nothing to review right now. Words come back here when they are due, and exercises when you didn't get everything right."
          : "Repeat what is due and practise what you got wrong. Every item leads straight back to the right exercise."}
      </p>

      <section aria-labelledby="words-heading" className="mt-8">
        <h2 id="words-heading" className="text-lg font-semibold">
          Words to review{" "}
          <span className="font-normal text-ink-muted" data-testid="due-count">
            ({due.count})
          </span>
        </h2>
        <div className="mt-3">
          {due.count > 0 ? (
            deck
          ) : (
            <p className="text-sm text-ink-muted">No words are due. Words you learn in lessons come back here: known words less often, new ones soon.</p>
          )}
        </div>
      </section>

      <section aria-labelledby="mistakes-heading" className="mt-10">
        <h2 id="mistakes-heading" className="text-lg font-semibold">
          Practise again{" "}
          <span className="font-normal text-ink-muted" data-testid="mistake-count">
            ({mistakes.count})
          </span>
        </h2>

        {weakSkills.length > 0 && (
          <div className="mt-3 rounded-xl border border-warning-700/20 bg-warning-50 p-4 text-sm">
            <p className="font-medium text-warning-700">Below the LGA target so far:</p>
            <ul className="mt-1 list-disc pl-5">
              {weakSkills.map((w) => (
                <li key={w.skill}>
                  <span lang="de">{SKILL_LABELS[w.skill].de}</span> ({localize(SKILL_LABELS[w.skill], locale)}): {Math.round(w.performance * 100)}% right in the{" "}
                  {w.attempted === 1 ? "one exercise" : `${w.attempted} exercises`} you did, target {Math.round(w.threshold * 100)}%
                  {mistakes.bySkill[w.skill] ? ` · ${mistakes.bySkill[w.skill]} ${mistakes.bySkill[w.skill] === 1 ? "exercise" : "exercises"} below` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {mistakes.count === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No mistakes to practise. Exercises you don&apos;t get fully right show up here.</p>
        ) : (
          <ol className="mt-4 space-y-4" data-testid="mistakes">
            {mistakes.byLesson.map((group) => (
              <li key={group.lesson.id} className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Modul {group.module.order} · <LocalizedText text={group.module.title} prefer="de" />
                </p>
                <LocalizedText as="h3" text={group.lesson.title} prefer="de" className="font-semibold" />
                {group.lesson.grammar.length > 0 && (
                  <p className="text-sm text-ink-muted">
                    Grammar in this lesson:{" "}
                    {group.lesson.grammar.map((g, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        <LocalizedText text={g} prefer="de" />
                      </span>
                    ))}
                  </p>
                )}
                <ul className="mt-3 divide-y divide-line">
                  {group.items.map((m) => (
                    <li key={m.exerciseId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm" data-mistake={m.exerciseId}>
                      <span className="min-w-0">
                        <LocalizedText text={m.title} prefer="de" className="font-medium" />
                        <span className="ml-2 text-xs text-ink-muted">
                          {localize(SKILL_LABELS[m.skill], locale)} · last time {m.score}/{m.maxScore}
                        </span>
                        {m.goethe && (
                          <Link href={goetheHref(code, m.goethe)} className="ml-2 text-xs text-ink-muted underline">
                            Goethe: <span lang="de">{GOETHE_PART_TITLES[m.goethe] ?? m.goethe}</span>
                          </Link>
                        )}
                      </span>
                      <Link href={m.href} className="font-medium text-brand-700 hover:underline">
                        Practise again
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </section>

      {nothing && (
        <Link href="/dashboard" className="mt-8 inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
          Continue learning
        </Link>
      )}
    </div>
  );
}
