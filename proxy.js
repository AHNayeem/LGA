import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

// Optimistic check only: no DB access here. A missing cookie redirects early for a
// better UX; a present cookie is NOT trusted — pages, actions and route handlers
// verify the session and role via lib/auth/dal.js.
//
// Learning is open to guests (/dashboard, /learn, /review, /goethe, /exams/<level>/<exam>,
// /start): those pages work without a session and keep a guest's progress in the browser.
// Only the admin area and stored exam attempts (which belong to an account) need one.
//
// Guest-only pages (/login, /register) are NOT redirected here: a stale or forged cookie
// would bounce between /login and /dashboard. Those pages verify the session themselves.
const PROTECTED_PREFIXES = ["/admin", "/exams/attempts"];

export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/exams/attempts/:path*"],
};
