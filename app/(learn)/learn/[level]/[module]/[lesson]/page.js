import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { getLearnerLesson } from "@/lib/services/curriculumService";
import { orNotFound } from "@/lib/pages";
import LessonView from "@/components/learn/LessonView";
import GuestLesson from "@/components/learn/GuestLesson";
import { returnLinkFor } from "@/lib/learning/returnLink";

export const metadata = { title: "Lesson" };

const UNAVAILABLE = "This lesson is being updated and is not available right now. Please try again later.";

// ?from=…: opened from Goethe Prep or Practice, so the lesson offers the way back
// (lib/learning/returnLink.js). Unknown values are ignored.

// Signed-in learners and guests use the same lesson view. A signed-in learner's progress
// comes from the server; a guest's from their browser (GuestLesson).
export default async function LessonPage({ params, searchParams }) {
  const { level, module: moduleSlug, lesson: lessonSlug } = await params;
  const { block: blockParam, view: viewParam, from } = await searchParams;
  const returnLink = returnLinkFor(from, level);
  const base = `/learn/${level}/${moduleSlug}/${lessonSlug}`;
  const moduleHref = `/learn/${level}/${moduleSlug}`;
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const data = await orNotFound(getLearnerLesson(user, { level, module: moduleSlug, lesson: lessonSlug }));
  const showResult = viewParam === "result";

  if (!user) {
    return (
      <GuestLesson
        data={data}
        locale={locale}
        base={base}
        levelHref={`/learn/${level}`}
        moduleHref={moduleHref}
        blockParam={typeof blockParam === "string" ? blockParam : null}
        showResult={showResult}
        unavailableMessage={UNAVAILABLE}
        returnLink={returnLink}
      />
    );
  }

  if (data.available && !showResult) {
    const { blocks } = data;
    const current = blocks.find((b) => b.key === blockParam) ?? blocks.find((b) => !b.done) ?? blocks[0];
    // Always address the step explicitly, so refreshing after a submission keeps the learner
    // (and their feedback) on the same step instead of jumping to the next unfinished one.
    if (current.key !== blockParam) redirect(`${base}?block=${current.key}${returnLink ? `&from=${from}` : ""}`);
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
      unavailableMessage={UNAVAILABLE}
      resultHref={`${base}?view=result`}
      showResult={showResult}
      returnLink={returnLink}
    />
  );
}
