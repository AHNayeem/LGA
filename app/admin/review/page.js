import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { getAdminOverview, listContentForAdmin } from "@/lib/services/contentService";
import { ADMIN_SECTIONS, contentLabel, editHref } from "@/lib/content/adminSections";
import { pickText } from "@/lib/i18n/locales";
import { ContentTable, PageHeader, Pagination, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";

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
  const tab = (active) =>
    `inline-flex h-8 items-center rounded-full px-3 text-sm ${active ? "bg-brand-600 text-white" : "border border-line bg-surface hover:bg-canvas"}`;

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title="Review & publish"
        description="Content moves draft → reviewed → approved, and only approved content can be published. A lesson can only be published when everything it links to is published; listening exercises need their generated audio."
      />

      <section aria-labelledby="bulk-heading" className="mt-6 rounded-xl border border-line bg-surface p-4">
        <h2 id="bulk-heading" className="text-sm font-semibold">
          Module review (bulk steps)
        </h2>
        <p className="mt-0.5 text-xs text-ink-muted">Review a whole module with its lessons, words, grammar and exercises on one page.</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {modules.items.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/modules/${m.id}`} className="inline-flex h-8 items-center rounded-md border border-line px-3 text-sm hover:bg-canvas">
                {m.levelCode} · <span lang="de" className="ml-1">{pickText(m.title, "de").text}</span>
              </Link>
            </li>
          ))}
          {modules.items.length === 0 && <li className="text-sm text-ink-muted">No modules yet.</li>}
        </ul>
      </section>

      <nav aria-label="Content type" className="mt-6 flex flex-wrap gap-2">
        {ADMIN_SECTIONS.map((s) => (
          <Link
            key={s.segment}
            href={`/admin/review?${new URLSearchParams({ type: s.segment, queue: queue.key })}`}
            className={tab(s.segment === section.segment)}
            aria-current={s.segment === section.segment ? "page" : undefined}
          >
            {s.label}
            <span className="ml-1.5 text-xs opacity-80">
              {overview[s.kind].draft + overview[s.kind].reviewed > 0 ? `${overview[s.kind].draft + overview[s.kind].reviewed} open` : ""}
            </span>
          </Link>
        ))}
      </nav>
      <nav aria-label="Review state" className="mt-3 flex flex-wrap gap-2">
        {QUEUES.map((q) => (
          <Link
            key={q.key}
            href={`/admin/review?${new URLSearchParams({ type: section.segment, queue: q.key })}`}
            className={tab(q.key === queue.key)}
            aria-current={q.key === queue.key ? "page" : undefined}
          >
            {q.label}
          </Link>
        ))}
      </nav>

      <ContentTable
        items={list.items}
        empty={`No ${section.label.toLowerCase()} in “${queue.label}”.`}
        columns={[
          {
            header: "Item",
            cell: (item) => (
              <>
                <Link href={editHref(section.kind, item.id)} className="font-medium text-brand-700 hover:underline" lang="de">
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
