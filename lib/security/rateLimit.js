import { incrementWindow, clearKey } from "@/lib/repositories/rateLimitRepository";
import { RateLimitError } from "@/lib/errors";
import { logger } from "@/lib/logger";

// Fixed-window limits stored in MongoDB (no Redis). Limits are per identifier.
export const RATE_LIMITS = Object.freeze({
  loginByIp: { prefix: "login:ip", limit: 30, windowMs: 15 * 60_000 },
  loginByEmail: { prefix: "login:email", limit: 8, windowMs: 15 * 60_000 },
  registerByIp: { prefix: "register:ip", limit: 10, windowMs: 60 * 60_000 },
  uploadByUser: { prefix: "upload:user", limit: 60, windowMs: 60 * 60_000 },
  // Exercise submissions, block completions and flashcard ratings. Generous for real use,
  // but stops scripted flooding of the attempts collection.
  learningByUser: { prefix: "learning:user", limit: 1200, windowMs: 60 * 60_000 },
});

export async function enforceRateLimit(policy, identifier) {
  if (!identifier) return;
  const key = `${policy.prefix}:${identifier}`;
  const { count, resetAt } = await incrementWindow(key, policy.windowMs);
  if (count > policy.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
    logger.warn("rate_limited", { policy: policy.prefix, retryAfterSec });
    throw new RateLimitError(retryAfterSec);
  }
}

export async function resetRateLimit(policy, identifier) {
  if (!identifier) return;
  await clearKey(`${policy.prefix}:${identifier}`);
}
