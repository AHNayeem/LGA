// Minimal structured JSON logger (Vercel collects stdout/stderr).
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const REDACT = new Set(["password", "passwordHash", "token", "tokenHash", "cookie", "authorization", "MONGODB_URI"]);

function threshold() {
  return LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;
}

function redact(value, depth = 0) {
  if (value == null || depth > 4) return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message, code: value.code, stack: value.stack };
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = REDACT.has(k) ? "[redacted]" : redact(v, depth + 1);
    return out;
  }
  return value;
}

function write(level, message, context) {
  if (LEVELS[level] < threshold() || process.env.NODE_ENV === "test") return;
  const line = JSON.stringify({ level, time: new Date().toISOString(), message, ...redact(context ?? {}) });
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (msg, ctx) => write("debug", msg, ctx),
  info: (msg, ctx) => write("info", msg, ctx),
  warn: (msg, ctx) => write("warn", msg, ctx),
  error: (msg, ctx) => write("error", msg, ctx),
};

export { redact as _redact };
