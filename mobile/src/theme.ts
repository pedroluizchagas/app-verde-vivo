export type ThemeMode = "light" | "dark"

export type ThemeColors = {
  bg: string
  headerBg: string
  surface: string
  surfaceAlt: string
  border: string
  divider: string
  textPrimary: string
  textSecondary: string
  link: string
  success: string
  danger: string
  warning: string
  muted: string
  overlay: string
  accent: string
}

export const darkColors: ThemeColors = {
  bg: "#0b0f13",
  headerBg: "#0b0f13",
  surface: "#1a1f24",
  surfaceAlt: "#12171c",
  border: "#2a2f36",
  divider: "#12171c",
  textPrimary: "#f9fafb",
  textSecondary: "#9ca3af",
  link: "#22c55e",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  muted: "#6b7280",
  overlay: "rgba(0,0,0,0.6)",
  accent: "#8b5cf6",
}

export const lightColors: ThemeColors = {
  bg: "#F9FAFB",
  headerBg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#FFFFFF",
  border: "#E5E7EB",
  divider: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  link: "#16a34a",
  success: "#16a34a",
  danger: "#EF4444",
  warning: "#F59E0B",
  muted: "#9CA3AF",
  overlay: "rgba(0,0,0,0.4)",
  accent: "#6d28d9",
}

export const themes = {
  dark: darkColors,
  light: lightColors,
}