import { getEnv } from "@/lib/config/env";
import { isAppError, RateLimitError, toErrorResult, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { readBodyWithLimit } from "@/lib/http/readBody";
import { checkSameOrigin } from "@/lib/security/origin";
import { IMPORT_LIMITS } from "@/lib/content/vocabularyImport";
import { assertCanImportVocabulary, importVocabulary, previewVocabularyImport } from "@/lib/services/vocabularyImportService";

// Bulk vocabulary import (admin CMS).
//   POST /api/admin/vocabulary/import?mode=preview   dry run: every check, nothing written
//   POST /api/admin/vocabulary/import?mode=commit    the same checks, then the import
// Body: JSON { defaults, columns, rows } (see vocabularyImportService), at most
// IMPORT_LIMITS.maxBytes. A route handler rather than a Server Action, so this one request
// gets a larger body limit without raising the limit of every action.
//
// Order: origin (CSRF) and session first, then permission and rate limit, and only then is
// the body read, with a byte limit.

const NO_STORE = { "Cache-Control": "no-store" };
const MODES = { preview: previewVocabularyImport, commit: importVocabulary };

function json(body, status, extra = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...extra } });
}

export async function handleVocabularyImport(request, { getUser }) {
  const origin = checkSameOrigin(request.headers, { appUrl: getEnv().APP_URL });
  if (!origin.ok) {
    logger.warn("vocabulary_import_rejected_origin", { reason: origin.reason });
    return json({ ok: false, code: "FORBIDDEN", message: "Request not allowed." }, 403);
  }
  try {
    const user = await getUser();
    if (!user) return json({ ok: false, code: "UNAUTHENTICATED", message: "Please sign in." }, 401);
    const run = MODES[new URL(request.url).searchParams.get("mode")];
    if (!run) throw new ValidationError('Unknown mode: use "preview" or "commit".');
    await assertCanImportVocabulary(user);
    if (!/^application\/json\b/i.test(request.headers.get("content-type") ?? "")) throw new ValidationError("Send the import as JSON.");

    const bytes = await readBodyWithLimit(request, IMPORT_LIMITS.maxBytes, {
      tooLargeMessage: `The import is larger than ${Math.round(IMPORT_LIMITS.maxBytes / 1048576)} MB. Split it into several imports.`,
    });
    let input;
    try {
      input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    } catch {
      throw new ValidationError("The import data could not be read.");
    }
    const data = await run(user, input, { rateLimited: true });
    return json({ ok: true, data }, 200);
  } catch (err) {
    const result = toErrorResult(err);
    if (result.code === "INTERNAL") logger.error("vocabulary_import_failed", { err });
    const status = isAppError(err) && err.expose ? err.status : 500;
    const extra = err instanceof RateLimitError ? { "Retry-After": String(err.retryAfterSec) } : {};
    return json({ ok: false, code: result.code, message: result.message, fieldErrors: result.fieldErrors }, status, extra);
  }
}
