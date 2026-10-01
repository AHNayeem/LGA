"use client";

import { useFormStatus } from "react-dom";
import { buttonClass } from "@/components/ui/button";

// `size` picks from the shared button scale (sm/md in the admin area); without it the
// button keeps the full-width-friendly learner style.
export default function SubmitButton({ children, pendingLabel = "Please wait…", variant = "primary", size, className = "", ...props }) {
  const { pending } = useFormStatus();
  const styles =
    variant === "primary"
      ? "bg-brand-600 text-white hover:bg-brand-700"
      : "border border-line bg-surface text-ink hover:bg-canvas";
  const cls = size
    ? buttonClass({ variant, size, className })
    : `inline-flex h-11 items-center justify-center rounded-lg px-4 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`;
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={cls} {...props}>
      {pending ? pendingLabel : children}
    </button>
  );
}
