import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { listContentForAdmin } from "@/lib/services/contentService";
import { editHref, newHref, wordForm } from "@/lib/content/adminSections";
import { PARTS_OF_SPEECH } from "@/lib/content/constants";
import { pickText } from "@/lib/i18n/locales";
import { ButtonLink, ContentTable, FilterBar, LEVEL_FILTER, PageHeader, Pagination, PUBLISH_FILTER, REVIEW_FILTER, StatusCell } from "@/components/admin/list";
import LifecycleControls from "@/components/admin/LifecycleControls";
import BulkActionBar from "@/components/admin/BulkSelection";

export const metadata = { title: "Vocabulary" };

export default async function VocabularyPage({ searchParams }) {
  const admin = await requireAdminPage();
  const list = await listContentForAdmin(admin, "vocabulary", await searchParams);
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/admin", label: "Admin" }]}
        title="Vocabulary"
        description="The word library. Words are reusable: lessons link to them from vocabulary blocks."
        actions={
          <>
            <ButtonLink href="/admin/vocabulary/import" variant="secondary" icon="upload">
              Import words
            </ButtonLink>
            <ButtonLink icon="plus" href={newHref("vocabulary", list.query.level ? { level: list.query.level } : undefined)}>New word</ButtonLink>
          </>
        }
      />
      <FilterBar
        action="/admin/vocabulary"
        values={list.query}
        fields={[
          { name: "q", label: "Search", type: "search", placeholder: "Word, plural, meaning or slug" },
          { name: "level", label: "Level", type: "select", options: LEVEL_FILTER },
          { name: "pos", label: "Part of speech", type: "select", options: [{ value: "", label: "Any" }, ...PARTS_OF_SPEECH.map((p) => ({ value: p, label: p }))] },
          { name: "topic", label: "Topic", type: "search", placeholder: "topic-slug" },
          { name: "review", label: "Review", type: "select", options: REVIEW_FILTER },
          { name: "publish", label: "Visibility", type: "select", options: PUBLISH_FILTER },
        ]}
      />
      <BulkActionBar formId="bulk-vocabulary" kind="vocabulary" />
      <ContentTable
        items={list.items}
        select={{ formId: "bulk-vocabulary", label: (v) => v.slug }}
        empty="No words match these filters."
        columns={[
          {
            header: "Word",
            cell: (v) => (
              <>
                <Link href={editHref("vocabulary", v.id)} className="font-medium text-ink hover:text-brand-700 hover:underline" lang="de">
                  {wordForm(v)}
                </Link>
                {v.plural && (
                  <span className="ml-1 text-xs text-ink-muted" lang="de">
                    · {v.plural}
                  </span>
                )}
                <p className="font-mono text-xs text-ink-muted">{v.slug}</p>
              </>
            ),
          },
          { header: "Meaning", cell: (v) => pickText(v.meanings, "en").text },
          { header: "Type", cell: (v) => <span className="text-xs">{v.pos}</span> },
          {
            header: "Topics",
            cell: (v) => (
              <span className="flex flex-wrap gap-1">
                {v.topics.map((t) => (
                  <Link key={t} href={`/admin/vocabulary?topic=${t}`} className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs hover:underline">
                    {t}
                  </Link>
                ))}
              </span>
            ),
          },
          { header: "Level", cell: (v) => v.levelCode },
          { header: "Status", cell: (v) => <StatusCell item={v} /> },
          { header: "Actions", cell: (v) => <LifecycleControls kind="vocabulary" item={v} /> },
        ]}
      />
      <Pagination basePath="/admin/vocabulary" params={list.query} page={list.page} pageSize={list.pageSize} total={list.total} />
    </>
  );
}
