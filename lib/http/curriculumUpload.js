import { getEnv } from "@/lib/config/env";
import { isAppError, RateLimitError, toErrorResult } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { readBodyWithLimit } from "@/lib/http/readBody";
import { checkSameOrigin } from "@/lib/security/origin";
import { replaceCurriculumMediaFile, uploadCurriculumMedia } from "@/lib/services/mediaService";

// Admin upload of curriculum audio and images (media library).
//   POST /api/admin/media?filename=…&title=…&source=native|licensed&license=…&voice=…&language=…&duration=…&alt=…
//   PUT  /api/admin/media/:id?filename=…&duration=…          (replace the file, same id)
// Body: the raw file bytes; Content-Type: the browser's type for the file.
//
// Same order as the learner recording upload (lib/http/recordingUpload.js): origin (CSRF)
// and session first, then permission, metadata and rate limit in the service, and only
// then is the body read, with a byte limit. Validation of the bytes (signature, declared
// type, extension, MP3 structure, image header and dimensions) is in
// mediaService.validateCurriculumUpload. The body limit here is the larger of the audio
// and image limits; the per-kind limit is enforced once the bytes say what they are.

const NO_STORE = { "Cache-Control": "no-store" };

function json(body, status, extra = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...extra } });
}

export async function handleCurriculumUpload(request, { getUser, replaceId = null }) {
  const env = getEnv();
  const origin = checkSameOrigin(request.headers, { appUrl: env.APP_URL });
  if (!origin.ok) {
    logger.warn("curriculum_upload_rejected_origin", { reason: origin.reason });
    return json({ ok: false, code: "FORBIDDEN", message: "Request not allowed." }, 403);
  }

  try {
    const user = await getUser();
    if (!user) return json({ ok: false, code: "UNAUTHENTICATED", message: "Please sign in." }, 401);

    const params = new URL(request.url).searchParams;
    const max = Math.max(env.CURRICULUM_MEDIA_MAX_BYTES, env.CURRICULUM_IMAGE_MAX_BYTES);
    const common = {
      filename: params.get("filename") ?? "",
      declaredType: request.headers.get("content-type") ?? "",
      durationSec: params.get("duration") ?? undefined,
      readBytes: () => readBodyWithLimit(request, max, { tooLargeMessage: `The file is too large (max ${Math.round((max / 1048576) * 10) / 10} MB).` }),
    };
    if (replaceId) {
      const media = await replaceCurriculumMediaFile(user, replaceId, common);
      return json({ ok: true, media }, 200);
    }
    const meta = Object.fromEntries(["title", "source", "license", "voice", "language", "transcript", "alt"].map((k) => [k, params.get(k) ?? undefined]));
    const media = await uploadCurriculumMedia(user, { ...common, meta });
    return json({ ok: true, media }, 201);
  } catch (err) {
    const result = toErrorResult(err);
    if (result.code === "INTERNAL") logger.error("curriculum_upload_failed", { err });
    const status = isAppError(err) && err.expose ? err.status : 500;
    const extra = err instanceof RateLimitError ? { "Retry-After": String(err.retryAfterSec) } : {};
    return json({ ok: false, code: result.code, message: result.message, fieldErrors: result.fieldErrors }, status, extra);
  }
}
