import { pingDb } from "@/lib/db/client";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Liveness + database reachability. Reveals no configuration details.
export async function GET() {
  try {
    await pingDb();
    return Response.json({ status: "ok", db: "ok" }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logger.error("health_db_failed", { err });
    return Response.json({ status: "degraded", db: "unreachable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
