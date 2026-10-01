import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { listContentForAdmin } from "@/lib/services/contentService";
import { editHref, newHref } from "@/lib/content/adminSections";
import { SKILLS, SKILL_LABELS } from "@/lib/content/skills";
import { pickText } from "@/lib/i18n/locales";
import { ButtonLink, ContentTable, FilterBar, LEVEL_FILTER, PageHeader, Pagination, PUBLISH_FILTER, REVIEW_FILTER, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";
import BulkActionBar from "@/components/admin/BulkSelection";
import { AudioSourceBadge } from "@/components/admin/media/labels";

export const metadata = { title: "Exercises" };

export default async function ExercisesPage({ searchParams }) {
  const admin = await requireAdminPage();
  const list = await listContentForAdmin(admin, "exercises", await searchParams);
  const defaults = Object.fromEntries(Object.entries({ level: list.query.level, skill: list.query.skill }).filter(([, v]) => v));
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title="Exercises"
        description="Question sets with answer keys. Lessons link to them from reading, listening, speaking, writing, practice and test blocks."
        actions={<ButtonLink icon="plus" href={newHref("exercises", Object.keys(defaults).length ? defaults : undefined)}>New exercise</ButtonLink>}
      />
      <FilterBar
        action="/admin/exercises"
        values={list.query}
        fields={[
          { name: "q", label: "Search", type: "search", placeholder: "Title or slug" },
          { name: "level", label: "Level", type: "select", options: LEVEL_FILTER },
          { name: "skill", label: "Skill", type: "select", options: [{ value: "", label: "Any skill" }, ...SKILLS.map((s) => ({ value: s, label: SKILL_LABELS[s].en }))] },
          { name: "review", label: "Review", type: "select", options: REVIEW_FILTER },
          { name: "publish", label: "Visibility", type: "select", options: PUBLISH_FILTER },
        ]}
      />
      <BulkActionBar formId="bulk-exercises" kind="exercises" />
      <ContentTable
        items={list.items}
        select={{ formId: "bulk-exercises", label: (e) => e.slug }}
        empty="No exercises match these filters."
        columns={[
          {
            header: "Exercise",
            cell: (e) => (
              <>
                <Link href={editHref("exercises", e.id)} className="font-medium text-ink hover:text-brand-700 hover:underline" lang="de">
                  {pickText(e.title, "de").text}
                </Link>
                <p className="font-mono text-xs text-ink-muted">{e.slug}</p>
              </>
            ),
          },
          { header: "Skill", cell: (e) => SKILL_LABELS[e.skill]?.en ?? e.skill },
          {
            header: "Questions",
            cell: (e) => (
              <span className="text-xs">
                {e.items.length} · {[...new Set(e.items.map((i) => i.type))].join(", ")}
              </span>
            ),
          },
          { header: "Audio", cell: (e) => <AudioSourceBadge source={e.audioStatus?.source} missing={e.audioStatus?.missing} /> },
          { header: "Level", cell: (e) => e.levelCode },
          { header: "Status", cell: (e) => <StatusCell item={e} /> },
          { header: "Actions", cell: (e) => <LifecycleControls kind="exercises" item={e} /> },
        ]}
      />
      <Pagination basePath="/admin/exercises" params={list.query} page={list.page} pageSize={list.pageSize} total={list.total} />
    </>
  );
}
