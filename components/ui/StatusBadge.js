// Compact lifecycle badge: a tone dot plus the status word (the word is the accessible text).
const STYLES = {
  draft: ["border-line bg-surface text-ink-muted", "bg-ink-subtle"],
  reviewed: ["border-warning-700/20 bg-warning-50 text-warning-700", "bg-warning-700"],
  approved: ["border-success-700/20 bg-success-50 text-success-700", "bg-success-700"],
  unpublished: ["border-line bg-surface text-ink-muted", "border border-ink-subtle"],
  published: ["border-brand-600/20 bg-brand-50 text-brand-700", "bg-brand-600"],
  archived: ["border-line bg-canvas text-ink-muted", "bg-line-strong"],
};

export default function StatusBadge({ status }) {
  const [badge, dot] = STYLES[status] ?? STYLES.draft;
  return (
    <span className={`inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 text-[11px] font-medium leading-none ${badge}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}
