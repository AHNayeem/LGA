import { requireAdminPage } from "@/lib/auth/dal";
import { listEditorOptions } from "@/lib/services/contentService";
import { adminListQuerySchema } from "@/lib/validation/content";
import EditFrame from "@/components/admin/EditFrame";
import ExerciseEditor from "@/components/admin/editor/ExerciseEditor";

export const metadata = { title: "New exercise" };

export default async function NewExercisePage({ searchParams }) {
  const admin = await requireAdminPage();
  const [options, q] = await Promise.all([listEditorOptions(admin), searchParams.then((sp) => adminListQuerySchema.parse(sp))]);
  return (
    <EditFrame kind="exercises">
      <ExerciseEditor levels={options.levels} references={options.references} defaults={{ levelCode: q.level, skill: q.skill }} />
    </EditFrame>
  );
}
