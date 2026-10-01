import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { getAdminOverview, listContentForAdmin } from "@/lib/services/contentService";
import { ADMIN_SECTIONS, contentLabel, editHref } from "@/lib/content/adminSections";
import { pickText } from "@/lib/i18n/locales";
import { ContentTable, PageHeader, Pagination, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";
import BulkActionBar from "@/components/admin/BulkSelection";
import { LinkSegments, LinkTabs } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Review & publish" };

// Review queue across all content types. Every button runs the normal per-item lifecycle
// rules (no skipped steps, publish readiness checks); nothing here edits content.
const QUEUES = [
  { key: "draft", label: "Drafts to review", filter: { review: "draft" } },
  { key: "reviewed", label: "Reviewed, to approve", filter: { review: "reviewed" } },
  { key: "ready", label: "Approved, not published", filter: { review: "approved", publish: "unpublished" } },
  { key: "published", label: "Published", filter: { publish: "published" } },
  { key: "archived", label: "Archived", filter: { publish: "archived" } },
];

const first = (v) => (Array.isArray(v) ? v[0] : v);

export default async function ReviewPage({ searchParams }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const section = ADMIN_SECTIONS.find((s) => s.segment === first(sp.type)) ?? ADMIN_SECTIONS.find((s) => s.kind === "lessons");
  const queue = QUEUES.find((q) => q.key === first(sp.queue)) ?? QUEUES[0];
  const [overview, list, modules] = await Promise.all([
    getAdminOverview(admin),
    listContentForAdmin(admin, section.kind, { ...queue.filter, page: sp.page }),
    listContentForAdmin(admin, "modules", { pageSize: 100 }),
  ]);
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title="Review & publish"
        description="Content moves draft → reviewed → approved, and only approved content can be published. A lesson can only be published when everything it links to is published; listening exercises need their generated audio."
      />

      <section aria-labelledby="bulk-heading" className="mt-5 rounded-lg border border-line bg-surface px-3 py-2.5 shadow-xs">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h2 id="bulk-heading" className="text-[13px] font-semibold">
            Module review (bulk steps)
          </h2>
          <p className="text-xs text-ink-muted">Review a whole module with its lessons, words, grammar and exercises on one page.</p>
        </div>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {modules.items.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/modules/${m.id}`} className={buttonClass({ variant: "secondary", size: "sm", className: "font-normal" })}>
                <span className="font-semibold">{m.levelCode}</span>
                <span lang="de">{pickText(m.title, "de").text}</span>
              </Link>
            </li>
          ))}
          {modules.items.length === 0 && <li className="text-[13px] text-ink-muted">No modules yet.</li>}
        </ul>
      </section>

      <LinkTabs
        label="Content type"
        className="mt-6"
        items={ADMIN_SECTIONS.map((s) => {
          const open = overview[s.kind].draft + overview[s.kind].reviewed;
          return {
            href: `/admin/review?${new URLSearchParams({ type: s.segment, queue: queue.key })}`,
            label: s.label,
            active: s.segment === section.segment,
            badge: open > 0 ? `${open} open` : null,
          };
        })}
      />
      <LinkSegments
        label="Review state"
        className="mt-3"
        items={QUEUES.map((q) => ({
          href: `/admin/review?${new URLSearchParams({ type: section.segment, queue: q.key })}`,
          label: q.label,
          active: q.key === queue.key,
        }))}
      />

      <BulkActionBar key={section.kind} formId="bulk-review" kind={section.kind} omit={["archive"]} />
      <ContentTable
        items={list.items}
        select={{ formId: "bulk-review", label: (item) => item.slug ?? item.code ?? contentLabel(section.kind, item) }}
        empty={`No ${section.label.toLowerCase()} in “${queue.label}”.`}
        columns={[
          {
            header: "Item",
            cell: (item) => (
              <>
                <Link href={editHref(section.kind, item.id)} className="font-medium text-ink hover:text-brand-700 hover:underline" lang="de">
                  {contentLabel(section.kind, item)}
                </Link>
                <p className="font-mono text-xs text-ink-muted">
                  {item.levelCode ?? ""} {item.slug ?? ""}
                </p>
              </>
            ),
          },
          { header: "Status", cell: (item) => <StatusCell item={item} /> },
          { header: "Version", cell: (item) => <span className="tabular-nums">v{item.version}</span> },
          { header: "Actions", cell: (item) => <LifecycleControls kind={section.kind} item={item} archive={false} /> },
        ]}
      />
      <Pagination
        basePath="/admin/review"
        params={{ type: section.segment, queue: queue.key }}
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
      />
    </>
  );
}
