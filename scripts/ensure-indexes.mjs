// Usage: bun run db:indexes — run on every deploy (idempotent).
import { ensureIndexes } from "@/lib/db/indexes";
import { closeClient } from "@/lib/db/client";

try {
  const res = await ensureIndexes();
  for (const [name, idx] of Object.entries(res)) console.log(`${name}: ${idx.join(", ")}`);
} catch (err) {
  console.error("ensure-indexes failed:", err.message);
  process.exitCode = 1;
} finally {
  await closeClient();
}
