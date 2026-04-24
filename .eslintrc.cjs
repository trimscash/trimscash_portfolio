/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  overrides: [
    {
      files: ["*.astro"],
      parser: "astro-eslint-parser",
      parserOptions: { parser: "@typescript-eslint/parser", extraFileExtensions: [".astro"] },
      extends: ["plugin:astro/recommended"],
    },
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
  },
};
