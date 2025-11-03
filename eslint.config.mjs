// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Ignore analysis tools (development utilities)
      "src/analysis/**",
      "dist/**",
    ],
  },
  {
    rules: {
      // Very permissive unused variables - only warn during build, never error
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          // Ignore variables starting with underscore or common unused patterns
          "argsIgnorePattern": "^_|^error|^err|^e$|^request|^req|^response|^res|^_request|^_req",
          "varsIgnorePattern": "^_|^error|^err|^e$|^theme|^Comp",
          "caughtErrorsIgnorePattern": "^_|^error|^err|^e$",
          "ignoreRestSiblings": true,
          // Only check args after the last used one
          "args": "after-used",
          // Don't check destructured properties
          "destructuredArrayIgnorePattern": "^_",
        },
      ],
      // Disable base rule in favor of TypeScript version
      "no-unused-vars": "off",
      // Allow explicit any but warn
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow img tags (Next.js Image optimization is optional)
      "@next/next/no-img-element": "warn",
      // Allow anonymous default exports
      "import/no-anonymous-default-export": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
];

export default eslintConfig;
