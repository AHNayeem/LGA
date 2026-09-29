"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { previewExerciseAction, submitExerciseAction } from "@/app/actions/learning";
import { RENDERERS, isItemAnswered } from "@/components/exercises/renderers";
import AudioPlayer from "@/components/audio/AudioPlayer";
import LocalizedText from "@/components/ui/LocalizedText";
import Alert from "@/components/ui/Alert";
import ContentImage from "@/components/learn/ContentImage";

const pct = (r) => `${Math.round((r ?? 0) * 100)}%`;

// Also used by the exam player and result (components/exams).
export function Stimulus({ stimulus, transcript, locale }) {
  return (
    <div className="space-y-3">
      {stimulus.image && <ContentImage image={stimulus.image} locale={locale} />}
      {stimulus.audio && <AudioPlayer sources={stimulus.audio.sources} maxPlays={stimulus.audio.maxPlays} label="Play recording" />}
      {stimulus.text && (
        <LocalizedText
          as="div"
          text={stimulus.text}
          prefer="de"
          data-kind={stimulus.textKind ?? undefined}
          className={`whitespace-pre-line rounded-lg border border-line bg-canvas p-4 leading-relaxed ${stimulus.textKind === "sign" ? "text-center font-semibold" : ""}`}
        />
      )}
      {transcript?.length > 0 && (
        <details className="rounded-lg border border-line bg-surface p-3" open>
          <summary className="cursor-pointer text-sm font-medium">Transcript</summary>
          <dl className="mt-2 space-y-1" lang="de">
            {transcript.map((line, i) => (
              <div key={i} className="flex gap-2">
                {line.speaker && <dt className="shrink-0 font-medium">{line.speaker}:</dt>}
                <dd>{line.text}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}

// Holds the learner's answers and shows the server's grading. No answer checking happens
// here: the payload has no answer key, and results come back from submitExerciseAction.
// In the CMS draft preview (`preview`) answers are graded by previewExerciseAction, which
// stores nothing, and item types skip their own writes (no recording upload).
export default function ExercisePlayer({
  lessonId,
  exercise,
  stats,
  recordings = null,
  recordingLimits = null,
  locale = "en",
  nextHref,
  nextLabel = "Continue",
  preview = false,
}) {
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState(null); // null | "uploading" | "checking"
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState(null);
  const [round, setRound] = useState(0);
  const [pending, startTransition] = useTransition();

  const answered = exercise.items.filter((i) => isItemAnswered(i, answers[i.id])).length;
  const allAnswered = answered === exercise.items.length;
  const result = outcome?.result;
  const resultById = Object.fromEntries((result?.items ?? []).map((r) => [r.itemId, r]));
  const graded = exercise.maxScore > 0;

  // Item types may need to prepare their answer first (speaking uploads its recording).
  async function prepareAnswers() {
    const out = {};
    for (const item of exercise.items) {
      const prepare = RENDERERS[item.type]?.prepareAnswer;
      if (!Object.hasOwn(answers, item.id)) continue;
      if (prepare && !preview) setPhase("uploading");
      out[item.id] = prepare ? await prepare(answers[item.id], { lessonId, exerciseId: exercise.id, itemId: item.id, preview }) : answers[item.id];
    }
    return out;
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const prepared = await prepareAnswers();
        setPhase("checking");
        const submitAction = preview ? previewExerciseAction : submitExerciseAction;
        const res = await submitAction({ lessonId, exerciseId: exercise.id, answers: prepared });
        if (res.ok) setOutcome(res.data);
        else setError(res.message);
      } catch (err) {
        setError(err?.message || "Something went wrong. Please try again.");
      } finally {
        setPhase(null);
      }
    });
  }

  function retry() {
    setAnswers({});
    setOutcome(null);
    setRound((r) => r + 1);
  }

  return (
    <div className="space-y-6" data-exercise={exercise.id}>
      <header>
        <LocalizedText as="h2" text={exercise.title} prefer="de" className="text-xl font-semibold" />
        {exercise.instructions && <LocalizedText as="p" text={exercise.instructions} prefer={locale} className="mt-1 text-ink-muted" />}
        {stats?.attempts > 0 && !outcome && (
          <p className="mt-1 text-xs text-ink-muted">
            {stats.attempts} attempt{stats.attempts === 1 ? "" : "s"} so far
            {stats.bestRatio != null ? ` · best ${pct(stats.bestRatio)}` : ""}
          </p>
        )}
      </header>

      {exercise.stimulus && <Stimulus key={`s${round}`} stimulus={exercise.stimulus} transcript={outcome?.reveal?.transcript} locale={locale} />}

      <ol className="space-y-4">
        {exercise.items.map((item, idx) => {
          const Renderer = RENDERERS[item.type];
          const r = resultById[item.id];
          const reveal = outcome?.reveal?.items?.[item.id];
          const explanation = reveal?.explanation;
          return (
            <li key={`${round}-${item.id}`} className="rounded-xl border border-line bg-surface p-4" data-item={item.id}>
              <fieldset>
                <legend className="mb-3 flex w-full flex-wrap items-center gap-2">
                  <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-muted">{idx + 1}</span>
                  {item.prompt && <LocalizedText text={item.prompt} prefer={locale} className="font-medium" />}
                  {r && r.correct !== null && (
                    <span className={`ml-auto text-sm font-semibold ${r.correct ? "text-success-700" : "text-danger-700"}`}>
                      {r.correct ? "✓ Correct" : r.score > 0 ? `${r.score}/${r.maxScore}` : "✗ Not quite"}
                    </span>
                  )}
                </legend>
                {item.audio && (
                  <div className="mb-3">
                    <AudioPlayer sources={[item.audio]} maxPlays={exercise.itemAudioMaxPlays} label="Listen" size="sm" />
                  </div>
                )}
                {Renderer ? (
                  <Renderer
                    item={item}
                    name={`${exercise.id}-${item.id}-${round}`}
                    value={answers[item.id]}
                    onChange={(v) => setAnswers((a) => ({ ...a, [item.id]: typeof v === "function" ? v(a[item.id]) : v }))}
                    disabled={Boolean(outcome) || pending}
                    reveal={reveal}
                    result={r}
                    locale={locale}
                    context={{ recordings, recordingLimits, preview }}
                    submitted={outcome ? { recording: outcome.recordings?.[item.id] ?? null } : null}
                  />
                ) : (
                  <p className="text-sm text-danger-700">This question type is not supported yet.</p>
                )}
                {explanation && (
                  <LocalizedText as="p" text={explanation} prefer={locale} className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm" />
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:border">
        {!outcome ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-muted" aria-live="polite">
              {answered} of {exercise.items.length} answered
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={!allAnswered || pending}
              className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? phase === "uploading"
                  ? "Uploading recording…"
                  : graded || preview
                    ? "Checking…"
                    : "Saving…"
                : graded
                  ? "Check answers"
                  : preview
                    ? "Finish"
                    : "Save"}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3" role="status" aria-live="polite">
            <div>
              {result.graded ? (
                <p className="font-semibold">
                  {result.score} / {result.maxScore} points ({pct(result.ratio)})
                </p>
              ) : (
                <p className="font-semibold">{preview ? "Done (not saved in preview)." : "Saved."} Speaking practice is not scored.</p>
              )}
              <p className={`text-sm ${result.passed ? "text-success-700" : "text-warning-700"}`}>
                {result.passed
                  ? outcome.lesson.complete
                    ? "Passed – lesson complete!"
                    : "Passed."
                  : `You need ${pct(exercise.passThreshold)} to complete this step. Try again!`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={retry}
                className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas"
              >
                Try again
              </button>
              {result.passed && nextHref && (
                <Link href={nextHref} className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
                  {nextLabel}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
