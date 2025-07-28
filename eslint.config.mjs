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
    rules: {
      // Allow exhaustive-deps warnings (React hooks dependency warnings)
      "react-hooks/exhaustive-deps": "off",

      // Allow unused variables
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",

      // Allow img elements (for Next.js Image component)
      "@next/next/no-img-element": "off",

      "no-var": "off",
    },
  },
];

export default eslintConfig;
