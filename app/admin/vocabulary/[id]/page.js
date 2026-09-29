import { requireAdminPage } from "@/lib/auth/dal";
import { getContentForAdmin, listEditorOptions } from "@/lib/services/contentService";
import { orNotFound } from "@/lib/pages";
import { wordForm } from "@/lib/content/adminSections";
import EditFrame from "@/components/admin/EditFrame";
import { VocabularyEditor } from "@/components/admin/editor/simpleEditors";

export const metadata = { title: "Edit word" };

export default async function EditWordPage({ params, searchParams }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const [{ item, usedBy, images }, options] = await Promise.all([orNotFound(getContentForAdmin(admin, "vocabulary", id)), listEditorOptions(admin)]);
  return (
    <EditFrame kind="vocabulary" item={item} title={wordForm(item)} searchParams={await searchParams} usedBy={usedBy}>
      <VocabularyEditor key={item.id} item={item} levels={options.levels} references={options.references} images={images} />
    </EditFrame>
  );
}
