import "server-only";
import { headers } from "next/headers";

// Request metadata for rate limiting and audit logs. On Vercel, x-forwarded-for is set
// by the platform edge; the first entry is the client.
export async function getRequestContext() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return { ip, userAgent: h.get("user-agent") ?? "" };
}
