export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand-600" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
