const STYLES = {
  draft: "bg-canvas text-ink-muted",
  reviewed: "bg-warning-50 text-warning-700",
  approved: "bg-success-50 text-success-700",
  unpublished: "bg-canvas text-ink-muted",
  published: "bg-brand-50 text-brand-700",
  archived: "bg-danger-50 text-danger-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? STYLES.draft}`}>
      {status}
    </span>
  );
}
