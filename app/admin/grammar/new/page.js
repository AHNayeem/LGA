import { requireAdminPage } from "@/lib/auth/dal";
import { listEditorOptions } from "@/lib/services/contentService";
import { adminListQuerySchema } from "@/lib/validation/content";
import EditFrame from "@/components/admin/EditFrame";
import { GrammarEditor } from "@/components/admin/editor/simpleEditors";

export const metadata = { title: "New grammar topic" };

export default async function NewGrammarPage({ searchParams }) {
  const admin = await requireAdminPage();
  const [options, q] = await Promise.all([listEditorOptions(admin), searchParams.then((sp) => adminListQuerySchema.parse(sp))]);
  return (
    <EditFrame kind="grammarTopics">
      <GrammarEditor levels={options.levels} references={options.references} defaults={{ levelCode: q.level }} />
    </EditFrame>
  );
}
