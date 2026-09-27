import { createHash, randomBytes } from "node:crypto";

// Raw tokens only ever live in the HttpOnly cookie; the database stores the SHA-256.
export function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export function isWellFormedToken(token) {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}
