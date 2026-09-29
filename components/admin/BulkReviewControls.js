"use client";

import { useActionState } from "react";
import { bulkModuleTransitionAction } from "@/app/actions/content";
import { bulkExamTransitionAction } from "@/app/actions/exams";
import SubmitButton from "@/components/ui/SubmitButton";

const STEPS = [
  { step: "review", label: "Mark all drafts reviewed" },
  { step: "approve", label: "Approve all reviewed" },
  { step: "publish", label: "Publish all approved" },
];

function StepForm({ moduleId, examId, step, label }) {
  const [state, formAction] = useActionState(examId ? bulkExamTransitionAction : bulkModuleTransitionAction, null);
  return (
    <form action={formAction} className="flex flex-col gap-1">
      {examId ? <input type="hidden" name="examId" value={examId} /> : <input type="hidden" name="moduleId" value={moduleId} />}
      <input type="hidden" name="step" value={step} />
      <SubmitButton variant="secondary" pendingLabel="Working…" className="h-9 px-3 text-sm">
        {label}
      </SubmitButton>
      {state?.ok && (
        <span role="status" className="text-xs text-success-700">
          {state.data.changed} changed{state.data.failed.length ? `, ${state.data.failed.length} blocked` : ""}
        </span>
      )}
      {state?.ok && state.data.failed.length > 0 && (
        <ul className="max-w-72 list-disc pl-4 text-xs text-danger-700">
          {state.data.failed.slice(0, 5).map((f) => (
            <li key={f.id}>
              {f.slug ?? f.kind}: {f.message}
            </li>
          ))}
        </ul>
      )}
      {state && !state.ok && (
        <span role="alert" className="text-xs text-danger-700">
          {state.message}
        </span>
      )}
    </form>
  );
}

// Applies one lifecycle step to every item of the module (or of the exam: its exercises and
// the exam itself) in the matching state. The server runs each item through the normal
// per-item rules; nothing skips a step.
export default function BulkReviewControls({ moduleId, examId }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      {STEPS.map((s) => (
        <StepForm key={s.step} moduleId={moduleId} examId={examId} {...s} />
      ))}
    </div>
  );
}
