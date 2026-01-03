import eslintConfigNext from "eslint-config-next"
import eslintConfigNextCoreWebVitals from "eslint-config-next/core-web-vitals"

const nextConfigs = eslintConfigNext.default ?? eslintConfigNext

const coreWebVitalsConfigs = eslintConfigNextCoreWebVitals.default ?? eslintConfigNextCoreWebVitals
const legacyCoreWebVitals = coreWebVitalsConfigs[coreWebVitalsConfigs.length - 1]
const coreWebVitalsRules = legacyCoreWebVitals?.rules ?? {}

export default [
  {
    ignores: [
      "mobile/**",
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
    ],
  },
  ...nextConfigs,
  {
    name: "next/core-web-vitals",
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: coreWebVitalsRules,
  },
]
