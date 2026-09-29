import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { listContentForAdmin, listEditorOptions } from "@/lib/services/contentService";
import { editHref, newHref } from "@/lib/content/adminSections";
import { pickText } from "@/lib/i18n/locales";
import { ButtonLink, ContentTable, FilterBar, LEVEL_FILTER, PageHeader, Pagination, PUBLISH_FILTER, REVIEW_FILTER, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";

export const metadata = { title: "Lessons" };

export default async function LessonsPage({ searchParams }) {
  const admin = await requireAdminPage();
  const [list, options] = await Promise.all([listContentForAdmin(admin, "lessons", await searchParams), listEditorOptions(admin)]);
  const moduleById = new Map(options.modules.map((m) => [m.id, m]));
  const current = list.query.moduleId ? moduleById.get(list.query.moduleId) : null;
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title={current ? `Lessons · ${current.label}` : "Lessons"}
        description="Lessons are an ordered list of blocks that link to words, grammar topics and exercises from the libraries."
        actions={<ButtonLink href={newHref("lessons", current ? { moduleId: current.id } : undefined)}>New lesson</ButtonLink>}
      />
      <FilterBar
        action="/admin/lessons"
        values={list.query}
        fields={[
          { name: "q", label: "Search", type: "search", placeholder: "Title or slug" },
          { name: "level", label: "Level", type: "select", options: LEVEL_FILTER },
          {
            name: "moduleId",
            label: "Module",
            type: "select",
            options: [{ value: "", label: "All modules" }, ...options.modules.map((m) => ({ value: m.id, label: m.label }))],
          },
          { name: "review", label: "Review", type: "select", options: REVIEW_FILTER },
          { name: "publish", label: "Visibility", type: "select", options: PUBLISH_FILTER },
        ]}
      />
      <ContentTable
        items={list.items}
        empty="No lessons match these filters."
        columns={[
          {
            header: "Lesson",
            cell: (l) => (
              <>
                <Link href={editHref("lessons", l.id)} className="font-medium text-brand-700 hover:underline" lang="de">
                  {pickText(l.title, "de").text}
                </Link>
                <p className="font-mono text-xs text-ink-muted">{l.slug}</p>
              </>
            ),
          },
          {
            header: "Module",
            cell: (l) => {
              const m = moduleById.get(l.moduleId);
              return m ? (
                <Link href={`/admin/modules/${m.id}`} className="hover:underline">
                  {m.label}
                </Link>
              ) : (
                <span className="text-danger-700">missing module</span>
              );
            },
          },
          { header: "Order", cell: (l) => <span className="tabular-nums">{l.order}</span> },
          { header: "Blocks", cell: (l) => <span className="tabular-nums">{l.blocks.length}</span> },
          { header: "Status", cell: (l) => <StatusCell item={l} /> },
          { header: "Actions", cell: (l) => <LifecycleControls kind="lessons" item={l} /> },
        ]}
      />
      <Pagination basePath="/admin/lessons" params={list.query} page={list.page} pageSize={list.pageSize} total={list.total} />
    </>
  );
}
