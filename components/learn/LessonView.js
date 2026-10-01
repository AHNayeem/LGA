import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";
import Alert from "@/components/ui/Alert";
import ProgressBar from "@/components/learn/ProgressBar";
import LessonSteps, { blockLabel } from "@/components/learn/LessonSteps";
import ContinueButton from "@/components/learn/ContinueButton";
import GrammarTopic from "@/components/learn/GrammarTopic";
import Flashcards from "@/components/learn/Flashcards";
import ExercisePlayer from "@/components/exercises/ExercisePlayer";
import AiContentNotice from "@/components/learn/AiContentNotice";
import ContentImage from "@/components/learn/ContentImage";
import LessonResult from "@/components/learn/LessonResult";
import { lessonBlocksOf } from "@/lib/learning/journey";

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

// The lesson player, shared by the learner lesson page (signed in or guest) and the CMS
// draft preview. `data` comes from getLearnerLesson or getLessonPreview (same shape).
//
//   mode          "user" (stored on the server) | "guest" (kept in this browser, data
//                 already carries the guest's state, see GuestLesson) | "preview" (CMS,
//                 nothing is recorded)
//   currentKey    the block to show (the page resolves and redirects to it)
//   hrefFor(key)  URL of a step;  exitHref/exitLabel: where the last step leads
//   resultHref    the lesson result (after the last step); preview has none
//   showResult    render the lesson result instead of a step
//   levelHref / moduleHref  breadcrumb links (null renders plain text)
//   banner        optional node above the header (the preview banner)
//   returnLink    { href, label }: where the learner came from (Goethe Prep), offered above
//                 the step and after an exercise's result
export default function LessonView({
  data,
  locale,
  currentKey,
  hrefFor,
  levelHref,
  moduleHref,
  exitHref,
  exitLabel,
  unavailableMessage,
  banner = null,
  mode = "user",
  resultHref = null,
  showResult = false,
  returnLink = null,
}) {
  const crumb = (href, children) =>
    href ? (
      <Link href={href} className="hover:underline">
        {children}
      </Link>
    ) : (
      children
    );

  const header = (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        {crumb(levelHref, data.level.code)}
        {" › "}
        {crumb(moduleHref, <LocalizedText text={data.module.title} prefer="de" />)}
      </nav>
      <LocalizedText as="h1" text={data.lesson.title} prefer="de" className="mt-1 text-2xl font-semibold tracking-tight" />
      {data.lesson.title.en && data.lesson.title.de && <p className="text-ink-muted">{data.lesson.title.en}</p>}
    </div>
  );

  if (!data.available) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {banner}
        {header}
        <div className="mt-6">
          <Alert tone="warning">{unavailableMessage}</Alert>
        </div>
      </div>
    );
  }

  const { blocks } = data;
  const lessonBlocks = mode === "guest" ? lessonBlocksOf(data) : null;
  const current = showResult ? null : (blocks.find((b) => b.key === currentKey) ?? blocks[0]);
  const idx = current ? blocks.indexOf(current) : blocks.length;
  const next = blocks[idx + 1];
  const nextHref = next ? hrefFor(next.key) : (resultHref ?? exitHref);
  const nextLabel = next ? `Next: ${blockLabel(next)}` : resultHref ? "See your lesson result" : exitLabel;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {banner}
      {returnLink && (
        <p className="mb-3 text-sm">
          <Link href={returnLink.href} className="font-medium text-brand-700 hover:underline" data-testid="return-link">
            ← {returnLink.label}
          </Link>
        </p>
      )}
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
      {data.aiGenerated && <AiContentNotice className="mt-4 max-w-2xl" />}

      {data.completion.complete && !showResult && (
        <div className="mt-4">
          <Alert tone="success">
            Lesson complete!{" "}
            {resultHref ? (
              <Link href={resultHref} className="font-medium underline">
                See your lesson result
              </Link>
            ) : data.nextLesson ? (
              <Link href={`${moduleHref}/${data.nextLesson.slug}`} className="font-medium underline">
                Next lesson: <LocalizedText text={data.nextLesson.title} prefer="de" />
              </Link>
            ) : (
              <Link href={exitHref} className="font-medium underline">
                Back to the module
              </Link>
            )}
          </Alert>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
          <LessonSteps blocks={blocks} currentKey={current?.key ?? null} hrefFor={hrefFor} locale={locale} resultHref={resultHref} showResult={showResult} />
        </aside>

        {showResult ? (
          <section aria-label="Lesson result" className="min-w-0">
            <LessonResult data={data} locale={locale} hrefFor={hrefFor} moduleHref={moduleHref} mode={mode} selfHref={resultHref} />
          </section>
        ) : (
        <section aria-label={blockLabel(current)} className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Step {idx + 1} · {blockLabel(current)} {current.done && <span className="text-success-700">· done</span>}
          </p>
          <div className="mt-3">
            {current.type === "intro" && (
              <div className="space-y-6">
                {current.image && <ContentImage image={current.image} locale={locale} className="max-w-prose" />}
                <LocalizedText as="div" text={current.body} prefer={locale} className="max-w-prose whitespace-pre-line leading-relaxed" />
                <ContinueButton lessonId={data.lesson.id} blockKey={current.key} nextHref={nextHref} label="Let's start" mode={mode} lessonBlocks={lessonBlocks} />
              </div>
            )}

            {current.type === "grammar" && (
              <div className="space-y-6">
                <GrammarTopic grammar={current.grammar} locale={locale} />
                <ContinueButton lessonId={data.lesson.id} blockKey={current.key} nextHref={nextHref} label="Got it – continue" mode={mode} lessonBlocks={lessonBlocks} />
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
                  learner={mode}
                  lessonBlocks={lessonBlocks}
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
                recordings={current.recordings ?? null}
                recordingLimits={current.recordingLimits ?? null}
                locale={locale}
                nextHref={nextHref}
                nextLabel={nextLabel}
                mode={mode}
                lessonBlocks={lessonBlocks}
                returnLink={returnLink}
              />
            )}
          </div>
        </section>
        )}
      </div>
    </div>
  );
}
