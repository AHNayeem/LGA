import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { listContentForAdmin } from "@/lib/services/contentService";
import { editHref, newHref } from "@/lib/content/adminSections";
import { pickText } from "@/lib/i18n/locales";
import { ButtonLink, ContentTable, FilterBar, LEVEL_FILTER, PageHeader, Pagination, PUBLISH_FILTER, REVIEW_FILTER, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";

export const metadata = { title: "Grammar" };

export default async function GrammarPage({ searchParams }) {
  const admin = await requireAdminPage();
  const list = await listContentForAdmin(admin, "grammarTopics", await searchParams);
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title="Grammar topics"
        description="Explanations with sections, tables and examples. Lessons link to them from grammar blocks."
        actions={<ButtonLink href={newHref("grammarTopics", list.query.level ? { level: list.query.level } : undefined)}>New grammar topic</ButtonLink>}
      />
      <FilterBar
        action="/admin/grammar"
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
        empty="No grammar topics match these filters."
        columns={[
          {
            header: "Topic",
            cell: (g) => (
              <>
                <Link href={editHref("grammarTopics", g.id)} className="font-medium text-brand-700 hover:underline" lang="de">
                  {pickText(g.title, "de").text}
                </Link>
                <p className="font-mono text-xs text-ink-muted">{g.slug}</p>
              </>
            ),
          },
          { header: "Sections", cell: (g) => <span className="tabular-nums">{g.sections.length}</span> },
          { header: "Level", cell: (g) => g.levelCode },
          { header: "Status", cell: (g) => <StatusCell item={g} /> },
          { header: "Actions", cell: (g) => <LifecycleControls kind="grammarTopics" item={g} /> },
        ]}
      />
      <Pagination basePath="/admin/grammar" params={list.query} page={list.page} pageSize={list.pageSize} total={list.total} />
    </>
  );
}
