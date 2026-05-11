import eslintConfigNext from "eslint-config-next";
import eslintConfigNextCoreWebVitals from "eslint-config-next/core-web-vitals";
import eslintConfigPrettier from "eslint-config-prettier";
import tsParser from "@typescript-eslint/parser";

const nextConfigs = eslintConfigNext.default ?? eslintConfigNext;

const coreWebVitalsConfigs = eslintConfigNextCoreWebVitals.default ?? eslintConfigNextCoreWebVitals;
const legacyCoreWebVitals = coreWebVitalsConfigs[coreWebVitalsConfigs.length - 1];
const coreWebVitalsRules = legacyCoreWebVitals?.rules ?? {};

const config = [
  {
    ignores: [
      "mobile/**",
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      "scripts/**",
      "next-env.d.ts",
    ],
  },
  ...nextConfigs,
  {
    name: "next/core-web-vitals",
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: coreWebVitalsRules,
  },
  {
    name: "gestao-garden/typescript-typed",
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": ["error", { ignoreRestArgs: false }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  eslintConfigPrettier,
];

export default config;
