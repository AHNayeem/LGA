import { toErrorResult } from "@/lib/errors";
import { logger } from "@/lib/logger";

// Runs Server Action logic and converts failures into a serialisable result.
// Don't call redirect() inside `fn`: Next implements redirect by throwing, so call it
// after this returns ok.
export async function runAction(name, fn) {
  try {
    const data = await fn();
    return { ok: true, data: data ?? null };
  } catch (err) {
    const result = toErrorResult(err);
    if (result.code === "INTERNAL") logger.error("action_failed", { action: name, err });
    return result;
  }
}

export function formToObject(formData, fields) {
  const out = {};
  for (const f of fields) {
    const v = formData.get(f);
    if (typeof v === "string") out[f] = v;
  }
  return out;
}

// Only same-origin relative paths are allowed as post-login redirects.
export function safeRedirectPath(value, fallback = "/dashboard") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
