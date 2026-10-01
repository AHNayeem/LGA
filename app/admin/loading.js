// Skeleton of a typical admin page (header, toolbar, table) while the server renders.
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <div className="h-3 w-24 rounded bg-line" />
        <div className="mt-2 h-6 w-48 rounded bg-line" />
        <div className="mt-2 h-3 w-full max-w-md rounded bg-line/70" />
        <div className="mt-6 flex gap-2">
          <div className="h-8 w-64 rounded-md bg-line/70" />
          <div className="h-8 w-28 rounded-md bg-line/70" />
          <div className="h-8 w-28 rounded-md bg-line/70" />
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
          <div className="h-9 border-b border-line bg-canvas/60" />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex h-11 items-center gap-4 border-b border-line px-3 last:border-0">
              <div className="h-3 w-1/4 rounded bg-line/70" />
              <div className="h-3 w-1/5 rounded bg-line/50" />
              <div className="h-3 w-16 rounded bg-line/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
