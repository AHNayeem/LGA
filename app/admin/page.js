import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { getAdminOverview, listContentForAdmin } from "@/lib/services/contentService";
import { COLLECTIONS } from "@/lib/db/collections";
import { localize } from "@/lib/i18n/locales";
import { ADMIN_SECTIONS, listHref, newHref } from "@/lib/content/adminSections";
import StatusBadge from "@/components/ui/StatusBadge";
import LifecycleControls from "@/components/admin/LifecycleControls";
import { tableClasses as t } from "@/components/admin/list";
import { Card, EmptyState, Section, StatCard } from "@/components/admin/ui";
import Icon from "@/components/admin/icons";

const fmt = (n) => n.toLocaleString("en");

// Share of each review state in a content type, as a thin stacked bar (numbers sit next to it).
function ReviewMix({ c }) {
  const total = c.draft + c.reviewed + c.approved;
  if (total === 0) return <div className="h-1.5 rounded-full bg-canvas" aria-hidden="true" />;
  const part = (n, cls) => (n > 0 ? <span className={cls} style={{ width: `${(n / total) * 100}%` }} /> : null);
  return (
    <div className="flex h-1.5 gap-px overflow-hidden rounded-full bg-canvas" aria-hidden="true">
      {part(c.draft, "bg-line-strong")}
      {part(c.reviewed, "bg-warning-700/70")}
      {part(c.approved, "bg-success-700/80")}
    </div>
  );
}

