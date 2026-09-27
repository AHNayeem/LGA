// Shared by proxy.js (edge-safe, no DB) and the server session module.
// `__Host-` requires Secure + Path=/ and forbids Domain, so it can't be set by subdomains.
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-lga_session" : "lga_session";

export function sessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  };
}
