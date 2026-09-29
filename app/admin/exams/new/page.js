import { requireAdminPage } from "@/lib/auth/dal";
import { listEditorOptions } from "@/lib/services/contentService";
import { adminListQuerySchema } from "@/lib/validation/content";
import EditFrame from "@/components/admin/EditFrame";
import ExamEditor from "@/components/admin/editor/ExamEditor";

export const metadata = { title: "New exam" };

export default async function NewExamPage({ searchParams }) {
  const admin = await requireAdminPage();
  const [options, q] = await Promise.all([listEditorOptions(admin), searchParams.then((sp) => adminListQuerySchema.parse(sp))]);
  return (
    <EditFrame kind="exams">
      <ExamEditor references={options.references} related={{}} defaults={{ levelCode: q.level }} />
    </EditFrame>
  );
}
