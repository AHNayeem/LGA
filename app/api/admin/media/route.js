import { getCurrentUser } from "@/lib/auth/dal";
import { handleCurriculumUpload } from "@/lib/http/curriculumUpload";

export const dynamic = "force-dynamic";

// Admin upload of curriculum audio. All checks live in lib/http/curriculumUpload.js.
export async function POST(request) {
  return handleCurriculumUpload(request, { getUser: getCurrentUser });
}
