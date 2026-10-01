import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/dal";
import { getLessonPreview } from "@/lib/services/curriculumService";
import { orNotFound } from "@/lib/pages";
import { editHref, lessonPreviewHref } from "@/lib/content/adminSections";
import LessonView from "@/components/learn/LessonView";
import PreviewBanner from "@/components/admin/PreviewBanner";

export const metadata = { title: "Lesson preview" };

// CMS draft preview: the learner lesson UI for a lesson in any lifecycle state, read-only.
// getLessonPreview authorises the viewer (content:read-drafts) and reads no learner state;
// LessonView's preview mode routes every write to a non-persisting path.
export default async function LessonPreviewPage({ params, searchParams }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const { block: blockParam } = await searchParams;
  const data = await orNotFound(getLessonPreview(admin, id));
  const base = lessonPreviewHref(data.lesson.id);
  const editorHref = editHref("lessons", data.lesson.id);

  if (data.available) {
    const current = data.blocks.find((b) => b.key === blockParam) ?? data.blocks[0];
    if (current.key !== blockParam) redirect(`${base}?block=${current.key}`);
  }

  return (
    // The admin layout already pads the page; LessonView brings its own learner spacing.
    <div className="-mx-4 -mb-10 -mt-6 sm:-mx-6 lg:-mx-8">
      <LessonView
        data={data}
        locale={admin.uiLanguage ?? "en"}
        currentKey={blockParam}
        hrefFor={(key) => `${base}?block=${key}`}
        levelHref={null}
        moduleHref={`/admin/modules/${data.module.id}`}
        exitHref={editorHref}
        exitLabel="Back to the editor"
        unavailableMessage="Learners would see this lesson as unavailable: it has no blocks yet, or a linked item no longer exists."
        banner={<PreviewBanner status={data.preview} editorHref={editorHref} />}
        mode="preview"
      />
    </div>
  );
}
