import { getCurrentUser } from "@/lib/auth/dal";
import { openMedia } from "@/lib/services/mediaService";
import { isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

// Private recordings are never cached. Curriculum uploads ("linked") are revalidated on
// every play: learner access ends when the exercise is unpublished, and a replaced file
// keeps its id.
const CACHE = { private: "private, no-store", linked: "private, no-cache", curriculum: "private, max-age=3600" };

// Serves media by stable id. Authorisation is decided by mediaService.canReadMedia.
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    // Guests (null) may read published curriculum media; canReadMedia keeps private
    // recordings to their owner. Missing and forbidden are both 404.
    const user = await getCurrentUser();
    const result = await openMedia(user, id);
    if (result.redirect) {
      return Response.redirect(new URL(result.redirect, request.url), 302);
    }
    const { file, asset } = result;
    return new Response(file.body, {
      headers: {
        "Content-Type": file.contentType,
        ...(file.size ? { "Content-Length": String(file.size) } : {}),
        "Cache-Control": CACHE[asset.visibility] ?? "private, no-store",
        "X-Content-Type-Options": "nosniff",
        // Uploads (learner recordings, admin curriculum audio): even a crafted file can
        // never run as a document on our origin.
        ...(asset.source !== "tts" ? { "Content-Security-Policy": "default-src 'none'; sandbox", "Content-Disposition": "inline" } : {}),
      },
    });
  } catch (err) {
    if (isAppError(err) && err.status === 404) return new Response("Not found", { status: 404 });
    logger.error("media_serve_failed", { id, err });
    return new Response("Error", { status: 500 });
  }
}
