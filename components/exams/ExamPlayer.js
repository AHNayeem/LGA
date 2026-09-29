"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewExamAction, submitExamAction } from "@/app/actions/exams";
import { RENDERERS, isItemAnswered } from "@/components/exercises/renderers";
import { Stimulus } from "@/components/exercises/ExercisePlayer";
import AudioPlayer from "@/components/audio/AudioPlayer";
import LocalizedText from "@/components/ui/LocalizedText";
import Alert from "@/components/ui/Alert";
import ExamResult from "@/components/exams/ExamResult";

// Runs an exam attempt: one task per screen with Previous/Next, a question palette with
// answered/unanswered state, an optional timer and a confirmation before submitting.
//
// No answer is checked or scored here: the paper has no answer keys, and answers are sent
// once, on submission, to submitExamAction, which grades them on the server. Until then
// they stay in this browser (sessionStorage, so a reload doesn't lose them). When the
// server's deadline passes, the exam is submitted automatically.
//
// In the CMS preview (`preview`) the same UI grades through previewExamAction, which
// stores nothing; the timer runs only in the browser.

const storageKey = (id) => `lga:exam:${id}`;

function readDraft(id) {
  try {
    const raw = window.sessionStorage.getItem(storageKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDraft(id, value) {
  try {
    window.sessionStorage.setItem(storageKey(id), JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode, quota): answers stay in memory only.
  }
}

function clearDraft(id) {
  try {
    window.sessionStorage.removeItem(storageKey(id));
  } catch {
    // ignore
  }
}

function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

function Timer({ deadline, offset, onExpire }) {
  const [now, setNow] = useState(() => Date.now() + offset);
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);
  const remaining = deadline - now;
  useEffect(() => {
    if (remaining <= 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [remaining, onExpire]);
  const low = remaining < 5 * 60_000;
  const minutesLeft = Math.max(0, Math.ceil(remaining / 60_000));
  return (
    <p className={`rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums ${low ? "bg-warning-50 text-warning-700" : "bg-canvas"}`} data-testid="exam-timer">
      <span aria-hidden="true">⏱ {formatRemaining(remaining)}</span>
      {/* Announced once per minute, not every second. */}
      <span className="sr-only" aria-live="polite">
        {minutesLeft} {minutesLeft === 1 ? "minute" : "minutes"} left
      </span>
    </p>
  );
}

export default function ExamPlayer({ attemptId = null, examId = null, paper, deadlineAt = null, serverNow = null, locale = "en", preview = false, learnerPolicy = null }) {
  const router = useRouter();
  const draftId = preview ? `preview:${examId}` : attemptId;
  const tasks = useMemo(
    () => paper.sections.flatMap((s, si) => s.exercises.map((ex) => ({ section: s, sectionIndex: si, exercise: ex }))),
    [paper],
  );
  const [answers, setAnswers] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState(null);
  const [outcome, setOutcome] = useState(null); // preview only: the graded view
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const submitted = useRef(false);
  // Server clock minus client clock, so the timer follows the server's deadline.
  const [offset] = useState(() => (serverNow ? new Date(serverNow).getTime() - Date.now() : 0));
  const [previewDeadline] = useState(() => (preview && paper.durationMinutes ? Date.now() + paper.durationMinutes * 60_000 : null));
  const deadline = preview ? previewDeadline : deadlineAt ? new Date(deadlineAt).getTime() : null;

  // Restore answers kept in this browser (a reload of a running attempt). Reading
  // sessionStorage can only happen after hydration, hence the effect.
  useEffect(() => {
    const draft = readDraft(draftId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft?.answers) setAnswers(draft.answers);
    if (Number.isInteger(draft?.index)) setIndex(Math.min(draft.index, tasks.length - 1));
    setLoaded(true);
  }, [draftId, tasks.length]);

  useEffect(() => {
    if (loaded && !submitted.current) writeDraft(draftId, { answers, index });
  }, [answers, index, loaded, draftId]);

  const questions = useMemo(
    () =>
      tasks.flatMap((t, ti) =>
        t.exercise.items.map((item, i) => ({
          number: t.exercise.firstNumber + i,
          taskIndex: ti,
          sectionIndex: t.sectionIndex,
          item,
          exerciseId: t.exercise.id,
          answered: isItemAnswered(item, answers[t.exercise.id]?.[item.id]),
        })),
      ),
    [tasks, answers],
  );
  const answeredCount = questions.filter((q) => q.answered).length;
  const unanswered = questions.filter((q) => !q.answered);

  const goTo = (i, focusQuestion = null) => {
    setIndex(i);
    requestAnimationFrame(() => {
      const target = focusQuestion ? document.getElementById(`q-${focusQuestion}`) : headingRef.current;
      target?.focus();
      target?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    });
  };

  const setAnswer = (exerciseId, itemId, v) =>
    setAnswers((a) => {
      const current = a[exerciseId]?.[itemId];
      return { ...a, [exerciseId]: { ...a[exerciseId], [itemId]: typeof v === "function" ? v(current) : v } };
    });

  const submit = useCallback(
    (reason = "user") => {
      if (submitted.current) return;
      setError(null);
      dialogRef.current?.close();
      startTransition(async () => {
        const res = preview
          ? await previewExamAction({ examId, answers })
          : await submitExamAction({ attemptId, answers, reason });
        if (res.ok) {
          submitted.current = true;
          clearDraft(draftId);
          if (preview) setOutcome(res.data);
          else router.refresh(); // the attempt page now renders the result
          window.scrollTo?.({ top: 0 });
        } else {
          setError(res.message);
          if (res.code === "CONFLICT" && !preview) {
            clearDraft(draftId);
            router.refresh();
          }
        }
      });
    },
    [preview, examId, attemptId, answers, draftId, router],
  );

  const onExpire = useCallback(() => submit("timer"), [submit]);

  if (outcome) {
    return (
      <div className="space-y-4">
        <ExamResult view={outcome.view} locale={locale} preview learnerPolicy={learnerPolicy} />
        <button
          type="button"
          onClick={() => {
            submitted.current = false;
            setOutcome(null);
            setAnswers({});
            setIndex(0);
          }}
          className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas"
        >
          Take the preview again
        </button>
      </div>
    );
  }

  const task = tasks[index];
  if (!task) return <Alert tone="error">This exam has no questions.</Alert>;
  const { exercise, section } = task;
  const isLast = index === tasks.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_16rem]" data-exam-player>
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">
            <LocalizedText text={section.title} prefer="de" className="font-medium text-ink" /> · Task {index + 1} of {tasks.length}
          </p>
          {/* Mounted only after the saved answers are restored, so an automatic submission
              right after a reload (deadline already passed) sends them. */}
          {deadline && loaded && <Timer deadline={deadline} offset={offset} onExpire={onExpire} />}
        </div>

        {section.instructions && index === tasks.findIndex((t) => t.section.key === section.key) && (
          <LocalizedText as="p" text={section.instructions} prefer={locale} className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm" />
        )}

        <header>
          <LocalizedText as="h2" ref={headingRef} tabIndex={-1} text={exercise.title} prefer="de" className="text-xl font-semibold focus:outline-none" />
          {exercise.instructions && <LocalizedText as="p" text={exercise.instructions} prefer={locale} className="mt-1 text-ink-muted" />}
        </header>

        {/* Keyed by task so a new task gets a fresh player (play counts are per task). */}
        {exercise.stimulus && <Stimulus key={exercise.id} stimulus={exercise.stimulus} transcript={null} locale={locale} />}

        <ol className="space-y-4">
          {exercise.items.map((item, i) => {
            const Renderer = RENDERERS[item.type];
            const number = exercise.firstNumber + i;
            return (
              <li key={`${exercise.id}-${item.id}`} className="rounded-xl border border-line bg-surface p-4" data-item={item.id}>
                <fieldset>
                  <legend id={`q-${number}`} tabIndex={-1} className="mb-3 flex w-full flex-wrap items-center gap-2 focus:outline-none">
                    <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-muted">
                      <span className="sr-only">Question </span>
                      {number}
                    </span>
                    {item.prompt && <LocalizedText text={item.prompt} prefer={locale} className="font-medium" />}
                  </legend>
                  {item.audio && (
                    <div className="mb-3">
                      <AudioPlayer key={`${exercise.id}-${item.id}`} sources={[item.audio]} maxPlays={exercise.itemAudioMaxPlays} label="Listen" size="sm" />
                    </div>
                  )}
                  {Renderer ? (
                    <Renderer
                      item={item}
                      name={`exam-${exercise.id}-${item.id}`}
                      value={answers[exercise.id]?.[item.id]}
                      onChange={(v) => setAnswer(exercise.id, item.id, v)}
                      disabled={pending}
                      reveal={undefined}
                      result={undefined}
                      locale={locale}
                      context={{ recordings: null, recordingLimits: null, preview: true }}
                      submitted={null}
                    />
                  ) : (
                    <p className="text-sm text-danger-700">This question type is not supported.</p>
                  )}
                </fieldset>
              </li>
            );
          })}
        </ol>

        {error && <Alert tone="error">{error}</Alert>}

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:border">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0 || pending}
            className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas disabled:opacity-40"
          >
            ← Previous
          </button>
          <p className="text-sm text-ink-muted" aria-live="polite">
            {answeredCount} of {questions.length} answered
          </p>
          {isLast ? (
            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
              disabled={pending}
              className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {pending ? "Submitting…" : "Finish exam"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={pending}
              className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      <aside aria-labelledby="palette-heading" className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <h2 id="palette-heading" className="text-sm font-semibold">
          Questions <span className="font-normal text-ink-muted">({questions.length - answeredCount} left)</span>
        </h2>
        {paper.sections.map((s, si) => (
          <div key={s.key}>
            <LocalizedText as="p" text={s.title} prefer="de" className="mb-1 text-xs font-medium text-ink-muted" />
            <ul className="flex flex-wrap gap-1.5">
              {questions
                .filter((q) => q.sectionIndex === si)
                .map((q) => {
                  const current = q.taskIndex === index;
                  return (
                    <li key={q.number}>
                      <button
                        type="button"
                        onClick={() => goTo(q.taskIndex, q.number)}
                        aria-label={`Question ${q.number}, ${q.answered ? "answered" : "not answered"}${current ? ", on this page" : ""}`}
                        aria-current={current ? "step" : undefined}
                        data-answered={q.answered || undefined}
                        className={`size-9 rounded-md border text-sm font-medium tabular-nums ${
                          q.answered ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface hover:bg-canvas"
                        } ${current ? "ring-2 ring-brand-600 ring-offset-2" : ""}`}
                      >
                        {q.number}
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
        <p className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block size-3 rounded-sm bg-brand-600" aria-hidden="true" /> answered
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block size-3 rounded-sm border border-line bg-surface" aria-hidden="true" /> open
          </span>
        </p>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-brand-600 px-4 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-60"
        >
          Submit exam…
        </button>
      </aside>

      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-heading"
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl border border-line bg-surface p-5 text-ink backdrop:bg-ink/40"
      >
        <h2 id="confirm-heading" className="text-lg font-semibold">
          Submit the exam?
        </h2>
        {unanswered.length > 0 ? (
          <p className="mt-2 text-sm">
            <strong>
              {unanswered.length} of {questions.length} questions
            </strong>{" "}
            are not answered: {unanswered.map((q) => q.number).join(", ")}. Unanswered questions score 0 points.
          </p>
        ) : (
          <p className="mt-2 text-sm">All {questions.length} questions are answered.</p>
        )}
        <p className="mt-2 text-sm text-ink-muted">{preview ? "Preview: nothing is saved." : "After submitting you can't change your answers."}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => dialogRef.current?.close()} className="inline-flex h-11 items-center rounded-lg border border-line px-4 font-medium hover:bg-canvas">
            Keep working
          </button>
          <button type="button" onClick={() => submit("user")} className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
            Submit now
          </button>
        </div>
      </dialog>
    </div>
  );
}
