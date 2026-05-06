export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://safescan-qr.onrender.com",
  googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  serverWakeDelayMs: 5000,
  analyzeTimeoutMs: 60000,
  appScheme: "safescan",
  appVersion: "1.0.0-beta"
} as const;
