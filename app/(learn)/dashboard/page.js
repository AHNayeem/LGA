import Link from "next/link";
import { requireUserPage } from "@/lib/auth/dal";
import { getLearnerDashboard } from "@/lib/services/learningService";
import { localize } from "@/lib/i18n/locales";
import { LEVEL_CODES } from "@/lib/validation/common";
import Alert from "@/components/ui/Alert";
import LocalizedText from "@/components/ui/LocalizedText";
import ModuleCard from "@/components/learn/ModuleCard";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }) {
  const user = await requireUserPage("/dashboard");
  const { error } = await searchParams;
  const locale = user.uiLanguage ?? "en";
  const dash = await getLearnerDashboard(user);
  const byCode = new Map(dash.levels.map((l) => [l.code, l]));
  const current = dash.current;
  const levelSlug = current?.level.code.toLowerCase();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      {error === "forbidden" && (
        <div className="mb-6">
          <Alert tone="error">You don&apos;t have access to that page.</Alert>
        </div>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">
        <span lang="de">Hallo</span>, {user.name}!
      </h1>
      <p className="mt-1 text-ink-muted">Your learning path starts with A1.</p>

      {(dash.continueAt || dash.reviewDue > 0) && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {dash.continueAt && (
            <Link
              href={`/learn/${dash.continueAt.levelCode.toLowerCase()}/${dash.continueAt.module.slug}/${dash.continueAt.lesson.slug}`}
              className="rounded-xl border border-brand-600/30 bg-brand-50 p-5 hover:border-brand-600"
            >
              <p className="text-sm font-medium text-brand-700">Continue learning</p>
              <LocalizedText as="p" text={dash.continueAt.lesson.title} prefer="de" className="mt-1 text-lg font-semibold" />
              <p className="text-sm text-ink-muted">
                {dash.continueAt.levelCode} · <LocalizedText text={dash.continueAt.module.title} prefer="de" />
              </p>
            </Link>
          )}
          {dash.reviewDue > 0 && (
            <Link href="/review" className="rounded-xl border border-line bg-surface p-5 hover:border-brand-600/40">
              <p className="text-sm font-medium text-ink-muted">Vocabulary review</p>
              <p className="mt-1 text-lg font-semibold" data-testid="review-due">
                {dash.reviewDue} {dash.reviewDue === 1 ? "word" : "words"} to review
              </p>
            </Link>
          )}
        </div>
      )}

      {current && (
        <section aria-labelledby="modules-heading" className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="modules-heading" className="text-lg font-semibold">
              <span lang="de">{localize(current.level.title, "de")}</span>
            </h2>
            <Link href={`/learn/${levelSlug}`} className="text-sm font-medium text-brand-700 hover:underline">
              All modules
            </Link>
          </div>
          {current.modules.length > 0 ? (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {current.modules.map((m) => (
                <li key={m.module.id}>
                  <ModuleCard summary={m} href={`/learn/${levelSlug}/${m.module.slug}`} locale={locale} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">No modules have been published yet.</p>
          )}
        </section>
      )}

      <section aria-labelledby="levels-heading" className="mt-8">
        <h2 id="levels-heading" className="text-lg font-semibold">
          Levels
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LEVEL_CODES.map((code) => {
            const level = byCode.get(code);
            const inner = (
              <>
                <p className="text-xl font-semibold">{code}</p>
                <p className="mt-1 text-sm text-ink-muted">{level ? <span lang="de">{localize(level.title, "de")}</span> : "Coming later"}</p>
              </>
            );
            return (
              <li key={code} aria-disabled={!level || undefined}>
                {level ? (
                  <Link href={`/learn/${code.toLowerCase()}`} className="block rounded-xl border border-brand-600/30 bg-surface p-4 hover:border-brand-600">
                    {inner}
                  </Link>
                ) : (
                  <div className="rounded-xl border border-line bg-canvas p-4">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
        {dash.levels.length === 0 && <p className="mt-4 text-sm text-ink-muted">No level has been approved and published yet.</p>}
      </section>
    </div>
  );
}
