import { FlatCompat } from "@eslint/eslintrc";
import react from "eslint-plugin-react";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],

    plugins: {
      react: react,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          shorthandFirst: true,
          multiline: "ignore",
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: true,
          locale: "auto",
        },
      ],
    },
  },
];

export default eslintConfig;
