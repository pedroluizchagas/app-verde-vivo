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
      // checksVoidReturn.attributes desabilitado: React aceita
      // `onClick={async () => …}` em event handlers; checar isso aqui
      // criaria ruído sem benefício de segurança real.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      // <img>: revisto na Fase 08 (perf/escala).
      "@next/next/no-img-element": "off",
      // Regras novas do React 19 (eslint-config-next 16) que detectam
      // bugs sutis pré-existentes — fora de escopo da Fase 02. Tratar
      // em fase própria com auditoria dedicada.
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "no-console": ["warn", { allow: ["error", "warn"] }],
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  eslintConfigPrettier,
];

export default config;
