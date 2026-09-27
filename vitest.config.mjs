import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: root },
      // `server-only` throws outside the React Server environment; tests run services directly.
      { find: "server-only", replacement: fileURLToPath(new URL("./tests/helpers/empty.js", import.meta.url)) },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.js", "tests/integration/**/*.test.js"],
    globalSetup: ["tests/helpers/globalSetup.js"],
    setupFiles: ["tests/helpers/setupEnv.js"],
    // Integration tests share one in-memory MongoDB; each file uses its own database.
    fileParallelism: true,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
