import { getCurrentUser } from "@/lib/auth/dal";
import { handleRecordingUpload } from "@/lib/http/recordingUpload";

export const dynamic = "force-dynamic";

// Speaking-practice recording upload. All checks live in lib/http/recordingUpload.js.
export async function POST(request) {
  return handleRecordingUpload(request, { getUser: getCurrentUser });
}
