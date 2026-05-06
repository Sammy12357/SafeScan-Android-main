export const colors = {
  background: "#0a0a0f",
  surface: "#111118",
  surfaceElevated: "#1a1a2e",
  surfaceBorder: "#1e293b",

  primary: "#7c3aed",
  primaryLight: "#a855f7",
  primaryDim: "rgba(124, 58, 237, 0.15)",
  primaryGlow: "rgba(124, 58, 237, 0.30)",

  accent: "#06b6d4",
  accentDim: "rgba(6, 182, 212, 0.15)",

  safe: "#10b981",
  safeDim: "rgba(16, 185, 129, 0.15)",
  suspicious: "#f59e0b",
  suspiciousDim: "rgba(245, 158, 11, 0.15)",
  danger: "#ef4444",
  dangerDim: "rgba(239, 68, 68, 0.15)",

  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
  textDisabled: "#334155",

  gradientStart: "#0a0a0f",
  gradientEnd: "#1a0a2e"
} as const;

export const fonts = {
  sans: "System",
  sansMedium: "System",
  sansSemiBold: "System",
  mono: "monospace"
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenPad: 16,
  cardPad: 20,
  cardRadius: 12,
  badgeRadius: 999,
  pillRadius: 8
} as const;

export const shadows = {
  cardPurple: {
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12
  },
  cardSubtle: {
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6
  }
} as const;

export const typography = {
  h1: { fontFamily: fonts.sansSemiBold, fontSize: 28, color: colors.textPrimary },
  h2: { fontFamily: fonts.sansSemiBold, fontSize: 22, color: colors.textPrimary },
  h3: { fontFamily: fonts.sansMedium, fontSize: 18, color: colors.textPrimary },
  body: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  label: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textMuted },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary },
  badge: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 0.6 }
} as const;

export const theme = {
  colors: {
    ...colors,
    backgroundEnd: colors.gradientEnd,
    border: colors.surfaceBorder,
    muted: colors.textMuted,
    primaryGlow: colors.primaryGlow
  },
  spacing: {
    screen: spacing.screenPad,
    card: spacing.cardPad
  },
  radius: {
    card: spacing.cardRadius,
    pill: spacing.badgeRadius
  },
  fonts,
  typography,
  shadows
} as const;

export type Theme = typeof theme;
