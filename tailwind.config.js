/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#12121a",
        surfaceElevated: "#181824",
        primary: "#7c3aed",
        primaryGlow: "#a78bfa",
        accent: "#06b6d4",
        safe: "#10b981",
        suspicious: "#f59e0b",
        danger: "#ef4444",
        textPrimary: "#f8fafc",
        textSecondary: "#94a3b8",
        border: "#262637",
        muted: "#64748b"
      },
      borderRadius: {
        card: 12,
        pill: 999
      }
    }
  },
  plugins: []
};
