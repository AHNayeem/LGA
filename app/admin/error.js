"use client";

import { useEffect } from "react";
import Link from "next/link";

// Admin error boundary: keeps the admin navigation usable when one page fails.
export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-danger-700/20 bg-danger-50 p-6 text-sm text-danger-700" role="alert">
      <h1 className="text-lg font-semibold">This admin page could not be loaded</h1>
      <p className="mt-1">Please try again. If it keeps failing, check the server logs.</p>
      {error?.digest && <p className="mt-1 font-mono text-xs">Reference: {error.digest}</p>}
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={reset} className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 font-medium text-white hover:bg-brand-700">
          Try again
        </button>
        <Link href="/admin" className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-4 text-ink hover:bg-canvas">
          Admin dashboard
        </Link>
      </div>
    </div>
  );
}
