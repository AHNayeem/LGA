import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { listContentForAdmin } from "@/lib/services/contentService";
import { editHref, examPreviewHref, newHref } from "@/lib/content/adminSections";
import { EXAM_REVIEW_POLICY_LABELS } from "@/lib/content/constants";
import { pickText } from "@/lib/i18n/locales";
import { ButtonLink, ContentTable, FilterBar, LEVEL_FILTER, PageHeader, Pagination, PUBLISH_FILTER, REVIEW_FILTER, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";

export const metadata = { title: "Exams" };

export default async function ExamsPage({ searchParams }) {
  const admin = await requireAdminPage();
  const list = await listContentForAdmin(admin, "exams", await searchParams);
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title="Exams"
        description="Exams are ordered sections of exercises from the library, with a time limit, a pass mark and a review policy. Every question must be scored automatically."
        actions={<ButtonLink href={newHref("exams")}>New exam</ButtonLink>}
      />
      <FilterBar
        action="/admin/exams"
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
        empty="No exams match these filters."
        columns={[
          {
            header: "Exam",
            cell: (e) => (
              <>
                <Link href={editHref("exams", e.id)} className="font-medium text-brand-700 hover:underline" lang="de">
                  {pickText(e.title, "de").text}
                </Link>
                <p className="font-mono text-xs text-ink-muted">
                  {e.levelCode} · {e.slug}
                </p>
              </>
            ),
          },
          {
            header: "Sections",
            cell: (e) => (
              <span className="tabular-nums">
                {e.sections.length} · {e.sections.reduce((n, s) => n + s.exerciseIds.length, 0)} exercise(s)
              </span>
            ),
          },
          { header: "Rules", cell: (e) => <span className="text-xs">{e.durationMinutes ? `${e.durationMinutes} min` : "untimed"} · pass {Math.round(e.passThreshold * 100)}% · {EXAM_REVIEW_POLICY_LABELS[e.reviewPolicy]}</span> },
          { header: "Status", cell: (e) => <StatusCell item={e} /> },
          {
            header: "Actions",
            cell: (e) => (
              <div className="flex flex-wrap items-center gap-2">
                <LifecycleControls kind="exams" item={e} />
                <Link href={examPreviewHref(e.id)} className="text-xs font-medium text-brand-700 hover:underline">
                  Preview
                </Link>
              </div>
            ),
          },
        ]}
      />
      <Pagination basePath="/admin/exams" params={list.query} page={list.page} pageSize={list.pageSize} total={list.total} />
    </>
  );
}
