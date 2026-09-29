import { requireAdminPage } from "@/lib/auth/dal";
import { getContentForAdmin, listEditorOptions } from "@/lib/services/contentService";
import { orNotFound } from "@/lib/pages";
import { pickText } from "@/lib/i18n/locales";
import EditFrame from "@/components/admin/EditFrame";
import ExerciseEditor from "@/components/admin/editor/ExerciseEditor";
import { AudioSourceBadge } from "@/components/admin/media/labels";

export const metadata = { title: "Edit exercise" };

export default async function EditExercisePage({ params, searchParams }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const [{ item, usedBy, checks, images }, options] = await Promise.all([orNotFound(getContentForAdmin(admin, "exercises", id)), listEditorOptions(admin)]);
  return (
    <EditFrame
      kind="exercises"
      item={item}
      title={pickText(item.title, "de").text}
      searchParams={await searchParams}
      usedBy={usedBy}
      extra={
        <span className="text-xs text-ink-muted">
          {checks.maxScore} point(s) · pass at {Math.round(item.passThreshold * 100)}%
          {checks.audio.source !== "none" && (
            <span className="ml-2 inline-flex items-center gap-1">
              · Audio: <AudioSourceBadge source={checks.audio.source} />
            </span>
          )}
          {checks.missingAudio > 0 && (
            <strong className="ml-1 text-danger-700">
              · {checks.missingAudio} audio clip(s) have no playable audio – publishing is blocked until a recording is attached or `bun run audio:generate` has run
            </strong>
          )}
        </span>
      }
    >
      <ExerciseEditor key={item.id} item={item} levels={options.levels} references={options.references} audioStatus={checks.audio} images={images} />
    </EditFrame>
  );
}
