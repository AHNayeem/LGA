import { getCurrentUser } from "@/lib/auth/dal";
import { handleVocabularyImport } from "@/lib/http/vocabularyImport";

export const dynamic = "force-dynamic";

// Bulk vocabulary import (preview and commit). All checks live in lib/http/vocabularyImport.js.
export async function POST(request) {
  return handleVocabularyImport(request, { getUser: getCurrentUser });
}
