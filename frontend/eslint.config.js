import js from "@eslint/js"
import reactPlugin from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import securityPlugin from "eslint-plugin-security"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist", "**/*.d.ts", "node_modules"] },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      securityPlugin.configs.recommended, // Bổ sung chuẩn Security của Codacy
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      // Fix: Chỉ cho phép ignore biến bắt đầu bằng dấu gạch dưới (vd: _req)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }], // Tránh rò rỉ log
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"], // Chỉ định rõ thư mục Frontend
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      globals: {
        ...globals.browser, // Chỉ bật Browser API cho Frontend
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules, // Hỗ trợ React 17+ không cần import React
      ...reactHooks.configs.recommended.rules,
      // Form state is initialized when dialogs and routes receive new inputs.
      // These controlled resets are intentional; React Compiler cannot infer them safely.
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
    settings: {
      react: {
        version: "detect", // Tự động nhận diện version React
      },
    },
  },
)
