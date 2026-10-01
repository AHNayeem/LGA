"use client";

import { useState } from "react";
import Link from "next/link";
import { clearGuestState, hasGuestProgress, useGuestState } from "@/lib/learning/guestStore";
import { GOAL_OPTIONS } from "@/lib/learning/profile";

// A guest's account page: what "learning as a guest" means, what this browser keeps, and
// the way to an account. Counts are read from the guest state itself.
export default function GuestAccount() {
  const state = useGuestState();
  const [confirming, setConfirming] = useState(false);
  const lessonsStarted = state ? Object.keys(state.lessons).length : 0;
  const lessonsDone = state ? Object.values(state.lessons).filter((l) => l.completedAt).length : 0;
  const words = state ? Object.keys(state.vocab).length : 0;
  const exams = state ? Object.values(state.exams).reduce((n, l) => n + l.length, 0) : 0;
  const goal = GOAL_OPTIONS.find((g) => g.value === state?.profile?.goal);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="font-semibold">You are learning as a guest</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Everything works without an account. Your progress is kept in this browser on this device only: it isn&apos;t saved to an account and is lost if you clear your
          browser data.
        </p>
        {state && (
          <ul className="mt-3 space-y-1 text-sm" data-testid="guest-summary">
            <li>
              Lessons: {lessonsDone} completed, {lessonsStarted} started
            </li>
            <li>Words practised: {words}</li>
            <li>Practice exams taken: {exams}</li>
            <li>
              Goal: {goal ? goal.label : "not set"} ·{" "}
              <Link href="/start" className="text-brand-700 underline">
                {goal ? "change" : "set your goal"}
              </Link>
            </li>
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-brand-600/20 bg-brand-50 p-5">
        <h2 className="font-semibold text-brand-700">Keep your progress with a free account</h2>
        <p className="mt-1 text-sm text-ink-muted">Your lessons, results, words and exam results are saved and follow you to any device.</p>
        <p className="mt-2 text-xs text-ink-muted">Progress you made as a guest stays in this browser; it isn&apos;t moved into the new account.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/register" className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700">
            Create a free account
          </Link>
          <Link href="/login" className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
            Sign in
          </Link>
        </div>
      </section>

      {hasGuestProgress(state) && (
        <section className="rounded-xl border border-line bg-surface p-5 text-sm">
          <h2 className="font-semibold">Start over on this device</h2>
          {confirming ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span>Delete all guest progress in this browser?</span>
              <button type="button" onClick={() => (clearGuestState(), setConfirming(false))} className="rounded-lg bg-danger-700 px-3 py-2 font-medium text-white">
                Delete
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-line px-3 py-2">
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="mt-2 text-danger-700 underline">
              Clear my guest progress
            </button>
          )}
        </section>
      )}
    </div>
  );
}
