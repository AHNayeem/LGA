import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";
import SaveProgressNudge from "@/components/learn/SaveProgressNudge";
import TopicStatus from "@/components/practice/TopicStatus";

// Practice: the level's grammar topics and word topics, to practise in any order. Every
// exercise opens in its lesson (same grading, same progress), with the way back here.
// The view comes from lib/learning/topics.practiceView (docs/PRACTICE.md).
export default function PracticeOverview({ view, guest = false, locale = "en" }) {
  const { grammar, words, weakTopics } = view;
  const empty = grammar.length === 0 && words.length === 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        <span lang="de">Üben</span> · Practice
      </h1>
      <p className="mt-1 text-ink-muted">
        {empty
          ? "Nothing to practise yet: topics appear here as soon as their lessons are published."
          : "Practise any grammar topic or word topic from your lessons. Your results count in your lessons too."}
      </p>

      {grammar.length > 0 && words.length > 0 && (
        <nav aria-label="Practice areas" className="mt-4 flex flex-wrap gap-2 text-sm">
          <a href="#grammar" className="rounded-lg border border-line bg-surface px-3 py-2 font-medium hover:bg-canvas">
            Grammar ({view.grammarCount})
          </a>
          <a href="#words" className="rounded-lg border border-line bg-surface px-3 py-2 font-medium hover:bg-canvas">
            Words by topic ({words.length})
          </a>
        </nav>
      )}

      {weakTopics.length > 0 && (
        <section aria-labelledby="weak-heading" className="mt-6 rounded-xl border border-warning-700/20 bg-warning-50 p-4">
          <h2 id="weak-heading" className="font-medium text-warning-700">
            Needs practice
          </h2>
          <ul className="mt-2 space-y-2" data-testid="weak-topics">
            {weakTopics.map((t) => (
              <li key={t.id} className="text-sm">
                <Link href={t.href} className="font-medium text-brand-700 hover:underline">
                  <LocalizedText text={t.title} prefer="de" />
                </Link>
                <TopicStatus topic={t} className="block text-xs" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {grammar.length > 0 && (
        <section aria-labelledby="grammar-heading" id="grammar" className="mt-8 scroll-mt-4">
          <h2 id="grammar-heading" className="text-lg font-semibold">
            <span lang="de">Grammatik</span> · Grammar{" "}
            <span className="font-normal text-ink-muted">({view.grammarCount})</span>
          </h2>
          <div className="mt-3 space-y-5">
            {grammar.map((g) => (
              <div key={g.module.slug}>
                <h3 className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Modul {g.module.order} · <LocalizedText text={g.module.title} prefer="de" />
                </h3>
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface" data-testid="grammar-topics">
                  {g.topics.map((t) => (
                    <li key={t.id}>
                      <Link href={t.href} className="flex items-center gap-3 px-4 py-3 hover:bg-canvas" data-topic={t.slug}>
                        <span className="min-w-0 flex-1">
                          <LocalizedText text={t.title} prefer="de" className="block font-medium" />
                          <TopicStatus topic={t} className="block text-sm" />
                        </span>
                        <span aria-hidden="true" className="text-ink-muted">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {words.length > 0 && (
        <section aria-labelledby="words-heading" id="words" className="mt-10 scroll-mt-4">
          <h2 id="words-heading" className="text-lg font-semibold">
            <span lang="de">Wortschatz</span> · Words by topic <span className="font-normal text-ink-muted">({words.length})</span>
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2" data-testid="word-topics">
            {words.map((w) => (
              <li key={w.slug}>
                <Link href={w.href} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-brand-600/40" data-word-topic={w.slug}>
                  <span className="min-w-0 flex-1">
                    <span lang="de" className="block font-medium">
                      {w.label.de}
                    </span>
                    <span className="block text-sm text-ink-muted">
                      {w.label.en && `${w.label.en} · `}
                      {w.count} {w.count === 1 ? "word" : "words"}
                      {w.due > 0 && ` · ${w.due} due`}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-ink-muted">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {guest && !empty && <SaveProgressNudge next="/practice" compact className="mt-8" />}
    </div>
  );
}
