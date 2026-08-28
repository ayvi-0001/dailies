import * as eslint from "@eslint/eslintrc";
import stylistic from "@stylistic/eslint-plugin";
import react from "eslint-plugin-react";

const compat = new eslint.FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"],

    plugins: { react: react, "@stylistic": stylistic },
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
      "@stylistic/block-spacing": ["error"],
      "@stylistic/curly-newline": [
        "error",
        {
          ArrowFunctionExpression: { multiline: true, minElements: 4 },
          BlockStatement: "always",
          IfStatementConsequent: "always",
          IfStatementAlternative: "always",
          ForStatement: "always",
          ForInStatement: "always",
          ForOfStatement: "always",
          WhileStatement: "always",
          DoWhileStatement: "always",
          SwitchStatement: "always",
          SwitchCase: "always",
          TryStatementBlock: "always",
          TryStatementHandler: "always",
          TryStatementFinalizer: "always",
          FunctionDeclaration: "always",
          FunctionExpression: "always",
          Property: "always",
          ClassBody: "always",
          StaticBlock: "always",
          WithStatement: "always",
          TSModuleBlock: "always",
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
