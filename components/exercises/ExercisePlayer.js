"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { previewExerciseAction, submitExerciseAction } from "@/app/actions/learning";
import { gradeGuestExerciseAction } from "@/app/actions/guest";
import { updateGuestState } from "@/lib/learning/guestStore";
import { applyExerciseResult } from "@/lib/learning/state";
import { lessonCompletion } from "@/lib/learning/progress";
import { retryState } from "@/lib/exercises/retry";
import { RENDERERS, isItemAnswered } from "@/components/exercises/renderers";
import AudioPlayer from "@/components/audio/AudioPlayer";
import LocalizedText from "@/components/ui/LocalizedText";
import Alert from "@/components/ui/Alert";
import ActionError from "@/components/learn/ActionError";
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

const SUBMIT = { user: submitExerciseAction, guest: gradeGuestExerciseAction, preview: previewExerciseAction };

// Holds the learner's answers and shows the server's grading. No answer checking happens
// here: the payload has no answer key, and results always come back from the server.
//   mode "user"     submitExerciseAction grades and stores the attempt
//   mode "guest"    gradeGuestExerciseAction grades without storing; the result goes into
//                   this browser's guest state (`lessonBlocks` decide lesson completion)
//   mode "preview"  CMS draft preview: previewExerciseAction grades, nothing is kept
// Outside "user", item types skip their own writes (no recording upload).
//
// Try again keeps the items that were fully right (shown locked, marked ✓) and clears the
// others, so the learner only redoes their mistakes. The whole exercise is still submitted
// and graded on the server, so scores, attempts and progress follow the usual rules.
//
// `rule` ({ title, summary, href }): the lesson's grammar rule when this exercise
// practises it (lib/learning/topics.grammarLinkOf). After checking, a wrong item without
// its own explanation offers it as "Why?". Without a rule only the correct answer shows.
export default function ExercisePlayer({
  lessonId,
  exercise,
  stats,
  recordings = null,
  recordingLimits = null,
  locale = "en",
  nextHref,
  nextLabel = "Continue",
  returnLink = null,
  mode = "user",
  lessonBlocks = null,
  rule = null,
}) {
  const preview = mode === "preview";
  const local = mode !== "user";
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState(null); // null | "uploading" | "checking"
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState(null);
  const [round, setRound] = useState(0);
  const [kept, setKept] = useState({}); // itemId -> { result, reveal } of a right answer kept for the retry
  const [pending, startTransition] = useTransition();
  const listRef = useRef(null);

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
      if (prepare && !local) setPhase("uploading");
      out[item.id] = prepare ? await prepare(answers[item.id], { lessonId, exerciseId: exercise.id, itemId: item.id, preview: local }) : answers[item.id];
    }
    return out;
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const prepared = await prepareAnswers();
        setPhase("checking");
        const res = await SUBMIT[mode]({ lessonId, exerciseId: exercise.id, answers: prepared });
        if (!res.ok) return setError(res);
        if (mode === "guest") {
          const state = updateGuestState((s) =>
            applyExerciseResult(s, { lessonId, exerciseId: exercise.id, skill: exercise.skill, result: res.data.result, blocks: lessonBlocks }),
          );
          const completion = lessonCompletion({ blocks: lessonBlocks ?? [] }, state.lessons[lessonId]);
          setOutcome({ ...res.data, lesson: { done: completion.done, total: completion.total, complete: completion.complete, completedAt: state.lessons[lessonId]?.completedAt ?? null } });
        } else setOutcome(res.data);
      } catch (err) {
        setError(err?.message || "Something went wrong. Please try again.");
      } finally {
        setPhase(null);
      }
    });
  }

  function retry() {
    // Right answers stay, the rest is cleared (lib/exercises/retry.js).
    const next = retryState(exercise.items, result, answers, outcome?.reveal);
    setKept(next.kept);
    setAnswers(next.answers);
    setOutcome(null);
    setRound((r) => r + 1);
  }

  function clearAll() {
    setKept({});
    setAnswers({});
    setRound((r) => r + 1);
  }

  // After "Try again", move the focus to the first item to answer again.
  useEffect(() => {
    if (round === 0) return;
    const first = listRef.current?.querySelector("[data-item]:not([data-kept]) :is(input, select, button):not([disabled])");
    first?.focus();
  }, [round]);

  const keptCount = outcome ? 0 : Object.keys(kept).length;
  // "Why?" for wrong items without their own explanation: open for the first, collapsed after.
  const firstFallback = outcome
    ? exercise.items.find((i) => resultById[i.id]?.correct === false && !outcome.reveal?.items?.[i.id]?.explanation)?.id
    : null;

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

      <ol className="space-y-4" ref={listRef}>
        {exercise.items.map((item, idx) => {
          const Renderer = RENDERERS[item.type];
          const k = outcome ? null : (kept[item.id] ?? null);
          const r = k ? k.result : resultById[item.id];
          const reveal = k ? k.reveal : outcome?.reveal?.items?.[item.id];
          const explanation = k ? null : reveal?.explanation;
          const showRule = Boolean(outcome && rule && r?.correct === false && !explanation);
          return (
            <li key={`${round}-${item.id}`} className={`rounded-xl border border-line p-4 ${k ? "bg-canvas" : "bg-surface"}`} data-item={item.id} data-kept={k ? "" : undefined}>
              <fieldset>
                <legend className="mb-3 flex w-full flex-wrap items-center gap-2">
                  <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-muted">{idx + 1}</span>
                  {item.prompt && <LocalizedText text={item.prompt} prefer={locale} className="font-medium" />}
                  {r && r.correct !== null && (
                    <span className={`ml-auto text-sm font-semibold ${r.correct ? "text-success-700" : "text-danger-700"}`}>
                      {k ? "✓ Correct · kept" : r.correct ? "✓ Correct" : r.score > 0 ? `${r.score}/${r.maxScore}` : "✗ Not quite"}
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
                    disabled={Boolean(outcome) || pending || Boolean(k)}
                    reveal={reveal}
                    result={r}
                    locale={locale}
                    context={{ recordings, recordingLimits, preview: local, mode }}
                    submitted={outcome ? { recording: outcome.recordings?.[item.id] ?? null } : null}
                  />
                ) : (
                  <p className="text-sm text-danger-700">This question type is not supported yet.</p>
                )}
                {explanation && (
                  <LocalizedText as="p" text={explanation} prefer={locale} className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm" />
                )}
                {showRule && (
                  <details className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm" open={item.id === firstFallback} data-rule-fallback>
                    <summary className="cursor-pointer font-medium">
                      Why? The rule: <LocalizedText text={rule.title} prefer="de" />
                    </summary>
                    {rule.summary && <LocalizedText as="p" text={rule.summary} prefer={locale} className="mt-1" />}
                    {rule.href && (
                      <Link href={rule.href} className="mt-1 inline-block font-medium text-brand-700 hover:underline">
                        Read the whole rule
                      </Link>
                    )}
                  </details>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      <ActionError error={error} />

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:border">
        {!outcome ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-ink-muted">
              <p aria-live="polite">
                {answered} of {exercise.items.length} answered
                {keptCount > 0 && ` · ${keptCount} right ${keptCount === 1 ? "answer" : "answers"} kept`}
              </p>
              {keptCount > 0 && (
                <button type="button" onClick={clearAll} disabled={pending} className="mt-0.5 text-sm font-medium text-brand-700 underline disabled:opacity-60">
                  Clear all answers
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!allAnswered || pending}
              className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending
                ? phase === "uploading"
                  ? "Uploading recording…"
                  : graded || local
                    ? "Checking…"
                    : "Saving…"
                : graded
                  ? "Check answers"
                  : local
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
                <p className="font-semibold">{preview ? "Done (not saved in preview)." : mode === "guest" ? "Done." : "Saved."} Speaking practice is not scored.</p>
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
              {returnLink && (
                <Link href={returnLink.href} className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
                  {returnLink.label}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
