import { requireAdminPage } from "@/lib/auth/dal";
import { listContentForAdmin } from "@/lib/services/contentService";
import { COLLECTIONS } from "@/lib/db/collections";
import { localize } from "@/lib/i18n/locales";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import LifecycleControls from "@/components/admin/LifecycleControls";

export default async function AdminHome() {
  const admin = await requireAdminPage();
  const [{ items: levels }, { items: modules }] = await Promise.all([
    listContentForAdmin(admin, COLLECTIONS.levels, { pageSize: 10 }),
    listContentForAdmin(admin, COLLECTIONS.modules, { pageSize: 100 }),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Content administration</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Content moves <strong>draft → reviewed → approved</strong>. Only approved content can be published to learners.
        Editing approved content returns it to draft.
      </p>

      <section aria-labelledby="levels-heading" className="mt-8">
        <h2 id="levels-heading" className="text-lg font-semibold">
          Levels
        </h2>
        {levels.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-ink-muted">
            No levels yet. Run <code className="font-mono">bun run seed</code> to create the level structure.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Level</th>
                  <th scope="col" className="px-4 py-3">Title</th>
                  <th scope="col" className="px-4 py-3">Review</th>
                  <th scope="col" className="px-4 py-3">Visibility</th>
                  <th scope="col" className="px-4 py-3">Version</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level) => (
                  <tr key={level.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold">{level.code}</td>
                    <td className="px-4 py-3" lang="de">{localize(level.title, "de")}</td>
                    <td className="px-4 py-3"><StatusBadge status={level.reviewStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={level.publishStatus} /></td>
                    <td className="px-4 py-3 tabular-nums">v{level.version}</td>
                    <td className="px-4 py-3">
                      <LifecycleControls kind={COLLECTIONS.levels} item={level} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="modules-heading" className="mt-10">
        <h2 id="modules-heading" className="text-lg font-semibold">
          Modules
        </h2>
        {modules.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-ink-muted">
            No modules yet. Run <code className="font-mono">bun run seed</code> to load the curriculum as drafts.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Module</th>
                  <th scope="col" className="px-4 py-3">Review</th>
                  <th scope="col" className="px-4 py-3">Visibility</th>
                  <th scope="col" className="px-4 py-3">Version</th>
                  <th scope="col" className="px-4 py-3">Content</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-semibold">{m.levelCode}</span> · <span lang="de">{localize(m.title, "de")}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={m.reviewStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge status={m.publishStatus} /></td>
                    <td className="px-4 py-3 tabular-nums">v{m.version}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/modules/${m.id}`} className="font-medium text-brand-700 hover:underline">
                        Review content
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
