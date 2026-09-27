// Usage: bun run seed [-- --update]   (reads MONGODB_URI from .env.local)
//
// Inserts missing levels, reference metadata and curriculum modules, and registers the
// generated audio listed in content/audio/manifest.json. Everything new starts as
// draft/unpublished. With --update, changed curriculum items are updated AND sent back
// to draft for re-review.
import { ensureIndexes } from "@/lib/db/indexes";
import { closeClient } from "@/lib/db/client";
import { seedCurriculumModule, seedLevels, seedReferences } from "@/lib/services/seedService";
import { registerTtsAssets } from "@/lib/services/audioService";
import { fileManifestRegistry } from "@/lib/audio/fileStore";
import { LEVELS } from "@/content/seed/levels";
import { REFERENCES } from "@/content/seed/references";
import { CURRICULUM } from "@/content/curriculum/index.js";

const update = process.argv.includes("--update");

try {
  await ensureIndexes();
  const levels = await seedLevels(LEVELS);
  const refs = await seedReferences(REFERENCES);
  console.log(`Indexes ensured. Levels inserted: ${levels.inserted}/${levels.total}. References inserted: ${refs.inserted}.`);

  for (const def of CURRICULUM) {
    const r = await seedCurriculumModule(def, { update });
    console.log(`Module ${def.levelCode}/${r.module}: inserted ${r.inserted}, updated ${r.updated} (back to draft), unchanged ${r.unchanged}.`);
  }

  const registry = fileManifestRegistry();
  const present = registry.present();
  const { registered } = await registerTtsAssets(present);
  const missing = registry.entries.size - present.length;
  console.log(`Audio assets registered: ${registered}.${missing ? ` ${missing} manifest entries have no file in public/media.` : ""}`);
  console.log("Nothing was approved or published. Review content in /admin.");
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await closeClient();
}