export default async function AdminHome() {
  const admin = await requireAdminPage();
  const [overview, { items: levels }, { items: modules }] = await Promise.all([
    getAdminOverview(admin),
    listContentForAdmin(admin, COLLECTIONS.levels, { pageSize: 10 }),
    listContentForAdmin(admin, COLLECTIONS.modules, { pageSize: 100 }),
  ]);

  const sum = (key) => ADMIN_SECTIONS.reduce((n, s) => n + overview[s.kind][key], 0);
  const active = sum("total") - sum("archived");
  const draft = sum("draft");
  const reviewed = sum("reviewed");

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Content administration</h1>
      <p className="mt-1 max-w-3xl text-[13px] text-ink-muted">
        Content moves <strong className="font-medium text-ink">draft → reviewed → approved</strong>. Only approved content can be published to
        learners. Editing approved content returns it to draft.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Content items" value={fmt(active)} detail={`Across ${ADMIN_SECTIONS.length} content types, not archived`} icon="modules" />
        <StatCard
          label="Awaiting review"
          value={fmt(draft + reviewed)}
          detail={`${fmt(draft)} draft · ${fmt(reviewed)} reviewed`}
          href="/admin/review"
          icon="review"
        />
        <StatCard label="Approved" value={fmt(sum("approved"))} detail="Passed review" icon="exercises" />
        <StatCard label="Published" value={fmt(sum("published"))} detail="Available to learners" icon="eye" />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Section id="overview" title="Content library" description="Counts per type; each number opens the filtered list." className="min-w-0 xl:col-start-2 xl:row-start-1">
          <Card>
            <ul className="divide-y divide-line">
              {ADMIN_SECTIONS.map((s) => {
                const c = overview[s.kind];
                const counts = [
                  { n: c.draft, label: "draft", params: { review: "draft" } },
                  { n: c.reviewed, label: "reviewed", params: { review: "reviewed" } },
                  { n: c.approved, label: "approved", params: { review: "approved" } },
                  { n: c.published, label: "published", params: { publish: "published" } },
                  ...(c.archived > 0 ? [{ n: c.archived, label: "archived", params: { publish: "archived" } }] : []),
                ];
                return (
                  <li key={s.kind} className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={listHref(s.kind)} className="text-[13px] font-medium hover:text-brand-700 hover:underline">
                        {s.label}
                      </Link>
                      <span className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold tabular-nums">{fmt(c.total - c.archived)}</span>
                        <Link
                          href={newHref(s.kind)}
                          aria-label={`New ${s.singular}`}
                          title={`New ${s.singular}`}
                          className="grid size-6 place-items-center rounded-md text-ink-muted hover:bg-canvas hover:text-brand-700"
                        >
                          <Icon name="plus" className="size-3.5" />
                        </Link>
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ReviewMix c={c} />
                    </div>
                    <p className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-ink-muted">
                      {counts.map((k) => (
                        <Link key={k.label} href={listHref(s.kind, k.params)} className="tabular-nums hover:text-ink hover:underline">
                          {fmt(k.n)} {k.label}
                        </Link>
                      ))}
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="flex flex-wrap gap-x-3 gap-y-1 border-t border-line px-3 py-2 text-[11px] text-ink-muted" aria-hidden="true">
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-line-strong" />Draft</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-warning-700/70" />Reviewed</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-success-700/80" />Approved</span>
            </p>
          </Card>
        </Section>
        <div className="min-w-0 space-y-8 xl:col-start-1 xl:row-start-1">
          <Section
            id="levels"
            title="Levels"
            className=""
            actions={
              <Link href={listHref(COLLECTIONS.levels)} className="text-xs font-medium text-brand-700 hover:underline">
                All levels
              </Link>
            }
          >
            {levels.length === 0 ? (
              <EmptyState className="">
                No levels yet. Run <code className="font-mono">bun run seed</code> to create the level structure, or{" "}
                <Link href={newHref(COLLECTIONS.levels)} className="text-brand-700 hover:underline">
                  create one
                </Link>
                .
              </EmptyState>
            ) : (
              <div className={t.wrap}>
                <table className={`${t.table} min-w-160`}>
                  <thead className={t.thead}>
                    <tr>
                      <th scope="col" className={t.th}>Level</th>
                      <th scope="col" className={t.th}>Title</th>
                      <th scope="col" className={t.th}>Review</th>
                      <th scope="col" className={t.th}>Visibility</th>
                      <th scope="col" className={t.th}>Version</th>
                      <th scope="col" className={t.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level) => (
                      <tr key={level.id} className={t.tr}>
                        <td className={`${t.td} font-semibold`}>{level.code}</td>
                        <td className={t.td} lang="de">{localize(level.title, "de")}</td>
                        <td className={t.td}><StatusBadge status={level.reviewStatus} /></td>
                        <td className={t.td}><StatusBadge status={level.publishStatus} /></td>
                        <td className={`${t.td} tabular-nums text-ink-muted`}>v{level.version}</td>
                        <td className={t.td}>
                          <LifecycleControls kind={COLLECTIONS.levels} item={level} archive={false} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section
            id="modules"
            title="Modules"
            className=""
            actions={
              <Link href={listHref(COLLECTIONS.modules)} className="text-xs font-medium text-brand-700 hover:underline">
                All modules
              </Link>
            }
          >
            {modules.length === 0 ? (
              <EmptyState className="">
                No modules yet. Run <code className="font-mono">bun run seed</code> to load the curriculum as drafts, or{" "}
                <Link href={newHref(COLLECTIONS.modules)} className="text-brand-700 hover:underline">
                  create one
                </Link>
                .
              </EmptyState>
            ) : (
              <div className={t.wrap}>
                <table className={`${t.table} min-w-160`}>
                  <thead className={t.thead}>
                    <tr>
                      <th scope="col" className={t.th}>Module</th>
                      <th scope="col" className={t.th}>Review</th>
                      <th scope="col" className={t.th}>Visibility</th>
                      <th scope="col" className={t.th}>Version</th>
                      <th scope="col" className={t.th}>Content</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m) => (
                      <tr key={m.id} className={t.tr}>
                        <td className={t.td}>
                          <span className="font-semibold">{m.levelCode}</span> <span className="text-ink-subtle">·</span>{" "}
                          <span lang="de">{localize(m.title, "de")}</span>
                        </td>
                        <td className={t.td}><StatusBadge status={m.reviewStatus} /></td>
                        <td className={t.td}><StatusBadge status={m.publishStatus} /></td>
                        <td className={`${t.td} tabular-nums text-ink-muted`}>v{m.version}</td>
                        <td className={t.td}>
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
          </Section>
        </div>

      </div>
    </>
  );
}
