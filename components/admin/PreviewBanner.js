import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";

// Shown on every step of the CMS draft preview, so it is never mistaken for the live
// lesson. `status` is getLessonPreview().preview.
export default function PreviewBanner({ status, editorHref }) {
  const notes = [];
  if (status.linkedNotPublished > 0) {
    notes.push(
      `${status.linkedNotPublished} linked item(s) not published yet${status.linkedArchived > 0 ? ` (${status.linkedArchived} archived)` : ""}`,
    );
  }
  if (!status.moduleVisible) notes.push("module not published");
  if (!status.levelVisible) notes.push("level not published");

  return (
    <section
      aria-label="Draft preview"
      data-testid="preview-banner"
      className="mb-6 rounded-lg border border-dashed border-warning-700/50 bg-warning-50 px-4 py-3 text-[13px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-warning-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Draft preview</span>
          <StatusBadge status={status.reviewStatus} />
          <StatusBadge status={status.publishStatus} />
          <span className="text-xs tabular-nums text-ink-muted">v{status.version}</span>
        </div>
        <Link href={editorHref} className="font-medium text-brand-700 hover:underline">
          Back to the editor
        </Link>
      </div>
      <p className="mt-2 font-medium text-warning-700">
        Nothing you do here is saved: no progress, answers, word reviews or recordings.
      </p>
      <p className="mt-1 text-ink-muted">
        {status.learnerVisible
          ? "Learners can see this lesson. The preview shows the saved version as learners get it."
          : "Learners can't see this lesson until it, its module and level, and everything it uses are approved and published."}
        {notes.length > 0 && <span className="text-warning-700"> {notes.join(" · ")}.</span>}
      </p>
    </section>
  );
}
