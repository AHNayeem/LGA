import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { listContentForAdmin } from "@/lib/services/contentService";
import { editHref, listHref, newHref } from "@/lib/content/adminSections";
import { pickText } from "@/lib/i18n/locales";
import { ButtonLink, ContentTable, FilterBar, PageHeader, Pagination, PUBLISH_FILTER, REVIEW_FILTER, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";
import BulkActionBar from "@/components/admin/BulkSelection";

export const metadata = { title: "Levels" };

export default async function LevelsPage({ searchParams }) {
  const admin = await requireAdminPage();
  const list = await listContentForAdmin(admin, "levels", await searchParams);
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title="Levels"
        description="CEFR levels and their mastery thresholds. Modules refer to a level by its code."
        actions={<ButtonLink icon="plus" href={newHref("levels")}>New level</ButtonLink>}
      />
      <FilterBar
        action="/admin/levels"
        values={list.query}
        fields={[
          { name: "q", label: "Search", type: "search", placeholder: "Code or title" },
          { name: "review", label: "Review", type: "select", options: REVIEW_FILTER },
          { name: "publish", label: "Visibility", type: "select", options: PUBLISH_FILTER },
        ]}
      />
      <BulkActionBar formId="bulk-levels" kind="levels" />
      <ContentTable
        items={list.items}
        select={{ formId: "bulk-levels", label: (l) => l.code }}
        empty="No levels match. Run bun run seed to create the level structure."
        columns={[
          { header: "Code", cell: (l) => <span className="font-semibold">{l.code}</span> },
          {
            header: "Title",
            cell: (l) => (
              <Link href={editHref("levels", l.id)} className="font-medium text-ink hover:text-brand-700 hover:underline" lang="de">
                {pickText(l.title, "de").text}
              </Link>
            ),
          },
          { header: "Order", cell: (l) => <span className="tabular-nums">{l.order}</span> },
          { header: "Status", cell: (l) => <StatusCell item={l} /> },
          { header: "Version", cell: (l) => <span className="tabular-nums">v{l.version}</span> },
          {
            header: "Actions",
            cell: (l) => (
              <div className="flex flex-col gap-2">
                <Link href={listHref("modules", { level: l.code })} className="text-xs text-brand-700 hover:underline">
                  Modules in {l.code}
                </Link>
                <LifecycleControls kind="levels" item={l} />
              </div>
            ),
          },
        ]}
      />
      <Pagination basePath="/admin/levels" params={list.query} page={list.page} pageSize={list.pageSize} total={list.total} />
    </>
  );
}
