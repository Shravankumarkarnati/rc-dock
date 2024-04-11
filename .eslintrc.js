module.exports = {
  env: {
    es2021: true,
    browser: true,
    jest: true,
  },
  globals: {
    JSX: true,
    React: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  ignorePatterns: [".eslintrc.js", "assets", "build", "dist", "lib", "node_modules", "public"],
  plugins: ["react", "react-hooks", "prettier", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "react/self-closing-comp": "error",
    "react/jsx-boolean-value": "error",
    "react/jsx-closing-bracket-location": "error",
    "react/jsx-closing-tag-location": "error",
    "react/jsx-curly-brace-presence": ["warn", { props: "never", children: "never" }],
    "react/jsx-wrap-multilines": "error",
    "react/jsx-uses-react": "off", //https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#eslint
    "react/react-in-jsx-scope": "off", //https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#eslint
    "react/prop-types": "off",
    "react-hooks/exhaustive-deps": ["warn"],

    "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "jsx" }],

    "no-async-promise-executor": ["error"],
    "no-console": ["warn", { allow: ["error", "info", "warn"] }],
    "no-restricted-imports": ["error"],
    "no-var": ["error"],
    eqeqeq: ["error", "always", { null: "ignore" }],
    "no-unused-vars": "off", // Typescript eslint rule covers this ^
  },
  parser: "@typescript-eslint/parser",
  settings: {
    react: {
      version: "detect",
    },
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
  },
}
