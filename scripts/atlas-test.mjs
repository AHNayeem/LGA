// Usage: bun run test:atlas     (needs ATLAS_TEST_URI, or MONGODB_URI in .env.local)
//
// Runs the integration suite plus tests/atlas/* against a REAL MongoDB Atlas cluster.
// Every test file gets its own throwaway database lga_itest_<run>_<id>, dropped when the
// file finishes; leftovers from this run are dropped at the end. The deterministic
// in-memory suite (`bun run test`) is unchanged. Use a development/test cluster only.
import { spawnSync } from "node:child_process";
import { dropDatabasesWithPrefix, newRunId, resolveAtlasUri } from "./lib/atlas.mjs";

let atlas;
try {
  atlas = resolveAtlasUri();
} catch (err) {
  console.error(`test:atlas: ${err.message}`);
  process.exit(1);
}

const runId = newRunId();
const prefix = `lga_itest_${runId}_`;
console.log(`test:atlas: ${atlas.source} → ${atlas.host}, throwaway databases ${prefix}*`);

const res = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--config", "vitest.atlas.config.mjs", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, ATLAS_TEST_URI: atlas.uri, ATLAS_TEST_DB_PREFIX: prefix },
});

try {
  const { dropped, listed } = await dropDatabasesWithPrefix(atlas.uri, prefix);
  console.log(listed ? `test:atlas: cleaned up ${dropped.length} leftover database(s).` : "test:atlas: could not list databases; each test file dropped its own.");
} catch (err) {
  console.error(`test:atlas: cleanup failed: ${err.message}`);
}
process.exit(res.status ?? 1);
