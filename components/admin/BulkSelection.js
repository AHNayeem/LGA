"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { bulkSelectionAction } from "@/app/actions/content";
import { bulkMediaStatusAction } from "@/app/actions/media";
import { buttonClass } from "@/components/ui/button";

// Checkbox selection for admin tables. The row checkboxes are plain server-rendered inputs
// tied to the action bar's form through the `form` attribute (so they can sit next to the
// per-row forms without nesting). The server runs every selected item through the normal
// per-item lifecycle rules; items not in a step's starting state are skipped.

export const CONTENT_STEPS = [
  { step: "review", label: "Mark reviewed" },
  { step: "approve", label: "Approve" },
  { step: "publish", label: "Publish" },
  { step: "unpublish", label: "Unpublish" },
  { step: "draft", label: "Back to draft", confirm: "Move the selected items back to draft? Published ones are unpublished." },
  {
    step: "archive",
    label: "Archive",
    confirm: "Archive the selected items? They are hidden from learners and from the default lists. Lessons that use them become unavailable until they are restored and published.",
  },
  { step: "restore", label: "Restore" },
];

export const MEDIA_STEPS = [
  { step: "archive", label: "Archive", confirm: "Archive the selected files? They can't be attached or played until restored." },
  { step: "restore", label: "Restore" },
];

const ACTIONS = { content: bulkSelectionAction, media: bulkMediaStatusAction };

const rowSelector = (formId) => `input[type="checkbox"][data-bulk-row="${formId}"]`;
const eventName = (formId) => `bulk-selection:${formId}`;

function rows(formId) {
  return [...document.querySelectorAll(rowSelector(formId))];
}

function notify(formId) {
  document.dispatchEvent(new Event(eventName(formId)));
}

// Calls `fn` whenever a row of this table is (un)checked.
function useSelectionChange(formId, fn) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    const run = () => ref.current();
    const onChange = (e) => {
      if (e.target instanceof HTMLInputElement && e.target.dataset.bulkRow === formId) run();
    };
    run();
    document.addEventListener("change", onChange);
    document.addEventListener(eventName(formId), run);
    return () => {
      document.removeEventListener("change", onChange);
      document.removeEventListener(eventName(formId), run);
    };
  }, [formId]);
}

export function SelectAllCheckbox({ formId }) {
  const ref = useRef(null);
  const [checked, setChecked] = useState(false);
  useSelectionChange(formId, () => {
    const all = rows(formId);
    const on = all.filter((r) => r.checked).length;
    setChecked(all.length > 0 && on === all.length);
    if (ref.current) ref.current.indeterminate = on > 0 && on < all.length;
  });
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Select all on this page"
      className="size-3.5 align-middle accent-brand-600"
      checked={checked}
      onChange={(e) => {
        for (const r of rows(formId)) r.checked = e.target.checked;
        notify(formId);
      }}
    />
  );
}

function StepButton({ step, label, confirm, disabled }) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get("step") === step;
  return (
    <button
      type="submit"
      name="step"
      value={step}
      disabled={disabled || pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={buttonClass({ variant: step === "archive" ? "danger" : "secondary", size: "sm" })}
    >
      {mine ? "Working…" : label}
    </button>
  );
}

// `target`: "content" (with `kind`) or "media". `steps`: which buttons to offer; `omit`: step
// names to leave out (server pages can't filter the step lists: they are client-module exports).
export default function BulkActionBar({ formId, target = "content", kind, steps: allSteps = CONTENT_STEPS, omit = [] }) {
  const steps = allSteps.filter((s) => !omit.includes(s.step));
  const [state, formAction] = useActionState(ACTIONS[target], null);
  const [count, setCount] = useState(0);
  useSelectionChange(formId, () => setCount(rows(formId).filter((r) => r.checked).length));

  // After a successful step the list re-renders with new states; start a fresh selection.
  useEffect(() => {
    if (!state?.ok) return;
    for (const r of rows(formId)) r.checked = false;
    notify(formId);
  }, [state, formId]);

  const clear = () => {
    for (const r of rows(formId)) r.checked = false;
    notify(formId);
  };

  return (
    <div
      className={`mt-3 rounded-lg border px-3 py-1.5 transition-colors ${count > 0 ? "border-brand-600/25 bg-brand-50/60" : "border-line bg-surface"}`}
      data-testid="bulk-bar"
    >
      <form id={formId} action={formAction} className="flex min-h-7 flex-wrap items-center gap-1.5">
        {kind && <input type="hidden" name="kind" value={kind} />}
        <span className={`mr-2 text-xs tabular-nums ${count > 0 ? "font-medium text-brand-700" : "text-ink-muted"}`} role="status" aria-live="polite">
          {count === 0 ? "Select items to act on several at once" : `${count} selected`}
        </span>
        {steps.map((s) => (
          <StepButton key={s.step} {...s} disabled={count === 0} />
        ))}
        {count > 0 && (
          <button type="button" onClick={clear} className={buttonClass({ variant: "ghost", size: "sm" })}>
            Clear
          </button>
        )}
      </form>
      {state?.ok && (
        <p role="status" className="mt-1 pb-0.5 text-xs text-success-700">
          {state.data.changed} changed
          {state.data.skipped ? `, ${state.data.skipped} skipped (not in the right state for that step)` : ""}
          {state.data.failed.length ? `, ${state.data.failed.length} blocked` : ""}
        </p>
      )}
      {state?.ok && state.data.failed.length > 0 && (
        <ul className="mt-1 list-disc pb-1 pl-4 text-xs text-danger-700">
          {state.data.failed.slice(0, 8).map((f) => (
            <li key={f.id}>
              {f.slug ?? f.id}: {f.message}
            </li>
          ))}
          {state.data.failed.length > 8 && <li>… and {state.data.failed.length - 8} more</li>}
        </ul>
      )}
      {state && !state.ok && (
        <p role="alert" className="mt-1 pb-0.5 text-xs text-danger-700">
          {state.message}
        </p>
      )}
    </div>
  );
}
