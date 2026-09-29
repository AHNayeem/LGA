import { requireAdminPage } from "@/lib/auth/dal";
import { listEditorOptions } from "@/lib/services/contentService";
import { adminListQuerySchema } from "@/lib/validation/content";
import EditFrame from "@/components/admin/EditFrame";
import { VocabularyEditor } from "@/components/admin/editor/simpleEditors";

export const metadata = { title: "New word" };

export default async function NewWordPage({ searchParams }) {
  const admin = await requireAdminPage();
  const [options, q] = await Promise.all([listEditorOptions(admin), searchParams.then((sp) => adminListQuerySchema.parse(sp))]);
  return (
    <EditFrame kind="vocabulary">
      <VocabularyEditor levels={options.levels} references={options.references} defaults={{ levelCode: q.level }} />
    </EditFrame>
  );
}
