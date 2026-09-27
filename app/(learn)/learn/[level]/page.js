import Link from "next/link";
import { requireUserPage } from "@/lib/auth/dal";
import { getLearnerLevel } from "@/lib/services/curriculumService";
import { orNotFound } from "@/lib/pages";
import LocalizedText from "@/components/ui/LocalizedText";
import ModuleCard from "@/components/learn/ModuleCard";

export const metadata = { title: "Level" };

export default async function LevelPage({ params }) {
  const { level } = await params;
  const user = await requireUserPage(`/learn/${level}`);
  const locale = user.uiLanguage ?? "en";
  const data = await orNotFound(getLearnerLevel(user, level));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
      </nav>
      <LocalizedText as="h1" text={data.level.title} prefer="de" className="mt-1 text-2xl font-semibold tracking-tight" />
      {data.level.description && <LocalizedText as="p" text={data.level.description} prefer={locale} className="mt-1 max-w-prose text-ink-muted" />}

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {data.modules.map((m) => (
          <li key={m.module.id}>
            <ModuleCard summary={m} href={`/learn/${level}/${m.module.slug}`} locale={locale} />
          </li>
        ))}
      </ul>
      {data.modules.length === 0 && <p className="mt-6 text-ink-muted">No modules have been published for this level yet.</p>}
      <p className="mt-6 text-sm text-ink-muted">More modules are added as they are reviewed.</p>
    </div>
  );
}
