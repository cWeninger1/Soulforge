import globals from "globals";
import js from "@eslint/js";
import ts from "typescript-eslint";
export default ts.config(
  { ignores: ["dist/**", "test-results/**", "playwright-report/**"] },
  js.configs.recommended,
  {
    files: ["tests/emulator/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  ...ts.configs.recommended,
);
