import { requireAdminPage } from "@/lib/auth/dal";
import { getEnv } from "@/lib/config/env";
import { getCurriculumMediaForAdmin } from "@/lib/services/mediaService";
import { orNotFound } from "@/lib/pages";
import { PageHeader } from "@/components/admin/list";
import { Panel } from "@/components/admin/editor/fields";
import { AudioPreview, ImagePreview, MediaStatusBadge, mediaMeta, sourceLabel } from "@/components/admin/media/labels";
import MediaUploadForm from "@/components/admin/media/MediaUploadForm";
import { AttachToExercise, MediaMetadataForm, MediaStatusControls, MediaUsageList } from "@/components/admin/media/MediaManage";
import Alert from "@/components/ui/Alert";

export const metadata = { title: "Media" };

export default async function MediaDetailPage({ params, searchParams }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const sp = await searchParams;
  const { media, usedBy } = await orNotFound(getCurriculumMediaForAdmin(admin, id));
  const isImage = media.kind === "image";
  const title = media.title ?? media.transcript?.slice(0, 80) ?? (isImage ? "Image" : "Audio");
  const reviewed = usedBy.filter((e) => e.reviewStatus !== "draft").length;
  const env = getEnv();
  const limits = { audio: env.CURRICULUM_MEDIA_MAX_BYTES, image: env.CURRICULUM_IMAGE_MAX_BYTES };

  return (
    <>
      <PageHeader
        crumbs={[
          { href: "/admin", label: "Admin" },
          { href: "/admin/media", label: "Media" },
        ]}
        title={title}
      />
      {sp?.uploaded === "1" && (
        <div className="mt-4">
          <Alert tone="success">
            {isImage
              ? "Uploaded. Attach it in the editor of an intro block, a word or an exercise stimulus; learners see it once that content is approved and published."
              : "Uploaded. Attach it to a listening exercise below; learners hear it once that exercise is approved and published."}
          </Alert>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-line bg-surface p-4 text-sm">
        {isImage ? (
          <ImagePreview id={media.id} alt={media.alt ?? ""} className="max-h-64 w-full max-w-md" />
        ) : (
          <AudioPreview id={media.id} label={`Preview ${title}`} />
        )}
        <span>{sourceLabel(media)}</span>
        <span className="text-xs text-ink-muted">{mediaMeta(media)}</span>
        {media.originalName && <span className="text-xs text-ink-muted">File: {media.originalName}</span>}
        <MediaStatusBadge status={media.status} />
      </div>

      {!media.editable ? (
        <div className="mt-6">
          <Panel
            title="Generated TTS clip"
            description="Created by the offline generation script (audio:generate) and registered by the seed. It plays wherever content has the same cue text, voice and speed, unless a recording is attached there. It is managed by the TTS pipeline, not here."
          >
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[8rem_1fr]">
              <dt className="text-ink-muted">Text</dt>
              <dd lang="de">{media.transcript}</dd>
              <dt className="text-ink-muted">Voice</dt>
              <dd>
                {media.tts?.voiceRole ?? "—"} · {media.tts?.rate ?? "—"} ({media.voice ?? "—"})
              </dd>
              <dt className="text-ink-muted">Provider</dt>
              <dd>{media.tts?.provider ?? "—"}</dd>
            </dl>
          </Panel>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Panel title="Details">
              <MediaMetadataForm media={media} />
            </Panel>
            <Panel title="Archive / delete">
              <MediaStatusControls media={media} usedBy={usedBy.length} />
            </Panel>
          </div>
          <div className="space-y-4">
            <Panel
              title={`Used by (${usedBy.length})`}
              description={
                isImage
                  ? "Change or remove the image in each item's editor. The image stays here, shown as unused."
                  : "Removing it from an exercise keeps the recording here, shown as unused."
              }
            >
              <MediaUsageList usedBy={usedBy} />
            </Panel>
            {isImage ? (
              <Panel title="Attach" description="Open the editor of a lesson (intro block), a word or an exercise (stimulus) and choose this image there, with alt text for that place.">
                <p className="text-sm text-ink-muted">Saving the item creates a new version; reviewed, approved or published content returns to draft for review.</p>
              </Panel>
            ) : (
              <Panel
                title="Attach to a listening exercise"
                description="The recording replaces the TTS of a passage or question. The exercise is saved as a new version and returns to draft for review."
              >
                <AttachToExercise media={media} />
              </Panel>
            )}
            <Panel title="Replace file" description={`Keeps the id, so everything using it ${isImage ? "shows" : "plays"} the new file.`}>
              {media.status === "archived" ? (
                <p className="text-sm text-ink-muted">Restore this {isImage ? "image" : "audio"} to replace its file.</p>
              ) : reviewed > 0 ? (
                <p className="text-sm text-ink-muted">
                  {reviewed} reviewed or approved item(s) use this {isImage ? "image" : "recording"}, so its file can&apos;t be swapped under them. Upload the new file
                  separately and attach it there instead, so the change is reviewed.
                </p>
              ) : (
                <MediaUploadForm replaceId={media.id} replaceKind={media.kind} limits={limits} />
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
