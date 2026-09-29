import { requireAdminPage } from "@/lib/auth/dal";
import { listEditorOptions } from "@/lib/services/contentService";
import { adminListQuerySchema } from "@/lib/validation/content";
import EditFrame from "@/components/admin/EditFrame";
import { ModuleEditor } from "@/components/admin/editor/simpleEditors";

export const metadata = { title: "New module" };

export default async function NewModulePage({ searchParams }) {
  const admin = await requireAdminPage();
  const [options, q] = await Promise.all([listEditorOptions(admin), searchParams.then((sp) => adminListQuerySchema.parse(sp))]);
  return (
    <EditFrame kind="modules">
      <ModuleEditor levels={options.levels} references={options.references} defaults={{ levelCode: q.level }} />
    </EditFrame>
  );
}
