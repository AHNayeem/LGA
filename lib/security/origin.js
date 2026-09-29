// CSRF protection for cookie-authenticated route handlers (Server Actions get Next's
// own Origin check). A mutating request is accepted only when the browser says it comes
// from our own origin:
//   - `Origin` is required and must equal the app origin (APP_URL) or the origin the
//     request was addressed to (Host / X-Forwarded-Host). A cross-site page cannot forge
//     either header in a victim's browser.
//   - `Sec-Fetch-Site`, when sent, must be "same-origin".
// Pure function over a Headers object so it can be unit-tested.

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function checkSameOrigin(headers, { appUrl } = {}) {
  const site = headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return { ok: false, reason: "cross-site" };

  const origin = headers.get("origin");
  if (!origin || origin === "null") return { ok: false, reason: "missing-origin" };
  const claimed = originOf(origin);
  if (!claimed) return { ok: false, reason: "invalid-origin" };

  const allowed = new Set();
  const app = appUrl ? originOf(appUrl) : null;
  if (app) allowed.add(app);
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (host) {
    const proto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || new URL(claimed).protocol.replace(":", "");
    const own = originOf(`${proto}://${host.split(",")[0].trim()}`);
    if (own) allowed.add(own);
  }
  return allowed.has(claimed) ? { ok: true } : { ok: false, reason: "origin-mismatch" };
}
