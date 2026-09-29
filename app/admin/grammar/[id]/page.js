import { requireAdminPage } from "@/lib/auth/dal";
import { getContentForAdmin, listEditorOptions } from "@/lib/services/contentService";
import { orNotFound } from "@/lib/pages";
import { pickText } from "@/lib/i18n/locales";
import EditFrame from "@/components/admin/EditFrame";
import { GrammarEditor } from "@/components/admin/editor/simpleEditors";

export const metadata = { title: "Edit grammar topic" };

export default async function EditGrammarPage({ params, searchParams }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const [{ item, usedBy }, options] = await Promise.all([orNotFound(getContentForAdmin(admin, "grammarTopics", id)), listEditorOptions(admin)]);
  return (
    <EditFrame kind="grammarTopics" item={item} title={pickText(item.title, "de").text} searchParams={await searchParams} usedBy={usedBy}>
      <GrammarEditor key={item.id} item={item} levels={options.levels} references={options.references} />
    </EditFrame>
  );
}
