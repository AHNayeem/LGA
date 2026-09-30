import { requireAdminPage } from "@/lib/auth/dal";
import { listEditorOptions } from "@/lib/services/contentService";
import { IMPORT_COLUMNS, IMPORT_LIMITS } from "@/lib/content/vocabularyImport";
import { LEVEL_CODES } from "@/lib/content/constants";
import { PageHeader } from "@/components/admin/list";
import BulkImport from "@/components/admin/vocabulary/BulkImport";

export const metadata = { title: "Import words" };

export default async function ImportVocabularyPage() {
  const admin = await requireAdminPage();
  const { levels } = await listEditorOptions(admin);
  const known = new Map(levels.map((l) => [l.code, l.label]));
  const levelOptions = LEVEL_CODES.map((code) => ({ value: code, label: known.get(code) ?? code }));
  return (
    <>
      <PageHeader
        crumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/vocabulary", label: "Vocabulary" },
        ]}
        title="Import words"
        description={`Add up to ${IMPORT_LIMITS.maxRows.toLocaleString("en")} words at once from a CSV file or a spreadsheet. Every row is checked with the same rules as the word editor before anything is saved, and new words are drafts until they are reviewed and published.`}
      />
      <details className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-medium">Columns</summary>
        <p className="mt-2 text-ink-muted">
          Header names are matched ignoring case, spaces and underscores. Required: <code>lemma</code>, <code>pos</code>, <code>meaning_en</code>, and a level and source
          type (from the row or the defaults). Pictures and reference links are added in the word editor afterwards.
        </p>
        <table className="mt-3 w-full text-left text-xs">
          <caption className="sr-only">Supported import columns</caption>
          <thead className="text-ink-muted">
            <tr>
              <th scope="col" className="py-1 pr-3 font-medium">Column</th>
              <th scope="col" className="py-1 pr-3 font-medium">Field</th>
              <th scope="col" className="py-1 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {IMPORT_COLUMNS.map((c) => (
              <tr key={c.key} className="border-t border-line align-top">
                <td className="py-1 pr-3 font-mono">
                  {c.key}
                  {c.required ? " *" : ""}
                  {c.aliases?.length ? <span className="block text-ink-muted">or {c.aliases.join(", ")}</span> : null}
                </td>
                <td className="py-1 pr-3">{c.label}</td>
                <td className="py-1 text-ink-muted">{c.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <BulkImport levels={levelOptions} />
    </>
  );
}
