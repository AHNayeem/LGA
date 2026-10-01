import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { getGuestExamPaper, getLearnerExam } from "@/lib/services/examService";
import { goethePracticeLinks as practiceLinks } from "@/lib/services/journeyService";
import { orNotFound } from "@/lib/pages";
import LocalizedText from "@/components/ui/LocalizedText";
import AiContentNotice from "@/components/learn/AiContentNotice";
import StartExamButton from "@/components/exams/StartExamButton";
import { GuestExamPlayer, GuestExamStart } from "@/components/exams/GuestExam";

export const metadata = { title: "Exam" };

const pct = (r) => (r == null ? "–" : `${Math.round(r * 100)}%`);
const STATUS = { in_progress: "In progress", submitted: "Submitted", expired: "Time ran out" };
const POLICY = {
  summary: "After submitting you see your total and section scores.",
  marks: "After submitting you see your scores and which questions were right or wrong.",
  full: "After submitting you see your scores, the correct answers and explanations.",
};

// Exam overview for signed-in learners (attempts stored, history) and guests (practice in
// the browser: ?take=1 opens the paper, results stay on the device).
export default async function ExamPage({ params, searchParams }) {
  const { level, exam: examSlug } = await params;
  const { take } = await searchParams;
  const overviewHref = `/exams/${level}/${examSlug}`;
  const user = await getCurrentUser();
  const locale = user?.uiLanguage ?? "en";
  const { exam, openAttemptId, history } = await orNotFound(getLearnerExam(user, { level, exam: examSlug }));
  const levelHref = `/learn/${exam.levelCode.toLowerCase()}`;

  if (!user && take === "1") {
    const [{ examId, version, paper }, practice] = await Promise.all([orNotFound(getGuestExamPaper({ level, exam: examSlug })), practiceLinks(exam.levelCode)]);
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
          <Link href={overviewHref} className="hover:underline">
            Back to the exam overview
          </Link>
        </nav>
        <LocalizedText as="h1" text={exam.title} prefer="de" className="mt-1 text-2xl font-semibold tracking-tight" />
        {exam.aiGenerated && <AiContentNotice className="mt-3" />}
        <div className="mt-6">
          <GuestExamPlayer guest={{ examId, version }} paper={paper} locale={locale} overviewHref={overviewHref} practice={practice} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
        <Link href={`/goethe/${exam.levelCode.toLowerCase()}`} className="hover:underline">
          Goethe Prep
        </Link>{" "}
        /{" "}
        <Link href={levelHref} className="hover:underline">
          {exam.levelCode}
        </Link>
      </nav>
      <LocalizedText as="h1" text={exam.title} prefer="de" className="mt-1 text-2xl font-semibold tracking-tight" />
      {exam.description && <LocalizedText as="p" text={exam.description} prefer={locale} className="mt-1 text-ink-muted" />}
      {exam.aiGenerated && <AiContentNotice className="mt-4" />}

      <section aria-labelledby="rules-heading" className="mt-6 rounded-xl border border-line bg-surface p-5">
        <h2 id="rules-heading" className="font-semibold">
          How it works
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            {exam.questionCount} questions in {exam.sections.length} parts:{" "}
            {exam.sections.map((s, i) => (
              <span key={s.key}>
                {i > 0 && ", "}
                <LocalizedText text={s.title} prefer="de" />
              </span>
            ))}
            .
          </li>
          <li>
            {exam.durationMinutes
              ? `Time limit: ${exam.durationMinutes} minutes. When the time is up, your answers are submitted automatically.`
              : "There is no time limit."}
          </li>
          <li>You can move between the tasks and change your answers until you submit. Unanswered questions score 0 points.</li>
          <li>LGA practice target: {pct(exam.passThreshold)} of all points. This is the app&apos;s own target, not an official Goethe pass mark, and no prediction of an official result.</li>
          <li>{POLICY[exam.reviewPolicy]}</li>
          <li>Exam results are kept separately: they don&apos;t change your lesson progress or skill scores.</li>
        </ul>
        {exam.instructions && <LocalizedText as="p" text={exam.instructions} prefer={locale} className="mt-3 whitespace-pre-line text-sm" />}
        <div className="mt-5">
          {user ? (
            <StartExamButton examId={exam.id} resume={Boolean(openAttemptId)} durationMinutes={exam.durationMinutes} />
          ) : (
            <GuestExamStart examId={exam.id} version={exam.version} takeHref={`${overviewHref}?take=1`} durationMinutes={exam.durationMinutes} />
          )}
        </div>
      </section>

      {user && (
      <section aria-labelledby="history-heading" className="mt-8">
        <h2 id="history-heading" className="text-lg font-semibold">
          Your attempts
        </h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">You haven&apos;t taken this exam yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm" data-attempt-status={h.status}>
                <span>
                  {new Date(h.startedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · {STATUS[h.status]}
                </span>
                {h.status === "submitted" && (
                  <span className="tabular-nums">
                    {h.score} / {h.maxScore} ({pct(h.ratio)}) ·{" "}
                    <span className={h.passed ? "text-success-700" : "text-danger-700"}>{h.passed ? "passed" : "not passed"}</span>
                  </span>
                )}
                {h.status !== "expired" && (
                  <Link href={`/exams/attempts/${h.id}`} className="font-medium text-brand-700 hover:underline">
                    {h.status === "in_progress" ? "Continue" : "View result"}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      )}
    </div>
  );
}
