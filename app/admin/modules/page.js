import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { listContentForAdmin } from "@/lib/services/contentService";
import { editHref, listHref, newHref } from "@/lib/content/adminSections";
import { pickText } from "@/lib/i18n/locales";
import { ButtonLink, ContentTable, FilterBar, LEVEL_FILTER, PageHeader, Pagination, PUBLISH_FILTER, REVIEW_FILTER, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";

export const metadata = { title: "Modules" };

export default async function ModulesPage({ searchParams }) {
  const admin = await requireAdminPage();
  const list = await listContentForAdmin(admin, "modules", await searchParams);
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title="Modules"
        description="Each module belongs to a level and contains ordered lessons."
        actions={<ButtonLink href={newHref("modules", list.query.level ? { level: list.query.level } : undefined)}>New module</ButtonLink>}
      />
      <FilterBar
        action="/admin/modules"
        values={list.query}
        fields={[
          { name: "q", label: "Search", type: "search", placeholder: "Title or slug" },
          { name: "level", label: "Level", type: "select", options: LEVEL_FILTER },
          { name: "review", label: "Review", type: "select", options: REVIEW_FILTER },
          { name: "publish", label: "Visibility", type: "select", options: PUBLISH_FILTER },
        ]}
      />
      <ContentTable
        items={list.items}
        empty="No modules match these filters."
        columns={[
          {
            header: "Module",
            cell: (m) => (
              <>
                <Link href={`/admin/modules/${m.id}`} className="font-medium text-brand-700 hover:underline">
                  <span className="font-semibold">{m.levelCode}</span> · <span lang="de">{pickText(m.title, "de").text}</span>
                </Link>
                <p className="font-mono text-xs text-ink-muted">{m.slug}</p>
              </>
            ),
          },
          { header: "Order", cell: (m) => <span className="tabular-nums">{m.order}</span> },
          { header: "Status", cell: (m) => <StatusCell item={m} /> },
          { header: "Version", cell: (m) => <span className="tabular-nums">v{m.version}</span> },
          {
            header: "Actions",
            cell: (m) => (
              <div className="flex flex-col gap-2">
                <span className="flex flex-wrap gap-3 text-xs">
                  <Link href={editHref("modules", m.id)} className="text-brand-700 hover:underline">
                    Edit
                  </Link>
                  <Link href={listHref("lessons", { moduleId: m.id })} className="text-brand-700 hover:underline">
                    Lessons
                  </Link>
                  <Link href={newHref("lessons", { moduleId: m.id })} className="text-brand-700 hover:underline">
                    + Lesson
                  </Link>
                </span>
                <LifecycleControls kind="modules" item={m} />
              </div>
            ),
          },
        ]}
      />
      <Pagination basePath="/admin/modules" params={list.query} page={list.page} pageSize={list.pageSize} total={list.total} />
    </>
  );
}
