import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["dist/**", "node_modules/**"],
    fileParallelism: false,
    include: ["src/test/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10000,
  },
});
