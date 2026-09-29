import { requireAdminPage } from "@/lib/auth/dal";
import { listEditorOptions } from "@/lib/services/contentService";
import { adminListQuerySchema } from "@/lib/validation/content";
import EditFrame from "@/components/admin/EditFrame";
import LessonEditor from "@/components/admin/editor/LessonEditor";

export const metadata = { title: "New lesson" };

export default async function NewLessonPage({ searchParams }) {
  const admin = await requireAdminPage();
  const [options, q] = await Promise.all([listEditorOptions(admin), searchParams.then((sp) => adminListQuerySchema.parse(sp))]);
  return (
    <EditFrame kind="lessons">
      <LessonEditor modules={options.modules} references={options.references} related={{}} defaults={{ moduleId: q.moduleId }} />
    </EditFrame>
  );
}
