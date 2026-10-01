// Limits for guests (no account). Guests are identified by client IP only (see
// lib/security/request.js), so one window covers everything a guest can ask the server to
// do: grading exercises and practice exams, and loading flashcards for review. A guest
// lesson needs one request per exercise check, so this is generous for real learning but
// stops scripted flooding. Used with enforceRateLimit (lib/security/rateLimit.js); the
// counter in rateLimits is the only thing a guest ever writes.
export const GUEST_RATE_LIMITS = Object.freeze({
  learningByIp: { prefix: "guest:ip", limit: 600, windowMs: 60 * 60_000 },
});
