"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isDraftExpired, readExamDraft } from "@/lib/exams/draft";
import { useGuestState } from "@/lib/learning/guestStore";
import ExamPlayer from "@/components/exams/ExamPlayer";

const pct = (r) => (r == null ? "–" : `${Math.round(r * 100)}%`);

// A guest taking a practice exam (see ExamPlayer, `guest`).
export function GuestExamPlayer({ guest, paper, locale, overviewHref, practice }) {
  const router = useRouter();
  return <ExamPlayer paper={paper} locale={locale} guest={guest} practice={practice} onExit={() => router.push(overviewHref)} />;
}

// An unfinished attempt kept in this browser (lib/exams/draft.js): whether there is one, and
// the minutes left if it's timed. Read after hydration; null until then.
function useUnfinishedAttempt(examId, version, durationMinutes) {
  const [draft, setDraft] = useState(null);
  useEffect(() => {
    const durationMs = durationMinutes ? durationMinutes * 60_000 : null;
    // The overview has no paper, so the answers aren't checked here (the player does that).
    const d = readExamDraft(`guest:${examId}:${version}`, { itemIds: {}, taskCount: 1, durationMs });
    const started = d?.startedAt != null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (d && !isDraftExpired(d, durationMs) && (started || !durationMs)) setDraft({ minutesLeft: durationMs && started ? Math.max(0, Math.ceil((d.startedAt + durationMs - Date.now()) / 60_000)) : null });
  }, [examId, version, durationMinutes]);
  return draft;
}

// The start button and the results kept in this browser.
export function GuestExamStart({ examId, version, takeHref, durationMinutes }) {
  const state = useGuestState();
  const history = state?.exams?.[examId] ?? [];
  const unfinished = useUnfinishedAttempt(examId, version, durationMinutes);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Link href={takeHref} className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700" data-testid="guest-exam-start">
          {unfinished ? "Continue your practice exam" : "Start the practice exam"}
        </Link>
        <p className="text-xs text-ink-muted">
          {unfinished
            ? `Your answers so far are saved in this browser${unfinished.minutesLeft != null ? `, about ${unfinished.minutesLeft} ${unfinished.minutesLeft === 1 ? "minute" : "minutes"} left` : ""}. `
            : durationMinutes
              ? "The timer starts as soon as you start. "
              : ""}
          Without an account your result is shown right away and kept in this browser only.
        </p>
      </div>
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Your results on this device</h3>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface text-sm" data-testid="guest-exam-history">
            {history.map((h, i) => (
              <li key={`${h.at}-${i}`} className="flex flex-wrap justify-between gap-2 px-4 py-2">
                <span>{new Date(h.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="tabular-nums">
                  {h.score} / {h.maxScore} ({pct(h.ratio)}) ·{" "}
                  <span className={h.passed ? "text-success-700" : "text-danger-700"}>{h.passed ? "LGA practice target reached" : "below the LGA practice target"}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
