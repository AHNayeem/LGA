import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { getContentForAdmin, listEditorOptions } from "@/lib/services/contentService";
import { orNotFound } from "@/lib/pages";
import { pickText } from "@/lib/i18n/locales";
import { examPreviewHref } from "@/lib/content/adminSections";
import EditFrame from "@/components/admin/EditFrame";
import ExamEditor from "@/components/admin/editor/ExamEditor";
import BulkReviewControls from "@/components/admin/BulkReviewControls";

export const metadata = { title: "Edit exam" };

export default async function EditExamPage({ params, searchParams }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const [{ item, related, checks }, options] = await Promise.all([orNotFound(getContentForAdmin(admin, "exams", id)), listEditorOptions(admin)]);
  return (
    <EditFrame
      kind="exams"
      item={item}
      title={pickText(item.title, "de").text}
      searchParams={await searchParams}
      extra={
        <span className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          <span className="tabular-nums">
            {checks.questionCount} question(s) · {checks.maxScore} point(s)
          </span>
          <Link href={examPreviewHref(item.id)} className="font-medium text-brand-700 hover:underline">
            Preview as learner
          </Link>
        </span>
      }
    >
      <section aria-label="Publish readiness" className="mb-6 rounded-lg border border-line bg-surface px-4 py-3 text-[13px] shadow-xs" data-testid="exam-readiness">
        {checks.ready ? (
          <p className="text-success-700">Ready to publish: every exercise is published and scored automatically.</p>
        ) : (
          <>
            <p className="font-medium text-warning-700">Learners can&apos;t take this exam yet:</p>
            <ul className="mt-1 list-disc pl-5 text-warning-700">
              {checks.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-3">
          <p className="mb-2 text-xs text-ink-muted">Review and publish the exam together with its exercises, one step at a time:</p>
          <BulkReviewControls examId={item.id} />
        </div>
      </section>
      <ExamEditor key={item.id} item={item} references={options.references} related={related} />
    </EditFrame>
  );
}
