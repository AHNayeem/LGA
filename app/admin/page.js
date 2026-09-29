import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { getAdminOverview, listContentForAdmin } from "@/lib/services/contentService";
import { COLLECTIONS } from "@/lib/db/collections";
import { localize } from "@/lib/i18n/locales";
import { ADMIN_SECTIONS, listHref, newHref } from "@/lib/content/adminSections";
import StatusBadge from "@/components/ui/StatusBadge";
import LifecycleControls from "@/components/admin/LifecycleControls";

export default async function AdminHome() {
  const admin = await requireAdminPage();
  const [overview, { items: levels }, { items: modules }] = await Promise.all([
    getAdminOverview(admin),
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

      <section aria-labelledby="overview-heading" className="mt-8">
        <h2 id="overview-heading" className="text-lg font-semibold">
          Content library
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_SECTIONS.map((s) => {
            const c = overview[s.kind];
            return (
              <li key={s.kind} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <Link href={listHref(s.kind)} className="font-semibold hover:underline">
                    {s.label}
                  </Link>
                  <span className="text-2xl font-semibold tabular-nums">{c.total - c.archived}</span>
                </div>
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
                  <Link href={listHref(s.kind, { review: "draft" })} className="hover:underline">
                    {c.draft} draft
                  </Link>
                  <Link href={listHref(s.kind, { review: "reviewed" })} className="hover:underline">
                    {c.reviewed} reviewed
                  </Link>
                  <Link href={listHref(s.kind, { review: "approved" })} className="hover:underline">
                    {c.approved} approved
                  </Link>
                  <Link href={listHref(s.kind, { publish: "published" })} className="hover:underline">
                    {c.published} published
                  </Link>
                  {c.archived > 0 && (
                    <Link href={listHref(s.kind, { publish: "archived" })} className="hover:underline">
                      {c.archived} archived
                    </Link>
                  )}
                </p>
                <Link href={newHref(s.kind)} className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline">
                  + New {s.singular}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="levels-heading" className="mt-10">
        <h2 id="levels-heading" className="text-lg font-semibold">
          Levels
        </h2>
        {levels.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-ink-muted">
            No levels yet. Run <code className="font-mono">bun run seed</code> to create the level structure, or{" "}
            <Link href={newHref(COLLECTIONS.levels)} className="text-brand-700 hover:underline">
              create one
            </Link>
            .
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
                      <LifecycleControls kind={COLLECTIONS.levels} item={level} archive={false} />
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
            No modules yet. Run <code className="font-mono">bun run seed</code> to load the curriculum as drafts, or{" "}
            <Link href={newHref(COLLECTIONS.modules)} className="text-brand-700 hover:underline">
              create one
            </Link>
            .
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
