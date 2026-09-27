"use client";

import { useEffect } from "react";

// Route-level error boundary. Server errors arrive with a digest only; details stay in logs.
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-ink-muted">Please try again. If the problem continues, come back in a few minutes.</p>
      {error?.digest && <p className="mt-2 font-mono text-xs text-ink-muted">Reference: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  );
}
