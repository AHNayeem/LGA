import { requireAdminPage } from "@/lib/auth/dal";
import { listEditorOptions } from "@/lib/services/contentService";
import EditFrame from "@/components/admin/EditFrame";
import { LevelEditor } from "@/components/admin/editor/simpleEditors";

export const metadata = { title: "New level" };

export default async function NewLevelPage() {
  const admin = await requireAdminPage();
  const options = await listEditorOptions(admin);
  return (
    <EditFrame kind="levels">
      <LevelEditor references={options.references} />
    </EditFrame>
  );
}
