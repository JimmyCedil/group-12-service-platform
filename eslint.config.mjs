import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  {
    files: ["public/**/*.js"],
    languageOptions: { globals: { document: "readonly", fetch: "readonly", Option: "readonly", FormData: "readonly", setTimeout: "readonly", encodeURIComponent: "readonly", Set: "readonly", Promise: "readonly" } },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
);
