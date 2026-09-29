import { requireAdminPage } from "@/lib/auth/dal";
import { getContentForAdmin, listEditorOptions } from "@/lib/services/contentService";
import { orNotFound } from "@/lib/pages";
import { contentLabel } from "@/lib/content/adminSections";
import EditFrame from "@/components/admin/EditFrame";
import { LevelEditor } from "@/components/admin/editor/simpleEditors";

export const metadata = { title: "Edit level" };

export default async function EditLevelPage({ params, searchParams }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const [{ item }, options] = await Promise.all([orNotFound(getContentForAdmin(admin, "levels", id)), listEditorOptions(admin)]);
  return (
    <EditFrame kind="levels" item={item} title={contentLabel("levels", item)} searchParams={await searchParams}>
      <LevelEditor key={item.id} item={item} references={options.references} />
    </EditFrame>
  );
}
