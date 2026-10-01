import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { LEVEL_CODES } from "@/lib/content/constants";
import { SelectAllCheckbox } from "@/components/admin/BulkSelection";
import { EmptyState } from "@/components/admin/ui";
import Icon from "@/components/admin/icons";
import { buttonClass } from "@/components/ui/button";

// Server-rendered building blocks for admin list pages. Filters are a plain GET form, so
// lists are bookmarkable and work without JavaScript.

export function PageHeader({ crumbs = [], title, description, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1 flex flex-wrap items-center gap-1 text-xs text-ink-muted">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1">
                {i > 0 && (
                  <span className="text-line-strong" aria-hidden="true">
                    /
                  </span>
                )}
                <Link href={c.href} className="hover:text-ink hover:underline">
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// `icon`: an admin icon name shown before the label (e.g. "plus").
export function ButtonLink({ href, children, variant = "primary", size = "md", icon }) {
  return (
    <Link href={href} className={buttonClass({ variant, size })}>
      {icon && <Icon name={icon} className="size-3.5" />}
      {children}
    </Link>
  );
}

export const LEVEL_FILTER = [{ value: "", label: "All levels" }, ...LEVEL_CODES.map((c) => ({ value: c, label: c }))];

export const REVIEW_FILTER = [
  { value: "", label: "Any review state" },
  { value: "draft", label: "Draft" },
  { value: "reviewed", label: "Reviewed" },
  { value: "approved", label: "Approved" },
];

export const PUBLISH_FILTER = [
  { value: "", label: "Not archived" },
  { value: "unpublished", label: "Unpublished" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
  { value: "any", label: "Everything" },
];

const controlClass =
  "h-8 w-full rounded-md border border-line bg-surface text-[13px] shadow-xs outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

// fields: [{ name, label, type: "search" | "select", options? }]
export function FilterBar({ action, fields, values }) {
  return (
    <form action={action} method="get" role="search" className="mt-5 flex flex-wrap items-end gap-2">
      {fields.map((f) => (
        <div key={f.name} className={`flex flex-col gap-1 ${f.type === "search" ? "min-w-52 flex-1 sm:max-w-xs" : "min-w-32 max-sm:flex-1"}`}>
          <label htmlFor={`filter-${f.name}`} className="text-[11px] font-medium text-ink-muted">
            {f.label}
          </label>
          {f.type === "select" ? (
            <select id={`filter-${f.name}`} name={f.name} defaultValue={values[f.name] ?? ""} className={`${controlClass} px-2`}>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="relative">
              <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-subtle" />
              <input
                id={`filter-${f.name}`}
                name={f.name}
                type="search"
                defaultValue={values[f.name] ?? ""}
                className={`${controlClass} pl-8 pr-2`}
                placeholder={f.placeholder}
              />
            </span>
          )}
        </div>
      ))}
      <div className="flex items-center gap-1">
        <button type="submit" className={buttonClass({ variant: "secondary" })}>
          Apply
        </button>
        <Link href={action} className={buttonClass({ variant: "ghost" })}>
          Reset
        </Link>
      </div>
    </form>
  );
}

// Keeps the current filters when paging. `params` are the parsed query values.
export function Pagination({ basePath, params, page, pageSize, total }) {
  // The empty state already says there is nothing to show.
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p) => {
    const qs = new URLSearchParams(
      Object.entries({ ...params, page: p > 1 ? p : undefined }).filter(([k, v]) => v != null && v !== "" && k !== "pageSize"),
    ).toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const link = buttonClass({ variant: "secondary", size: "sm" });
  const off = `${link} pointer-events-none opacity-40`;
  return (
    <nav aria-label="Pagination" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
      <span className="tabular-nums">
        Showing {from}–{to} of {total}
      </span>
      {pages > 1 && (
        <span className="flex items-center gap-2">
          <span className="mr-1 tabular-nums">
            Page {page} of {pages}
          </span>
          {page > 1 ? (
            <Link href={href(page - 1)} className={link} rel="prev">
              <Icon name="chevronLeft" className="size-3.5" />
              Previous
            </Link>
          ) : (
            <span className={off} aria-hidden="true">
              <Icon name="chevronLeft" className="size-3.5" />
              Previous
            </span>
          )}
          {page < pages ? (
            <Link href={href(page + 1)} className={link} rel="next">
              Next
              <Icon name="chevronRight" className="size-3.5" />
            </Link>
          ) : (
            <span className={off} aria-hidden="true">
              Next
              <Icon name="chevronRight" className="size-3.5" />
            </span>
          )}
        </span>
      )}
    </nav>
  );
}

export function StatusCell({ item }) {
  return (
    <div className="flex flex-nowrap items-center gap-1">
      <StatusBadge status={item.reviewStatus} />
      <StatusBadge status={item.publishStatus} />
      {item.reviewStatus === "approved" && item.approvalBasis === "test_fixture" && (
        <span className="text-[11px] font-medium text-warning-700" title="Test-fixture approval – not a genuine review">
          fixture
        </span>
      )}
      {item.sourceType === "ai_generated" && <span className="text-[11px] text-ink-muted">AI</span>}
    </div>
  );
}

// A row checkbox for a BulkActionBar with the same `formId` (see components/admin/BulkSelection).
export function RowCheckbox({ formId, id, label }) {
  return (
    <input type="checkbox" name="ids" value={id} form={formId} data-bulk-row={formId} aria-label={label} className="size-3.5 align-middle accent-brand-600" />
  );
}

// Shared table styling, also for admin tables that don't go through ContentTable.
export const tableClasses = {
  wrap: "overflow-x-auto rounded-lg border border-line bg-surface shadow-xs",
  table: "w-full text-left text-[13px]",
  thead: "border-b border-line bg-canvas/60 text-[11px] uppercase tracking-wide text-ink-muted",
  th: "h-9 whitespace-nowrap px-3 font-medium",
  tr: "border-b border-line transition-colors last:border-0 hover:bg-canvas/50",
  td: "px-3 py-2 align-middle",
};

// columns: [{ header, cell(item), className? }]
// select: { formId, label?(item), can?(item) } adds a checkbox column for a BulkActionBar.
export function ContentTable({ items, columns, empty, select }) {
  if (items.length === 0) {
    return <EmptyState>{empty}</EmptyState>;
  }
  const t = tableClasses;
  return (
    <div className={`mt-3 ${t.wrap}`}>
      <table className={`${t.table} min-w-180`}>
        <thead className={t.thead}>
          <tr>
            {select && (
              <th scope="col" className="h-9 w-9 pl-3">
                <SelectAllCheckbox formId={select.formId} />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.header} scope="col" className={t.th}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={`${t.tr} has-[input[data-bulk-row]:checked]:bg-brand-50/70`}>
              {select && (
                <td className="w-9 py-2 pl-3 align-middle">
                  {(select.can?.(item) ?? true) && (
                    <RowCheckbox formId={select.formId} id={item.id} label={`Select ${select.label?.(item) ?? item.slug ?? item.id}`} />
                  )}
                </td>
              )}
              {columns.map((c) => (
                <td key={c.header} className={`${t.td} ${c.className ?? ""}`}>
                  {c.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Notice({ searchParams, what }) {
  if (searchParams?.created !== "1") return null;
  return (
    <div role="status" className="mt-4 rounded-md border border-success-700/20 bg-success-50 px-3 py-2 text-[13px] text-success-700">
      The {what} was created as a <strong>draft</strong>. It stays invisible to learners until it is reviewed, approved and published.
    </div>
  );
}
