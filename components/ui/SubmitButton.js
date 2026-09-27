"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, pendingLabel = "Please wait…", variant = "primary", className = "", ...props }) {
  const { pending } = useFormStatus();
  const styles =
    variant === "primary"
      ? "bg-brand-600 text-white hover:bg-brand-700"
      : "border border-line bg-surface text-ink hover:bg-canvas";
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex h-11 items-center justify-center rounded-lg px-4 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
