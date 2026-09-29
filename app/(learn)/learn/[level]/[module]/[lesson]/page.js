import { redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth/dal";
import { getLearnerLesson } from "@/lib/services/curriculumService";
import { orNotFound } from "@/lib/pages";
import LessonView from "@/components/learn/LessonView";

export const metadata = { title: "Lesson" };

export default async function LessonPage({ params, searchParams }) {
  const { level, module: moduleSlug, lesson: lessonSlug } = await params;
  const { block: blockParam } = await searchParams;
  const base = `/learn/${level}/${moduleSlug}/${lessonSlug}`;
  const moduleHref = `/learn/${level}/${moduleSlug}`;
  const user = await requireUserPage(base);
  const locale = user.uiLanguage ?? "en";
  const data = await orNotFound(getLearnerLesson(user, { level, module: moduleSlug, lesson: lessonSlug }));

  if (data.available) {
    const { blocks } = data;
    const current = blocks.find((b) => b.key === blockParam) ?? blocks.find((b) => !b.done) ?? blocks[0];
    // Always address the step explicitly, so refreshing after a submission keeps the learner
    // (and their feedback) on the same step instead of jumping to the next unfinished one.
    if (current.key !== blockParam) redirect(`${base}?block=${current.key}`);
  }

  return (
    <LessonView
      data={data}
      locale={locale}
      currentKey={blockParam}
      hrefFor={(key) => `${base}?block=${key}`}
      levelHref={`/learn/${level}`}
      moduleHref={moduleHref}
      exitHref={moduleHref}
      exitLabel="Back to module"
      unavailableMessage="This lesson is being updated and is not available right now. Please try again later."
    />
  );
}
