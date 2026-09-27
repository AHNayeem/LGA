import { requireUserPage } from "@/lib/auth/dal";
import { listPublishedLevels } from "@/lib/services/contentService";
import { localize } from "@/lib/i18n/locales";
import { LEVEL_CODES } from "@/lib/validation/common";
import Alert from "@/components/ui/Alert";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }) {
  const user = await requireUserPage("/dashboard");
  const { error } = await searchParams;
  const levels = await listPublishedLevels();
  const byCode = new Map(levels.map((l) => [l.code, l]));

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
      <p className="mt-1 text-ink-muted">Your learning path starts with A1. Lessons are added in the next phase.</p>

      <section aria-labelledby="levels-heading" className="mt-8">
        <h2 id="levels-heading" className="text-lg font-semibold">
          Levels
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LEVEL_CODES.map((code) => {
            const level = byCode.get(code);
            return (
              <li
                key={code}
                className={`rounded-xl border p-4 ${level ? "border-brand-600/30 bg-surface" : "border-line bg-canvas"}`}
                aria-disabled={!level || undefined}
              >
                <p className="text-xl font-semibold">{code}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {level ? <span lang="de">{localize(level.title, "de")}</span> : "Coming later"}
                </p>
              </li>
            );
          })}
        </ul>
        {levels.length === 0 && (
          <p className="mt-4 text-sm text-ink-muted">No level has been approved and published yet.</p>
        )}
      </section>
    </div>
  );
}
