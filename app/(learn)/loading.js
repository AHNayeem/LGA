// Shown while a learner page renders on the server (slow network, cold start): the page's
// rough shape instead of a frozen screen. Guests' pages then fill in from the browser.
export default function LearnLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <div className="h-3 w-24 rounded bg-line" />
        <div className="mt-2 h-7 w-64 max-w-full rounded bg-line" />
        <div className="mt-2 h-3 w-full max-w-md rounded bg-line/70" />
        <div className="mt-6 h-32 w-full max-w-2xl rounded-xl border border-line bg-surface" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-xl border border-line bg-surface" />
          <div className="h-40 rounded-xl border border-line bg-surface" />
        </div>
      </div>
    </div>
  );
}
