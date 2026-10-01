import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";
import GrammarTopic from "@/components/learn/GrammarTopic";
import SaveProgressNudge from "@/components/learn/SaveProgressNudge";
import TopicStatus from "@/components/practice/TopicStatus";
import { practiceHref } from "@/lib/learning/topics";

const btn = "inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700";
const pct = (r) => `${Math.round((r ?? 0) * 100)}%`;

const STATUS = {
  new: () => "Not practised yet",
  practised: () => "Practised",
  mistakes: (e) => `Practise again · last time ${e.last.score}/${e.last.maxScore}`,
  passed: (e) => `Passed · last time ${e.last.score}/${e.last.maxScore}`,
  perfect: () => "✓ All right",
};
const ACTION = { new: "Practise", mistakes: "Practise again", passed: "Practise again", perfect: "Practise again", practised: "Practise again" };

// A grammar topic in Practice: the explanation, the topic's exercises with the learner's
// results and one suggested next exercise. Exercises open in their lesson with the way
// back here (?from=grammar-<slug>). `content` is the topic's full explanation;
// `view` comes from lib/learning/topics.grammarTopicView.
export default function GrammarTopicPractice({ view, content, guest = false, locale = "en" }) {
  const { topic, next } = view;
  const code = view.level.code;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href={practiceHref(code)} className="hover:underline">
          Practice
        </Link>
        {" › "}
        <Link href={`${practiceHref(code)}#grammar`} className="hover:underline">
          Grammar
        </Link>
      </nav>
      <LocalizedText as="h1" text={topic.title} prefer="de" className="mt-1 text-2xl font-semibold tracking-tight" />
      {topic.title.en && topic.title.de && <p className="text-ink-muted">{topic.title.en}</p>}
      <p className="mt-2 text-sm" data-testid="topic-status">
        <TopicStatus topic={topic} />
        {topic.threshold != null && topic.status !== "no_exercises" && <span className="text-ink-muted"> · LGA target {pct(topic.threshold)}</span>}
      </p>

      {next && (
        <Link href={next.href} className={`${btn} mt-4`} data-testid="practise-now">
          {next.status === "mistakes" ? "Practise your mistakes" : next.status === "new" ? "Practise now" : "Practise again"}
        </Link>
      )}

      <details className="mt-6 rounded-xl border border-line bg-surface p-4" open={topic.status === "new" || topic.status === "no_exercises"}>
        <summary className="cursor-pointer font-medium">The rule</summary>
        <div className="mt-4">
          <GrammarTopic grammar={content} locale={locale} />
        </div>
      </details>

      <section aria-labelledby="topic-exercises-heading" className="mt-8">
        <h2 id="topic-exercises-heading" className="text-lg font-semibold">
          Exercises <span className="font-normal text-ink-muted">({topic.exercises.length})</span>
        </h2>
        {topic.exercises.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">This topic has no exercises of its own yet. It is practised together with other topics in its lesson.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface" data-testid="topic-exercises">
            {topic.exercises.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm" data-topic-exercise={e.id} data-status={e.status}>
                <span className="min-w-0">
                  <LocalizedText text={e.title} prefer="de" className="block font-medium" />
                  <span className={`block text-xs ${e.status === "mistakes" ? "text-warning-700" : e.status === "perfect" ? "text-success-700" : "text-ink-muted"}`}>
                    {STATUS[e.status](e)}
                  </span>
                </span>
                <Link href={e.href} className="font-medium text-brand-700 hover:underline">
                  {ACTION[e.status]}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm text-ink-muted">
        Taught in{" "}
        <Link href={topic.taughtIn.href} className="font-medium text-brand-700 hover:underline" data-testid="taught-in">
          Modul {topic.taughtIn.module.order} · <LocalizedText text={topic.taughtIn.lesson.title} prefer="de" />
        </Link>
      </p>

      {guest && topic.attempted > 0 && <SaveProgressNudge next={topic.href} compact className="mt-6" />}
    </div>
  );
}
