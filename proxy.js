import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

// Optimistic check only: no DB access here. A missing cookie redirects early for a
// better UX; a present cookie is NOT trusted — pages, actions and route handlers
// verify the session and role via lib/auth/dal.js.
//
// Guest-only pages (/login, /register) are NOT redirected here: a stale or forged cookie
// would bounce between /login and /dashboard. Those pages verify the session themselves.
const PROTECTED_PREFIXES = ["/dashboard", "/learn", "/review", "/admin"];

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
  matcher: ["/dashboard/:path*", "/learn/:path*", "/review/:path*", "/admin/:path*"],
};
