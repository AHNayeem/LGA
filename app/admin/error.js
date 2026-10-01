"use client";

import { useEffect } from "react";
import Link from "next/link";
import Icon from "@/components/admin/icons";
import { buttonClass } from "@/components/ui/button";

// Admin error boundary: keeps the admin navigation usable when one page fails.
export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto mt-10 max-w-lg rounded-lg border border-line bg-surface p-5 shadow-xs" role="alert">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-danger-50 text-danger-700" aria-hidden="true">
          <Icon name="alert" />
        </span>
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold">This admin page could not be loaded</h1>
          <p className="mt-1 text-[13px] text-ink-muted">Please try again. If it keeps failing, check the server logs.</p>
          {error?.digest && <p className="mt-1 font-mono text-xs text-ink-muted">Reference: {error.digest}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={reset} className={buttonClass({ variant: "primary" })}>
              Try again
            </button>
            <Link href="/admin" className={buttonClass({ variant: "secondary" })}>
              Admin dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
