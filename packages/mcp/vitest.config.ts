import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@domainbook/core": fileURLToPath(
        new URL("../core/src/index.ts", import.meta.url)
      ),
    },
  },
});
