// Live benchmark, not part of the gate: calls the real API with .env.local.
//   npx vitest run --config scripts/bench/vitest.config.ts
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) } },
  test: {
    include: ["scripts/bench/**/*.bench.test.ts"],
    env: loadEnv("", process.cwd(), ""),
    testTimeout: 600_000,
  },
});
