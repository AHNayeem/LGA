"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startExamAction } from "@/app/actions/exams";
import Alert from "@/components/ui/Alert";
import ActionError from "@/components/learn/ActionError";

// Starts a new attempt (or resumes the open one) on the server, then opens it.
export default function StartExamButton({ examId, resume = false, durationMinutes = null }) {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  function start() {
    setError(null);
    startTransition(async () => {
      const res = await startExamAction({ examId });
      if (res.ok) router.push(`/exams/attempts/${res.data.attemptId}`);
      else setError(res);
    });
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "Opening…" : resume ? "Continue the exam" : "Start the exam"}
      </button>
      {!resume && durationMinutes && <p className="text-xs text-ink-muted">The timer starts as soon as you start.</p>}
      <ActionError error={error} />
    </div>
  );
}
