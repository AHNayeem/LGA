import Link from "next/link";

// Non-blocking invitation for guests: learning works without an account, an account only
// keeps the progress. `next` brings the learner back where they were after signing up.
export default function SaveProgressNudge({ next = "/dashboard", className = "", compact = false }) {
  const q = `?next=${encodeURIComponent(next)}`;
  return (
    <aside aria-label="Save your progress" className={`rounded-xl border border-brand-600/20 bg-brand-50 p-4 text-sm ${className}`} data-testid="save-progress">
      <p className="font-medium text-brand-700">Create a free account to keep your progress</p>
      {!compact && (
        <p className="mt-1 text-ink-muted">
          Right now your progress is kept in this browser only. With an account it is saved and follows you to any device.
        </p>
      )}
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <Link href={`/register${q}`} className="font-medium text-brand-700 underline">
          Create a free account
        </Link>
        <Link href={`/login${q}`} className="text-ink-muted underline">
          Sign in
        </Link>
      </p>
    </aside>
  );
}
