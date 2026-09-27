// Usage: bun run seed   (reads MONGODB_URI from .env.local)
import { ensureIndexes } from "@/lib/db/indexes";
import { closeClient } from "@/lib/db/client";
import { seedLevels, seedReferences } from "@/lib/services/seedService";
import { LEVELS } from "@/content/seed/levels";
import { REFERENCES } from "@/content/seed/references";

try {
  await ensureIndexes();
  const levels = await seedLevels(LEVELS);
  const refs = await seedReferences(REFERENCES);
  console.log(`Indexes ensured. Levels inserted: ${levels.inserted}/${levels.total}. References inserted: ${refs.inserted}.`);
  console.log("All seeded records start as reviewStatus=draft, publishStatus=unpublished.");
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await closeClient();
}
