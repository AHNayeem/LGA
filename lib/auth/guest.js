import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";

// For /login and /register: signed-in users (verified session, not just a cookie) go
// straight to their destination.
export async function redirectIfSignedIn(to = "/dashboard") {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect(to);
}
