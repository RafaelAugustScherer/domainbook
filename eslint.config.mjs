// @ts-check
import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["**/dist/", "graphify-out/", "**/test/fixtures/"]),
  {
    files: ["**/*.{js,mjs,ts}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      sonarjs.configs.recommended,
    ],
    languageOptions: {
      globals: { Buffer: "readonly", process: "readonly", URL: "readonly" },
    },
    rules: {
      "sonarjs/no-os-command-from-path": "off",
    },
  }
);
