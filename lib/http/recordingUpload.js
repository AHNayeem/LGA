import { getEnv } from "@/lib/config/env";
import { isAppError, RateLimitError, toErrorResult } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { readBodyWithLimit } from "@/lib/http/readBody";
import { checkSameOrigin } from "@/lib/security/origin";
import { uploadSpeakingRecording } from "@/lib/services/recordingService";

// POST /api/recordings?lessonId=…&exerciseId=…&itemId=…&duration=<seconds>
// Body: the raw recording bytes; Content-Type: the MediaRecorder type.
//
// Framework-free so it can be tested with a plain Request; the route file only supplies
// the session lookup. Order matters: origin (CSRF) and session first, then target and
// rate-limit checks in the service, and only then is the body read, with a byte limit.

const NO_STORE = { "Cache-Control": "no-store" };

function json(body, status, extra = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...extra } });
}

export async function handleRecordingUpload(request, { getUser }) {
  const env = getEnv();
  const origin = checkSameOrigin(request.headers, { appUrl: env.APP_URL });
  if (!origin.ok) {
    logger.warn("recording_upload_rejected_origin", { reason: origin.reason });
    return json({ ok: false, code: "FORBIDDEN", message: "Request not allowed." }, 403);
  }

  try {
    const user = await getUser();
    if (!user) return json({ ok: false, code: "UNAUTHENTICATED", message: "Please sign in." }, 401);

    const params = new URL(request.url).searchParams;
    const duration = params.get("duration");
    const maxMb = Math.round((env.MEDIA_MAX_UPLOAD_BYTES / 1048576) * 10) / 10;
    const recording = await uploadSpeakingRecording(user, {
      lessonId: params.get("lessonId") ?? "",
      exerciseId: params.get("exerciseId") ?? "",
      itemId: params.get("itemId") ?? "",
      ...(duration != null && duration !== "" ? { durationSec: duration } : {}),
      declaredType: request.headers.get("content-type") ?? "",
      readBytes: () =>
        readBodyWithLimit(request, env.MEDIA_MAX_UPLOAD_BYTES, { tooLargeMessage: `The recording is too large (max ${maxMb} MB).` }),
    });
    return json({ ok: true, recording }, 201);
  } catch (err) {
    const result = toErrorResult(err);
    if (result.code === "INTERNAL") logger.error("recording_upload_failed", { err });
    const status = isAppError(err) && err.expose ? err.status : 500;
    const extra = err instanceof RateLimitError ? { "Retry-After": String(err.retryAfterSec) } : {};
    return json({ ok: false, code: result.code, message: result.message }, status, extra);
  }
}
