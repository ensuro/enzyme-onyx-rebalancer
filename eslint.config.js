import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "artifacts/**",
      "cache/**",
      "dist/**",
      "typechain-types/**",
      "types/**",
      "coverage/**",
      "soljson*.js",
    ],
  },
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["**/*.{js,ts}"],
    rules: {
      // Trimmed subset of ensuro/utils ESLint rules (see https://github.com/ensuro/utils).
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "no-console": "off",
      eqeqeq: "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  }
);
