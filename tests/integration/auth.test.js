import { describe, expect, it } from "vitest";
import { setupTestDatabase } from "@/tests/helpers/db";
import * as auth from "@/lib/services/authService";
import { hashToken } from "@/lib/auth/tokens";
import { getDb } from "@/lib/db/client";
import { AuthenticationError, ConflictError, RateLimitError, ValidationError } from "@/lib/errors";
import { ensureAdmin, changeUserRole } from "@/lib/services/userAdminService";
import { ROLES } from "@/lib/auth/roles";

setupTestDatabase();

const ctx = { ip: "203.0.113.5", userAgent: "vitest" };
const input = { name: "Anna Müller", email: "Anna@Example.de", password: "sehr-sicheres-pw", uiLanguage: "bn" };

describe("registration", () => {
  it("creates a USER with a hashed password and a session", async () => {
    const res = await auth.register(input, ctx);
    expect(res.user).toMatchObject({ email: "anna@example.de", role: "USER", uiLanguage: "bn", name: "Anna Müller" });
    const db = await getDb();
    const stored = await db.collection("users").findOne({ email: "anna@example.de" });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(stored.passwordHash).not.toContain(input.password);
    const session = await db.collection("sessions").findOne({});
    expect(session.tokenHash).toBe(hashToken(res.token));
    expect(JSON.stringify(session)).not.toContain(res.token);
  });

  it("ignores attempts to self-assign ADMIN", async () => {
    const res = await auth.register({ ...input, role: "ADMIN" }, ctx);
    expect(res.user.role).toBe("USER");
  });

  it("rejects duplicate emails case-insensitively", async () => {
    await auth.register(input, ctx);
    await expect(auth.register({ ...input, email: "ANNA@example.DE" }, ctx)).rejects.toBeInstanceOf(ConflictError);
  });

  it("validates input", async () => {
    await expect(auth.register({ ...input, password: "kurz" }, ctx)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("login and sessions", () => {
  it("logs in with correct credentials and resolves the session", async () => {
    await auth.register(input, ctx);
    const { token } = await auth.login({ email: "anna@example.de", password: input.password }, ctx);
    const resolved = await auth.resolveSession(token);
    expect(resolved.user.email).toBe("anna@example.de");
  });

  it("uses one generic error for unknown email and wrong password", async () => {
    await auth.register(input, ctx);
    const a = await auth.login({ email: "anna@example.de", password: "wrong-password" }, ctx).catch((e) => e);
    const b = await auth.login({ email: "nobody@example.de", password: "wrong-password" }, ctx).catch((e) => e);
    expect(a).toBeInstanceOf(AuthenticationError);
    expect(b).toBeInstanceOf(AuthenticationError);
    expect(a.message).toBe(b.message);
  });

  it("rejects NoSQL operator payloads", async () => {
    await auth.register(input, ctx);
    await expect(auth.login({ email: { $ne: null }, password: { $ne: null } }, ctx)).rejects.toBeInstanceOf(ValidationError);
  });

  it("logout invalidates the token", async () => {
    const { token } = await auth.register(input, ctx);
    await auth.logout(token);
    expect(await auth.resolveSession(token)).toBeNull();
  });

  it("expired sessions do not resolve even before TTL cleanup", async () => {
    const { token } = await auth.register(input, ctx);
    const db = await getDb();
    await db.collection("sessions").updateOne({ tokenHash: hashToken(token) }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await auth.resolveSession(token)).toBeNull();
  });

  it("unknown and malformed tokens resolve to null", async () => {
    expect(await auth.resolveSession("x".repeat(43))).toBeNull();
    expect(await auth.resolveSession(null)).toBeNull();
  });

  it("role is read fresh on each request", async () => {
    const { token, user } = await auth.register(input, ctx);
    const db = await getDb();
    await db.collection("users").updateOne({ email: user.email }, { $set: { role: "ADMIN" } });
    expect((await auth.resolveSession(token)).user.role).toBe("ADMIN");
  });
});

describe("rate limiting", () => {
  it("locks an email after repeated failures", async () => {
    await auth.register(input, ctx);
    const attempt = (i) => auth.login({ email: "anna@example.de", password: "wrong-password" }, { ip: `198.51.100.${i}` });
    for (let i = 0; i < 8; i++) await expect(attempt(i)).rejects.toBeInstanceOf(AuthenticationError);
    await expect(attempt(99)).rejects.toBeInstanceOf(RateLimitError);
    // Even the correct password is refused while locked.
    await expect(auth.login({ email: "anna@example.de", password: input.password }, { ip: "198.51.100.200" })).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it("limits registrations per IP", async () => {
    for (let i = 0; i < 10; i++) await auth.register({ ...input, email: `u${i}@example.de` }, ctx);
    await expect(auth.register({ ...input, email: "u11@example.de" }, ctx)).rejects.toBeInstanceOf(RateLimitError);
  });

  it("counts concurrent attempts atomically", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 15 }, (_, i) => auth.register({ ...input, email: `c${i}@example.de` }, { ip: "192.0.2.1" })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(10);
    expect(results.filter((r) => r.reason instanceof RateLimitError)).toHaveLength(5);
  });
});

describe("admin bootstrap and role changes", () => {
  it("creates an admin, then promotes an existing user idempotently", async () => {
    const created = await ensureAdmin({ email: "admin@example.de", password: "admin-password-1", name: "Admin" });
    expect(created.created).toBe(true);
    const { user } = await auth.register(input, ctx);
    const promoted = await ensureAdmin({ email: user.email, password: "ignored-password", name: "x" });
    expect(promoted).toMatchObject({ created: false, promoted: true });
    // Password unchanged without --reset-password.
    await expect(auth.login({ email: user.email, password: input.password }, ctx)).resolves.toBeTruthy();
  });

  it("USER cannot change roles; role change revokes sessions", async () => {
    const { user, token } = await auth.register(input, ctx);
    await expect(changeUserRole(user, { userId: user.id, role: ROLES.ADMIN })).rejects.toThrow(/permission/);
    const admin = { id: "64b7f0c2a1b2c3d4e5f60718", role: ROLES.ADMIN };
    await changeUserRole(admin, { userId: user.id, role: ROLES.ADMIN });
    expect(await auth.resolveSession(token)).toBeNull();
  });
});
