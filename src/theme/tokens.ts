import { ColorSchemeName, TextStyle, ViewStyle } from "react-native";

export const lightColorTokens = {
  background: "#F8FAFD",
  surface: "#FFFFFF",
  surfaceSoft: "#F3F6FB",
  surfaceMuted: "#EEF2F8",
  border: "#E6EBF3",
  borderStrong: "#D7DFEA",
  textPrimary: "#121722",
  textSecondary: "#6B7280",
  textMuted: "#8A94A6",
  accent: "#6366F1",
  accentSoft: "#EEF0FF",
  accentText: "#FFFFFF",
  success: "#34C38F",
  warning: "#F4B740",
  danger: "#F87171",
  shadow: "rgba(15, 23, 42, 0.08)",
  overlay: "rgba(15, 23, 42, 0.14)",
} as const;

export const darkColorTokens = {
  background: "#090B0E",
  surface: "#111418",
  surfaceSoft: "#171B20",
  surfaceMuted: "#1D2229",
  border: "#232A32",
  borderStrong: "#2E3743",
  textPrimary: "#F5F7FA",
  textSecondary: "#98A2AD",
  textMuted: "#7D8793",
  accent: "#818CF8",
  accentSoft: "rgba(129,140,248,0.18)",
  accentText: "#FFFFFF",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  shadow: "rgba(0,0,0,0.42)",
  overlay: "rgba(0,0,0,0.56)",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export const typography = {
  pageTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.7,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  } satisfies TextStyle,
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  } satisfies TextStyle,
  secondary: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  } satisfies TextStyle,
  meta: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    letterSpacing: 0.2,
  } satisfies TextStyle,
  metric: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.8,
  } satisfies TextStyle,
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  } satisfies TextStyle,
} as const;

export const getThemeColors = (scheme: ColorSchemeName) =>
  scheme === "dark" ? darkColorTokens : lightColorTokens;

export type AppThemeColors = ReturnType<typeof getThemeColors>;
export type AppTypography = typeof typography;

export const shadowPresets = {
  card: (colors: AppThemeColors) =>
    ({
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 22,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      elevation: 4,
    }) satisfies ViewStyle,
  soft: (colors: AppThemeColors) =>
    ({
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 2,
    }) satisfies ViewStyle,
} as const;
