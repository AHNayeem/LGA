// Domain errors. `expose` marks messages that are safe to show to the user.
export class AppError extends Error {
  constructor(message, { code = "APP_ERROR", status = 500, expose = false, details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.expose = expose;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input.", fieldErrors = {}) {
    super(message, { code: "VALIDATION", status: 400, expose: true, details: fieldErrors });
    this.fieldErrors = fieldErrors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Please sign in.") {
    super(message, { code: "UNAUTHENTICATED", status: 401, expose: true });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that.") {
    super(message, { code: "FORBIDDEN", status: 403, expose: true });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, { code: "NOT_FOUND", status: 404, expose: true });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict.") {
    super(message, { code: "CONFLICT", status: 409, expose: true });
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "The upload is too large.") {
    super(message, { code: "PAYLOAD_TOO_LARGE", status: 413, expose: true });
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSec) {
    super("Too many attempts. Please try again later.", { code: "RATE_LIMITED", status: 429, expose: true });
    this.retryAfterSec = retryAfterSec;
  }
}

export function isAppError(err) {
  return err instanceof AppError;
}

// Converts any thrown value into a serialisable result for Server Actions / route handlers.
export function toErrorResult(err) {
  if (isAppError(err) && err.expose) {
    return { ok: false, code: err.code, message: err.message, fieldErrors: err.fieldErrors ?? {} };
  }
  return { ok: false, code: "INTERNAL", message: "Something went wrong. Please try again.", fieldErrors: {} };
}
