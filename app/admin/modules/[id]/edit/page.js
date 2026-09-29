import { requireAdminPage } from "@/lib/auth/dal";
import { getContentForAdmin, listEditorOptions } from "@/lib/services/contentService";
import { orNotFound } from "@/lib/pages";
import { pickText } from "@/lib/i18n/locales";
import EditFrame from "@/components/admin/EditFrame";
import { ModuleEditor } from "@/components/admin/editor/simpleEditors";

export const metadata = { title: "Edit module" };

export default async function EditModulePage({ params, searchParams }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const [{ item }, options] = await Promise.all([orNotFound(getContentForAdmin(admin, "modules", id)), listEditorOptions(admin)]);
  return (
    <EditFrame
      kind="modules"
      item={item}
      title={`${item.levelCode} · ${pickText(item.title, "de").text}`}
      searchParams={await searchParams}
      crumbs={[{ href: `/admin/modules/${item.id}`, label: "Overview" }]}
    >
      <ModuleEditor key={item.id} item={item} levels={options.levels} references={options.references} />
    </EditFrame>
  );
}
