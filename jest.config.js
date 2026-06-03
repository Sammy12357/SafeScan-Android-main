/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },
  testMatch: [
    "<rootDir>/**/__tests__/**/*.test.(ts|tsx|js|jsx)",
    "<rootDir>/**/*.test.(ts|tsx|js|jsx)"
  ],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|@gorhom/.*|@shopify/.*|@tanstack/.*|zustand))"
  ],
  collectCoverageFrom: [
    "utils/**/*.{ts,tsx}",
    "services/**/*.{ts,tsx}",
    "stores/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "!**/__tests__/**"
  ]
};
