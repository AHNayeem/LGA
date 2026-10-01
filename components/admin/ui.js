import Link from "next/link";
import Icon from "@/components/admin/icons";

// Small layout primitives shared by admin pages (server-renderable).

// A titled block of a page. Not a card: content decides whether it needs a border.
export function Section({ id, title, description, actions, children, className = "mt-8" }) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[15px] font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// A bordered surface with compact padding.
export function Card({ children, className = "" }) {
  return <div className={`rounded-lg border border-line bg-surface shadow-xs ${className}`}>{children}</div>;
}

// KPI tile: label, value, optional one-line detail and link.
export function StatCard({ label, value, detail, href, icon }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        {icon && <Icon name={icon} className="size-4 text-ink-subtle" />}
      </div>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {detail && <p className="mt-0.5 truncate text-xs text-ink-muted">{detail}</p>}
    </>
  );
  const cls = "block rounded-lg border border-line bg-surface px-4 py-3 shadow-xs";
  return href ? (
    <Link href={href} className={`${cls} transition-colors hover:border-line-strong`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function EmptyState({ children, icon = "inbox", className = "mt-3" }) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center text-[13px] text-ink-muted ${className}`}>
      <span className="grid size-9 place-items-center rounded-full bg-canvas" aria-hidden="true">
        <Icon name={icon} className="size-4 text-ink-subtle" />
      </span>
      <div className="max-w-md">{children}</div>
    </div>
  );
}

// Underline tabs made of links. items: [{ href, label, active, badge? }]
export function LinkTabs({ label, items, className = "" }) {
  return (
    <nav aria-label={label} className={`-mb-px flex gap-4 overflow-x-auto border-b border-line ${className}`}>
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 border-b-2 text-[13px] transition-colors ${
            t.active ? "border-brand-600 font-medium text-ink" : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink"
          }`}
        >
          {t.label}
          {t.badge ? (
            <span className={`rounded px-1.5 py-px text-[11px] tabular-nums ${t.active ? "bg-brand-50 text-brand-700" : "bg-canvas text-ink-muted"}`}>{t.badge}</span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

// Segmented control made of links, for a second, smaller set of filters.
export function LinkSegments({ label, items, className = "" }) {
  return (
    <nav aria-label={label} className={`inline-flex max-w-full overflow-x-auto rounded-md border border-line bg-surface p-0.5 shadow-xs ${className}`}>
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`inline-flex h-7 shrink-0 items-center rounded px-2.5 text-xs transition-colors ${
            t.active ? "bg-canvas font-medium text-ink ring-1 ring-line" : "text-ink-muted hover:text-ink"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
