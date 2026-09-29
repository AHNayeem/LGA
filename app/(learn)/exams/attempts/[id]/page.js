import Link from "next/link";
import { requireUserPage } from "@/lib/auth/dal";
import { getExamAttempt } from "@/lib/services/examService";
import { orNotFound } from "@/lib/pages";
import LocalizedText from "@/components/ui/LocalizedText";
import AiContentNotice from "@/components/learn/AiContentNotice";
import ExamPlayer from "@/components/exams/ExamPlayer";
import ExamResult from "@/components/exams/ExamResult";

export const metadata = { title: "Exam" };

// The learner's own attempt: the running exam, or its result once submitted or expired.
// An attempt of another learner is a 404.
export default async function ExamAttemptPage({ params }) {
  const { id } = await params;
  const user = await requireUserPage(`/exams/attempts/${id}`);
  const locale = user.uiLanguage ?? "en";
  const data = await orNotFound(getExamAttempt(user, id));
  const examHref = `/exams/${data.exam.levelCode.toLowerCase()}/${data.exam.slug}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href={examHref} className="hover:underline">
          Back to the exam overview
        </Link>
      </nav>
      <LocalizedText as="h1" text={data.exam.title} prefer="de" className="mt-1 text-2xl font-semibold tracking-tight" />
      {data.exam.aiGenerated && <AiContentNotice className="mt-3" />}
      <div className="mt-6">
        {data.status === "in_progress" ? (
          <ExamPlayer key={data.id} attemptId={data.id} paper={data.paper} deadlineAt={data.deadlineAt} serverNow={data.serverNow} locale={locale} />
        ) : (
          <div className="max-w-3xl space-y-6">
            <ExamResult view={data.view} locale={locale} />
            <Link href={examHref} className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 font-medium hover:bg-canvas">
              Back to the exam overview
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
