import Link from "next/link";
import { requireUserPage } from "@/lib/auth/dal";
import { getLearnerModule } from "@/lib/services/curriculumService";
import { orNotFound } from "@/lib/pages";
import LocalizedText from "@/components/ui/LocalizedText";
import ProgressBar from "@/components/learn/ProgressBar";
import SkillMastery from "@/components/learn/SkillMastery";
import AiContentNotice from "@/components/learn/AiContentNotice";

export const metadata = { title: "Module" };

function LessonStatus({ completion }) {
  if (completion.complete) return <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">Completed</span>;
  if (completion.done > 0)
    return (
      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
        {completion.done}/{completion.total} steps
      </span>
    );
  return <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-ink-muted">Not started</span>;
}

export default async function ModulePage({ params }) {
  const { level, module: moduleSlug } = await params;
  const href = `/learn/${level}/${moduleSlug}`;
  const user = await requireUserPage(href);
  const locale = user.uiLanguage ?? "en";
  const data = await orNotFound(getLearnerModule(user, level, moduleSlug));
  const { module: mod, lessons, completion, mastery, nextLesson } = data;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href={`/learn/${level}`} className="hover:underline">
          <LocalizedText text={data.level.title} prefer="de" />
        </Link>
      </nav>
      <p className="mt-2 text-sm font-medium text-ink-muted">Module {mod.order}</p>
      <LocalizedText as="h1" text={mod.title} prefer="de" className="text-2xl font-semibold tracking-tight" />
      {mod.description && <LocalizedText as="p" text={mod.description} prefer={locale} className="mt-1 text-ink-muted" />}
      {mod.aiGenerated && <AiContentNotice className="mt-3 max-w-2xl" />}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                {completion.lessonsCompleted} of {completion.lessonsTotal} lessons completed
              </span>
              <span className="tabular-nums text-ink-muted">{completion.percent}%</span>
            </div>
            <ProgressBar value={completion.percent} label="Module progress" className="mt-2" />
            {nextLesson && (
              <Link
                href={`${href}/${nextLesson.slug}`}
                className="mt-4 inline-flex h-11 items-center rounded-lg bg-brand-600 px-5 font-medium text-white hover:bg-brand-700"
              >
                {completion.blocksDone > 0 ? "Continue" : "Start"}: <LocalizedText text={nextLesson.title} prefer="de" className="ml-1" />
              </Link>
            )}
          </div>

          <section aria-labelledby="lessons-heading">
            <h2 id="lessons-heading" className="text-lg font-semibold">
              Lessons
            </h2>
            <ol className="mt-3 space-y-2">
              {lessons.map((l, i) => (
                <li key={l.id}>
                  <Link
                    href={`${href}/${l.slug}`}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4 hover:border-brand-600/40"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas text-sm font-semibold">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <LocalizedText as="span" text={l.title} prefer="de" className="block font-medium" />
                      {l.description && <LocalizedText as="span" text={l.description} prefer={locale} className="block text-sm text-ink-muted" />}
                    </span>
                    <LessonStatus completion={l.completion} />
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {mod.goals?.length > 0 && (
            <section aria-labelledby="goals-heading" className="rounded-xl border border-line bg-surface p-5">
              <h2 id="goals-heading" className="text-lg font-semibold">
                After this module you can …
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {mod.goals.map((g, i) => (
                  <LocalizedText key={i} as="li" text={g} prefer={locale} />
                ))}
              </ul>
            </section>
          )}
        </div>

        <SkillMastery mastery={mastery} locale={locale} />
      </div>
    </div>
  );
}
