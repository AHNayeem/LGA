import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));

// Integration tests against a real MongoDB Atlas cluster. Started by scripts/atlas-test.mjs
// (`bun run test:atlas`), which supplies ATLAS_TEST_URI. No in-memory server here.
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: root },
      { find: "server-only", replacement: fileURLToPath(new URL("./tests/helpers/empty.js", import.meta.url)) },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.js", "tests/atlas/**/*.test.js"],
    setupFiles: ["tests/helpers/setupAtlasEnv.js"],
    // One file at a time: gentle on shared/free-tier clusters and their connection limits.
    fileParallelism: false,
    testTimeout: 90_000,
    hookTimeout: 180_000,
  },
});
