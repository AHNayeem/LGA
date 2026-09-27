import { collection, COLLECTIONS } from "@/lib/db/collections";

const rateLimits = () => collection(COLLECTIONS.rateLimits);

// Atomically increments the counter for `key` in the current fixed window.
// The window key embeds the window start, so a new window starts a fresh document;
// the TTL index removes old windows.
export async function incrementWindow(key, windowMs, now = Date.now()) {
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const docKey = `${key}:${windowStart}`;
  const expiresAt = new Date(windowStart + windowMs);
  const col = await rateLimits();
  const run = () =>
    col.findOneAndUpdate(
      { key: docKey },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after" },
    );
  let doc;
  try {
    doc = await run();
  } catch (err) {
    // Two concurrent first hits can both try to insert; the loser retries as an update.
    if (err?.code !== 11000) throw err;
    doc = await run();
  }
  return { count: doc.count, resetAt: expiresAt };
}

export async function clearKey(key) {
  await (await rateLimits()).deleteMany({ key: { $regex: `^${escapeRegex(key)}:` } });
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
