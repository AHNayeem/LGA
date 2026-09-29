"use client";

import { RENDERERS } from "@/components/exercises/renderers";
import { Stimulus } from "@/components/exercises/ExercisePlayer";
import LocalizedText from "@/components/ui/LocalizedText";

const pct = (r) => (r == null ? "–" : `${Math.round(r * 100)}%`);
const noop = () => {};

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function Mark({ r }) {
  if (!r) return null;
  if (!r.answered) return <span className="ml-auto text-sm font-semibold text-warning-700">Not answered</span>;
  return (
    <span className={`ml-auto text-sm font-semibold ${r.correct ? "text-success-700" : "text-danger-700"}`}>
      {r.correct ? "✓ Correct" : r.score > 0 ? `${r.score}/${r.maxScore}` : "✗ Wrong"}
    </span>
  );
}

// Review of one task. With the "marks" policy there is no reveal: the learner's answers
// are shown read-only with right/wrong per question, never the correct answer.
function ReviewTask({ entry, locale }) {
  const { exercise, answers, items, reveal } = entry;
  const byId = Object.fromEntries(items.map((r) => [r.itemId, r]));
  return (
    <section className="space-y-4 rounded-xl border border-line bg-surface p-4" data-review-exercise={exercise.id}>
      <header>
        <LocalizedText as="h3" text={exercise.title} prefer="de" className="font-semibold" />
        {exercise.instructions && <LocalizedText as="p" text={exercise.instructions} prefer={locale} className="text-sm text-ink-muted" />}
      </header>
      {exercise.stimulus && <Stimulus stimulus={{ ...exercise.stimulus, audio: null }} transcript={reveal?.transcript} locale={locale} />}
      <ol className="space-y-3">
        {exercise.items.map((item, i) => {
          const Renderer = RENDERERS[item.type];
          const r = byId[item.id];
          const itemReveal = reveal?.items?.[item.id];
          return (
            <li key={item.id} className="rounded-lg border border-line p-3" data-item={item.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-canvas px-2 py-0.5 text-xs font-semibold text-ink-muted">{exercise.firstNumber + i}</span>
                {item.prompt && <LocalizedText text={item.prompt} prefer={locale} className="font-medium" />}
                <Mark r={r} />
              </div>
              {Renderer && (
                <Renderer
                  item={item}
                  name={`review-${exercise.id}-${item.id}`}
                  value={answers?.[item.id]}
                  onChange={noop}
                  disabled
                  reveal={itemReveal}
                  result={r}
                  locale={locale}
                  context={{ recordings: null, recordingLimits: null, preview: true }}
                  submitted={null}
                />
              )}
              {itemReveal?.explanation && (
                <LocalizedText as="p" text={itemReveal.explanation} prefer={locale} className="mt-2 rounded-lg bg-canvas px-3 py-2 text-sm" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// Final result of an exam attempt: score, percentage, pass/fail, section breakdown and,
// as far as the exam's review policy allows, the per-question review.
export default function ExamResult({ view, locale = "en", preview = false, learnerPolicy = null }) {
  const r = view.result;
  if (!r) {
    return (
      <div className="rounded-xl border border-warning-700/30 bg-warning-50 p-5" role="status">
        <p className="font-semibold">Time ran out before the exam was submitted.</p>
        <p className="mt-1 text-sm">This attempt was closed without a score. You can start a new attempt.</p>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <section aria-labelledby="result-heading" className="rounded-xl border border-line bg-surface p-5" role="status">
        <h2 id="result-heading" className="text-lg font-semibold">
          Result
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
          <p>
            <span className="block text-4xl font-semibold tabular-nums" data-testid="exam-percent">
              {pct(r.ratio)}
            </span>
            <span className="text-sm text-ink-muted tabular-nums" data-testid="exam-score">
              {r.score} of {r.maxScore} points
            </span>
          </p>
          <p
            className={`rounded-lg px-3 py-1.5 text-lg font-semibold ${r.passed ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"}`}
            data-testid="exam-verdict"
          >
            {r.passed ? "Passed" : "Not passed"}
          </p>
          <p className="text-sm text-ink-muted">
            Pass mark: {pct(r.passThreshold)} · {r.answeredCount} of {r.questionCount} questions answered
            {view.submittedAt && <> · submitted {formatDate(view.submittedAt)}</>}
            {view.submitReason === "timer" && " (automatically, when the time ran out)"}
          </p>
        </div>
        <p className="mt-3 text-xs text-ink-muted">This is a practice result with the app&apos;s own pass mark, not an official Goethe exam result.</p>

        <table className="mt-5 w-full text-sm">
          <caption className="sr-only">Score per section</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th scope="col" className="py-2 font-medium">
                Section
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Points
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                %
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Answered
              </th>
            </tr>
          </thead>
          <tbody>
            {r.sections.map((s) => (
              <tr key={s.key} className="border-b border-line last:border-0" data-section={s.key}>
                <th scope="row" className="py-2 text-left font-medium">
                  <LocalizedText text={s.title} prefer="de" />
                </th>
                <td className="py-2 text-right tabular-nums">
                  {s.score} / {s.maxScore}
                </td>
                <td className="py-2 text-right tabular-nums">{pct(s.ratio)}</td>
                <td className="py-2 text-right tabular-nums">
                  {s.answeredCount} / {s.questionCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {preview && learnerPolicy && learnerPolicy !== "full" && (
        <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm">
          Preview shows the full review. Learners see: <strong>{learnerPolicy === "summary" ? "scores only" : "scores and right/wrong per question"}</strong>.
        </p>
      )}

      {view.review ? (
        <section aria-labelledby="review-heading" className="space-y-6">
          <h2 id="review-heading" className="text-lg font-semibold">
            Review
          </h2>
          {view.review.map((s) => (
            <div key={s.key} className="space-y-3">
              <LocalizedText as="h3" text={s.title} prefer="de" className="text-base font-semibold" />
              {s.exercises.map((entry) => (
                <ReviewTask key={entry.exercise.id} entry={entry} locale={locale} />
              ))}
            </div>
          ))}
        </section>
      ) : (
        <p className="text-sm text-ink-muted">The answers of this exam are not shown after submission.</p>
      )}
    </div>
  );
}
