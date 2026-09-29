import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/dal";
import { getContentForAdmin, listEditorOptions } from "@/lib/services/contentService";
import { orNotFound } from "@/lib/pages";
import { pickText } from "@/lib/i18n/locales";
import { lessonPreviewHref } from "@/lib/content/adminSections";
import EditFrame from "@/components/admin/EditFrame";
import LessonEditor from "@/components/admin/editor/LessonEditor";

export const metadata = { title: "Edit lesson" };

export default async function EditLessonPage({ params, searchParams }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const [{ item, related, images }, options] = await Promise.all([orNotFound(getContentForAdmin(admin, "lessons", id)), listEditorOptions(admin)]);
  const mod = options.modules.find((m) => m.id === item.moduleId);
  const unpublished = Object.values(related).filter((r) => r.publishStatus !== "published").length;
  return (
    <EditFrame
      kind="lessons"
      item={item}
      title={pickText(item.title, "de").text}
      searchParams={await searchParams}
      crumbs={mod ? [{ href: `/admin/modules/${mod.id}`, label: mod.label }] : []}
      extra={
        <span className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          {unpublished > 0 && <span className="text-warning-700">{unpublished} linked item(s) not published yet</span>}
          <Link href={lessonPreviewHref(item.id)} className="font-medium text-brand-700 hover:underline">
            Preview as learner
          </Link>
          {mod && (
            <Link href={`/admin/modules/${mod.id}`} className="text-brand-700 hover:underline">
              Module review
            </Link>
          )}
        </span>
      }
    >
      <LessonEditor key={item.id} item={item} modules={options.modules} references={options.references} related={related} images={images} />
    </EditFrame>
  );
}
