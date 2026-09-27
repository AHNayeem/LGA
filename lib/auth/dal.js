import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionToken } from "@/lib/auth/session";
import { resolveSession } from "@/lib/services/authService";
import { hasPermission, isAdmin } from "@/lib/auth/roles";
import { AuthenticationError, ForbiddenError } from "@/lib/errors";

// Data Access Layer: the single place where requests are authenticated and authorised.
// proxy.js only does an optimistic cookie check; every page, action and route handler
// that touches protected data must go through these helpers.

export const getCurrentUser = cache(async () => {
  const token = await readSessionToken();
  if (!token) return null;
  const resolved = await resolveSession(token);
  return resolved?.user ?? null;
});

// --- For Server Actions / route handlers: throw, caller converts to a result. ---

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  return user;
}

export async function requirePermission(permission) {
  const user = await requireUser();
  if (!hasPermission(user, permission)) throw new ForbiddenError();
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user)) throw new ForbiddenError();
  return user;
}

// --- For pages / layouts: redirect instead of throwing. ---

export async function requireUserPage(next = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdminPage() {
  const user = await requireUserPage("/admin");
  if (!isAdmin(user)) redirect("/dashboard?error=forbidden");
  return user;
}
