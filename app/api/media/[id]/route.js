import { getCurrentUser } from "@/lib/auth/dal";
import { openMedia } from "@/lib/services/mediaService";
import { isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

// Serves media by stable id. Authorisation is decided by mediaService.canReadMedia.
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return new Response("Unauthorized", { status: 401 });
    const result = await openMedia(user, id);
    if (result.redirect) {
      return Response.redirect(new URL(result.redirect, request.url), 302);
    }
    const { file, asset } = result;
    return new Response(file.body, {
      headers: {
        "Content-Type": file.contentType,
        ...(file.size ? { "Content-Length": String(file.size) } : {}),
        "Cache-Control": asset.visibility === "private" ? "private, no-store" : "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        // Learner uploads: even a crafted file can never run as a document on our origin.
        ...(asset.source === "learner" ? { "Content-Security-Policy": "default-src 'none'; sandbox", "Content-Disposition": "inline" } : {}),
      },
    });
  } catch (err) {
    if (isAppError(err) && err.status === 404) return new Response("Not found", { status: 404 });
    logger.error("media_serve_failed", { id, err });
    return new Response("Error", { status: 500 });
  }
}
