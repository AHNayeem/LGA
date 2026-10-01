import Link from "next/link";
import { editHref, listHref, sectionForKind } from "@/lib/content/adminSections";
import { Notice, PageHeader, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";

// Frame around an editor: breadcrumb, lifecycle state and controls, "used by" links.
export default function EditFrame({ kind, item, title, searchParams, usedBy = [], extra, children, crumbs = [] }) {
  const section = sectionForKind(kind);
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }, { href: listHref(kind), label: section.label }, ...crumbs]}
        title={item ? title : `New ${section.singular}`}
        description={
          item
            ? undefined
            : "New content is saved as a draft and stays invisible to learners until it is reviewed, approved and published."
        }
      />
      <Notice searchParams={searchParams} what={section.singular} />

      {item && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] shadow-xs">
          <div className="flex items-center gap-2 border-line pr-4 sm:border-r">
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Status</span>
            <StatusCell item={item} />
            <span className="text-xs tabular-nums text-ink-muted">v{item.version}</span>
          </div>
          <LifecycleControls kind={kind} item={item} />
          {extra}
        </div>
      )}

      {usedBy.length > 0 && (
        <div className="mt-2 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] shadow-xs">
          <p className="text-xs font-medium text-ink-muted">Used by {usedBy.length} lesson(s). Archiving or unpublishing this makes them unavailable to learners.</p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {usedBy.map((l) => (
              <li key={l.id}>
                <Link href={editHref("lessons", l.id)} className="text-brand-700 hover:underline" lang="de">
                  {l.label}
                </Link>{" "}
                <span className="text-xs text-ink-muted">({l.publishStatus})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5">{children}</div>
    </>
  );
}
