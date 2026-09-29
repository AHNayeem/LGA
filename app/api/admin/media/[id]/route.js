import { getCurrentUser } from "@/lib/auth/dal";
import { handleCurriculumUpload } from "@/lib/http/curriculumUpload";

export const dynamic = "force-dynamic";

// Replaces the file of a curriculum upload (same id). Checks: lib/http/curriculumUpload.js.
export async function PUT(request, { params }) {
  const { id } = await params;
  return handleCurriculumUpload(request, { getUser: getCurrentUser, replaceId: id });
}
