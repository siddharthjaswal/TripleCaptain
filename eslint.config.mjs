import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import testingLibrary from "eslint-plugin-testing-library";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: [
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "**/?(*.)+(spec|test).{js,jsx,ts,tsx}",
    ],
    ignores: ["tests/e2e/**/*"],
    ...testingLibrary.configs["flat/react"],
    languageOptions: {
      ...testingLibrary.configs["flat/react"].languageOptions,
      globals: {
        ...(testingLibrary.configs["flat/react"].languageOptions?.globals ??
          {}),
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },
]);

export default eslintConfig;
