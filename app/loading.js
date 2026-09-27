export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16" role="status" aria-live="polite">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand-600" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
