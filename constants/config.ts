export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://safescan-qr.onrender.com",
  serverWakeDelayMs: 5000,
  analyzeTimeoutMs: 60000,
  appScheme: "safescan",
  appVersion: "1.0.0-beta"
} as const;

export type UserRole = "user" | "admin";

// IMPORTANT: client never decides who is an admin. The backend's user profile
// must populate `role` and any privileged action must re-check on the server.
// This function exists only to surface a role already asserted by the backend.
export function roleForEmail(email?: string | null, backendRole?: UserRole | null): UserRole {
  return backendRole === "admin" && email ? "admin" : "user";
}
