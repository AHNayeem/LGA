"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Alert from "@/components/ui/Alert";

// The error of a learner action ({ ok: false, code, message } from runAction). When the
// session ended while the page was open (UNAUTHENTICATED), the learner gets a way back:
// sign in again and return to this very page. Everything else shows the server's message.
export default function ActionError({ error }) {
  const pathname = usePathname();
  if (!error) return null;
  if (error.code === "UNAUTHENTICATED") {
    // Only shown after an action ran in the browser, so window is there.
    const here = `${pathname}${typeof window === "undefined" ? "" : window.location.search}`;
    return (
      <Alert tone="error">
        Your session has ended, so this wasn&apos;t saved.{" "}
        <Link href={`/login?next=${encodeURIComponent(here)}`} className="font-medium underline">
          Sign in again
        </Link>{" "}
        to continue here.
      </Alert>
    );
  }
  return <Alert tone="error">{error.message ?? String(error)}</Alert>;
}
