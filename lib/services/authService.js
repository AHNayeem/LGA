import { getEnv } from "@/lib/config/env";
import { AuthenticationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateSessionToken, hashToken, isWellFormedToken } from "@/lib/auth/tokens";
import { ROLES } from "@/lib/auth/roles";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { parseOrThrow } from "@/lib/validation/common";
import { enforceRateLimit, resetRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";
import * as userRepo from "@/lib/repositories/userRepository";
import * as sessionRepo from "@/lib/repositories/sessionRepository";

// Framework-agnostic auth logic. Cookie handling lives in lib/auth/session.js so this
// service can be tested without Next.js.

const INVALID_CREDENTIALS = "Email or password is incorrect.";

function publicUser(u) {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name,
    role: u.role,
    uiLanguage: u.uiLanguage ?? "en",
    // Onboarding choices (learningProfileService); null until the learner sets them.
    learningProfile: u.learningProfile ?? null,
  };
}

async function startSession(user, ctx) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + getEnv().SESSION_TTL_DAYS * 86_400_000);
  await sessionRepo.insertSession({
    tokenHash: hashToken(token),
    userId: user._id,
    expiresAt,
    userAgent: ctx?.userAgent,
    ip: ctx?.ip,
  });
  return { token, expiresAt };
}

// Self-registration always creates a USER. Admins are created by script or promoted by an admin.
export async function register(input, ctx = {}) {
  await enforceRateLimit(RATE_LIMITS.registerByIp, ctx.ip);
  const data = parseOrThrow(registerSchema, input);
  const passwordHash = await hashPassword(data.password);
  const user = await userRepo.insertUser({
    email: data.email,
    name: data.name,
    passwordHash,
    role: ROLES.USER,
    uiLanguage: data.uiLanguage,
  });
  const session = await startSession(user, ctx);
  logger.info("user_registered", { userId: String(user._id) });
  return { user: publicUser(user), ...session };
}

export async function login(input, ctx = {}) {
  const data = parseOrThrow(loginSchema, input);
  const emailKey = hashToken(data.email).slice(0, 32);
  await enforceRateLimit(RATE_LIMITS.loginByIp, ctx.ip);
  await enforceRateLimit(RATE_LIMITS.loginByEmail, emailKey);

  const user = await userRepo.findUserByEmailWithHash(data.email);
  const valid = await verifyPassword(data.password, user?.passwordHash);
  if (!user || !valid) {
    logger.info("login_failed", { reason: user ? "bad_password" : "unknown_email" });
    throw new AuthenticationError(INVALID_CREDENTIALS);
  }

  await resetRateLimit(RATE_LIMITS.loginByEmail, emailKey);
  await userRepo.touchLastLogin(user._id);
  const session = await startSession(user, ctx);
  logger.info("login_succeeded", { userId: String(user._id) });
  return { user: publicUser(user), ...session };
}

// Returns the user for a raw cookie token, or null. Role is read fresh from the DB on
// every request, so role changes and account removal take effect immediately.
export async function resolveSession(token) {
  if (!isWellFormedToken(token)) return null;
  const session = await sessionRepo.findActiveSession(hashToken(token));
  if (!session) return null;
  const user = await userRepo.findUserById(session.userId);
  if (!user) {
    await sessionRepo.deleteSession(session.tokenHash);
    return null;
  }
  return { user: publicUser(user), expiresAt: session.expiresAt };
}

export async function logout(token) {
  if (!isWellFormedToken(token)) return;
  await sessionRepo.deleteSession(hashToken(token));
}

export async function logoutEverywhere(userId) {
  return sessionRepo.deleteSessionsForUser(userId);
}
