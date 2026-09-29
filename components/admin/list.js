import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { LEVEL_CODES } from "@/lib/content/constants";

// Server-rendered building blocks for admin list pages. Filters are a plain GET form, so
// lists are bookmarkable and work without JavaScript.

export function PageHeader({ crumbs = [], title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
            {crumbs.map((c, i) => (
              <span key={c.href}>
                {i > 0 && " / "}
                <Link href={c.href} className="hover:underline">
                  {c.label}
                </Link>
              </span>
            ))}
          </nav>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ButtonLink({ href, children, variant = "primary" }) {
  const styles = variant === "primary" ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-line bg-surface hover:bg-canvas";
  return (
    <Link href={href} className={`inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium ${styles}`}>
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

// fields: [{ name, label, type: "search" | "select", options? }]
export function FilterBar({ action, fields, values }) {
  const input = "h-9 rounded-md border border-line bg-surface px-2 text-sm";
  return (
    <form action={action} method="get" role="search" className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-line bg-surface p-3">
      {fields.map((f) => (
        <div key={f.name} className={`flex flex-col gap-0.5 ${f.type === "search" ? "min-w-48 flex-1" : ""}`}>
          <label htmlFor={`filter-${f.name}`} className="text-xs font-medium text-ink-muted">
            {f.label}
          </label>
          {f.type === "select" ? (
            <select id={`filter-${f.name}`} name={f.name} defaultValue={values[f.name] ?? ""} className={input}>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input id={`filter-${f.name}`} name={f.name} type="search" defaultValue={values[f.name] ?? ""} className={input} placeholder={f.placeholder} />
          )}
        </div>
      ))}
      <button type="submit" className="h-9 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
        Apply
      </button>
      <Link href={action} className="inline-flex h-9 items-center px-2 text-sm text-ink-muted hover:underline">
        Reset
      </Link>
    </form>
  );
}

// Keeps the current filters when paging. `params` are the parsed query values.
export function Pagination({ basePath, params, page, pageSize, total }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p) => {
    const qs = new URLSearchParams(
      Object.entries({ ...params, page: p > 1 ? p : undefined }).filter(([k, v]) => v != null && v !== "" && k !== "pageSize"),
    ).toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const link = "inline-flex h-8 items-center rounded-md border border-line bg-surface px-3 text-sm hover:bg-canvas";
  return (
    <nav aria-label="Pagination" className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
      <span>
        {from}–{to} of {total}
      </span>
      {pages > 1 && (
        <span className="flex items-center gap-2">
          {page > 1 ? <Link href={href(page - 1)} className={link} rel="prev">← Previous</Link> : null}
          <span className="tabular-nums">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={href(page + 1)} className={link} rel="next">Next →</Link> : null}
        </span>
      )}
    </nav>
  );
}

export function StatusCell({ item }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <StatusBadge status={item.reviewStatus} />
      <StatusBadge status={item.publishStatus} />
      {item.reviewStatus === "approved" && item.approvalBasis === "test_fixture" && (
        <span className="text-xs font-medium text-warning-700" title="Test-fixture approval – not a genuine review">
          fixture
        </span>
      )}
      {item.sourceType === "ai_generated" && <span className="text-xs text-ink-muted">AI</span>}
    </div>
  );
}

// columns: [{ header, cell(item), className? }]
export function ContentTable({ items, columns, empty }) {
  if (items.length === 0) {
    return <div className="mt-4 rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-ink-muted">{empty}</div>;
  }
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase text-ink-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.header} scope="col" className="px-4 py-3 font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-line align-top last:border-0">
              {columns.map((c) => (
                <td key={c.header} className={`px-4 py-3 ${c.className ?? ""}`}>
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
    <div role="status" className="mt-4 rounded-lg border border-success-700/20 bg-success-50 px-4 py-3 text-sm text-success-700">
      The {what} was created as a <strong>draft</strong>. It stays invisible to learners until it is reviewed, approved and published.
    </div>
  );
}
