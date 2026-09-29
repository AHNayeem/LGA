import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { getExamPreview } from "@/lib/services/examService";
import { orNotFound } from "@/lib/pages";
import { editHref } from "@/lib/content/adminSections";
import { EXAM_REVIEW_POLICY_LABELS } from "@/lib/content/constants";
import LocalizedText from "@/components/ui/LocalizedText";
import StatusBadge from "@/components/ui/StatusBadge";
import ExamPlayer from "@/components/exams/ExamPlayer";

export const metadata = { title: "Exam preview" };

// CMS preview: the learner exam UI for an exam in any lifecycle state. getExamPreview
// authorises the viewer (content:read-drafts); answers are graded by previewExamAction,
// which writes nothing. No attempt exists, and the timer runs only in this browser.
export default async function ExamPreviewPage({ params }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const data = await orNotFound(getExamPreview(admin, id));
  const editorHref = editHref("exams", data.id);
  const s = data.preview;

  return (
    <div className="space-y-6">
      <section aria-label="Draft preview" data-testid="preview-banner" className="rounded-xl border-2 border-dashed border-warning-700/50 bg-warning-50 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-warning-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Exam preview</span>
            <StatusBadge status={s.reviewStatus} />
            <StatusBadge status={s.publishStatus} />
            <span className="text-xs tabular-nums text-ink-muted">v{s.version}</span>
          </div>
          <Link href={editorHref} className="font-medium text-brand-700 hover:underline">
            Back to the editor
          </Link>
        </div>
        <p className="mt-2 font-medium text-warning-700">Nothing you do here is saved: no attempt, answers or results.</p>
        <p className="mt-1 text-ink-muted">
          {s.learnerVisible ? "Learners can take this exam." : "Learners can't take this exam yet."}
          {!s.levelVisible && " The level is not published."}
          {s.problems.length > 0 && <span className="text-warning-700"> {s.problems.join(" ")}</span>}
        </p>
        <p className="mt-1 text-ink-muted">
          After submitting, the preview shows the full review. Learners see: {EXAM_REVIEW_POLICY_LABELS[data.exam.reviewPolicy].toLowerCase()}.
        </p>
      </section>

      <LocalizedText as="h1" text={data.exam.title} prefer="de" className="text-2xl font-semibold tracking-tight" />
      {data.questionCount > 0 ? (
        <ExamPlayer examId={data.id} paper={data.paper} locale={admin.uiLanguage ?? "en"} preview learnerPolicy={data.exam.reviewPolicy} />
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-muted">This exam has no questions yet. Add exercises in the editor.</p>
      )}
    </div>
  );
}
