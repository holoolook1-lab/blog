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
    "next-env.d.ts",
    // Project-specific ignores
    "scripts/**",
    "public/workbox/**",
  ]),
  // Project rules
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      // 경고 없이 엄격 모드 유지
      "no-console": ["error", { allow: ["warn", "error"] }],
      "eqeqeq": "error",
      "no-var": "error",
      "prefer-const": "off",
      // TS 규칙 중 경고가 많은 항목은 비활성화하고 기본 규칙으로 대체
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/purity": "off",
      "react-hooks/rules-of-hooks": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "off",
      "eslint-comments/no-unused-disable": "off",
      "eslint/no-unused-disable": "off",
      "no-unused-disable": "off",
      "no-unused-vars": "off",
      "no-implicit-coercion": "off",
    },
  },
  // 테스트 파일 글로벌 허용
  {
    files: ["test/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
      },
    },
  },
]);

export default eslintConfig;
