import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "static-export/**",
    ".wrangler/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Locale and shared-plan hydration intentionally synchronize browser-only state.
      "react-hooks/set-state-in-effect": "off",
      // The FTP export uses plain document links so routes work without a Next server.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
