const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "ios/**",
      "android/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "scripts/**"
    ]
  },
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "no-empty": ["error", { allowEmptyCatch: true }]
    }
  },
  {
    files: ["**/*.test.{ts,tsx,js,jsx}", "jest.setup.js"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly"
      }
    }
  }
];
