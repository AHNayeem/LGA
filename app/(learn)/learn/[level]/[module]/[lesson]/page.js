import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth/dal";
import { getLearnerLesson } from "@/lib/services/curriculumService";
import { orNotFound } from "@/lib/pages";
import LocalizedText from "@/components/ui/LocalizedText";
import Alert from "@/components/ui/Alert";
import ProgressBar from "@/components/learn/ProgressBar";
import LessonSteps, { blockLabel } from "@/components/learn/LessonSteps";
import ContinueButton from "@/components/learn/ContinueButton";
import GrammarTopic from "@/components/learn/GrammarTopic";
import Flashcards from "@/components/learn/Flashcards";
import ExercisePlayer from "@/components/exercises/ExercisePlayer";

export const metadata = { title: "Lesson" };

function WordList({ cards, locale }) {
  return (
    <details className="rounded-xl border border-line bg-surface p-4">
      <summary className="cursor-pointer font-medium">All words in this step ({cards.length})</summary>
      <ul className="mt-3 divide-y divide-line text-sm">
        {cards.map((c) => (
          <li key={c.id} className="flex flex-wrap justify-between gap-2 py-2">
            <span lang="de" className="font-medium">
              {c.display}
              {c.plural && <span className="font-normal text-ink-muted"> · {c.plural}</span>}
            </span>
            <LocalizedText text={c.meanings} prefer={locale} className="text-ink-muted" />
          </li>
        ))}
      </ul>
    </details>
  );
}

export default async function LessonPage({ params, searchParams }) {
  const { level, module: moduleSlug, lesson: lessonSlug } = await params;
  const { block: blockParam } = await searchParams;
  const base = `/learn/${level}/${moduleSlug}/${lessonSlug}`;
  const moduleHref = `/learn/${level}/${moduleSlug}`;
  const user = await requireUserPage(base);
  const locale = user.uiLanguage ?? "en";
  const data = await orNotFound(getLearnerLesson(user, { level, module: moduleSlug, lesson: lessonSlug }));

  const header = (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href={`/learn/${level}`} className="hover:underline">
          {data.level.code}
        </Link>
        {" › "}
        <Link href={moduleHref} className="hover:underline">
          <LocalizedText text={data.module.title} prefer="de" />
        </Link>
      </nav>
      <LocalizedText as="h1" text={data.lesson.title} prefer="de" className="mt-1 text-2xl font-semibold tracking-tight" />
      {data.lesson.title.en && data.lesson.title.de && <p className="text-ink-muted">{data.lesson.title.en}</p>}
    </div>
  );

  if (!data.available) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {header}
        <div className="mt-6">
          <Alert tone="warning">This lesson is being updated and is not available right now. Please try again later.</Alert>
        </div>
      </div>
    );
  }

  const { blocks } = data;
  const current = blocks.find((b) => b.key === blockParam) ?? blocks.find((b) => !b.done) ?? blocks[0];
  // Always address the step explicitly, so refreshing after a submission keeps the learner
  // (and their feedback) on the same step instead of jumping to the next unfinished one.
  if (current.key !== blockParam) redirect(`${base}?block=${current.key}`);
  const idx = blocks.indexOf(current);
  const next = blocks[idx + 1];
  const nextHref = next ? `${base}?block=${next.key}` : moduleHref;
  const nextLabel = next ? `Next: ${blockLabel(next)}` : "Back to module";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {header}
      <div className="mt-4 max-w-md">
        <div className="flex justify-between text-sm text-ink-muted">
          <span>
            {data.completion.done} of {data.completion.total} steps done
          </span>
          {data.lesson.estimatedMinutes && <span>about {data.lesson.estimatedMinutes} min</span>}
        </div>
        <ProgressBar value={(data.completion.done / data.completion.total) * 100} label="Lesson progress" className="mt-1.5" />
      </div>

      {data.completion.complete && (
        <div className="mt-4">
          <Alert tone="success">
            Lesson complete!{" "}
            {data.nextLesson ? (
              <Link href={`${moduleHref}/${data.nextLesson.slug}`} className="font-medium underline">
                Next lesson: <LocalizedText text={data.nextLesson.title} prefer="de" />
              </Link>
            ) : (
              <Link href={moduleHref} className="font-medium underline">
                Back to the module
              </Link>
            )}
          </Alert>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
          <LessonSteps blocks={blocks} currentKey={current.key} hrefFor={(key) => `${base}?block=${key}`} locale={locale} />
        </aside>

        <section aria-label={blockLabel(current)} className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Step {idx + 1} · {blockLabel(current)} {current.done && <span className="text-success-700">· done</span>}
          </p>
          <div className="mt-3">
            {current.type === "intro" && (
              <div className="space-y-6">
                <LocalizedText as="div" text={current.body} prefer={locale} className="max-w-prose whitespace-pre-line leading-relaxed" />
                <ContinueButton lessonId={data.lesson.id} blockKey={current.key} nextHref={nextHref} label="Let's start" />
              </div>
            )}

            {current.type === "grammar" && (
              <div className="space-y-6">
                <GrammarTopic grammar={current.grammar} locale={locale} />
                <ContinueButton lessonId={data.lesson.id} blockKey={current.key} nextHref={nextHref} label="Got it – continue" />
              </div>
            )}

            {current.type === "vocabulary" && (
              <div className="space-y-6">
                {current.title && <LocalizedText as="h2" text={current.title} prefer={locale} className="text-xl font-semibold" />}
                <Flashcards
                  key={current.key}
                  cards={current.cards}
                  locale={locale}
                  mode="lesson"
                  lessonId={data.lesson.id}
                  blockKey={current.key}
                  nextHref={nextHref}
                />
                <WordList cards={current.cards} locale={locale} />
              </div>
            )}

            {current.exercise && (
              <ExercisePlayer
                key={current.key}
                lessonId={data.lesson.id}
                exercise={current.exercise}
                stats={current.stats}
                locale={locale}
                nextHref={nextHref}
                nextLabel={nextLabel}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
