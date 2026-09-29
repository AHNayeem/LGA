import Link from "next/link";
import LocalizedText from "@/components/ui/LocalizedText";

const pct = (r) => `${Math.round((r ?? 0) * 100)}%`;

// One exam on the level page and the exam list, with the learner's own results. Exam
// results are separate from lesson and module progress.
export default function ExamCard({ exam, href, locale = "en" }) {
  const a = exam.attempts;
  return (
    <Link href={href} className="block rounded-xl border border-line bg-surface p-5 hover:border-brand-600/40" data-exam={exam.slug}>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Practice exam · {exam.levelCode}</p>
      <LocalizedText as="p" text={exam.title} prefer="de" className="mt-1 text-lg font-semibold" />
      {exam.description && <LocalizedText as="p" text={exam.description} prefer={locale} className="mt-1 line-clamp-2 text-sm text-ink-muted" />}
      <p className="mt-3 text-sm text-ink-muted">
        {exam.questionCount} questions{exam.durationMinutes ? ` · ${exam.durationMinutes} min` : " · untimed"} · pass mark {pct(exam.passThreshold)}
      </p>
      <p className="mt-1 text-sm">
        {a.open ? (
          <span className="font-medium text-brand-700">Attempt in progress</span>
        ) : a.count > 0 ? (
          <>
            Best result <strong className="tabular-nums">{pct(a.best)}</strong>
            {a.passed ? <span className="ml-2 text-success-700">passed</span> : <span className="ml-2 text-ink-muted">not passed yet</span>}
          </>
        ) : (
          <span className="text-ink-muted">Not taken yet</span>
        )}
      </p>
    </Link>
  );
}
