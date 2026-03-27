import { ColorSchemeName } from "react-native";

export const lightColorTokens = {
  background: "#FAFBFD",
  surface: "#FFFFFF",
  surfaceSoft: "#F5F7FA",
  border: "#E6EAF0",
  textPrimary: "#111418",
  textSecondary: "#66707A",
  accent: "#6366F1",
  accentSoft: "#EEF0FF",
  shadow: "rgba(15, 23, 42, 0.06)",
  overlay: "rgba(15, 23, 42, 0.14)",
} as const;

export const darkColorTokens = {
  background: "#090B0E",
  surface: "#111418",
  surfaceSoft: "#171B20",
  border: "#232A32",
  textPrimary: "#F5F7FA",
  textSecondary: "#98A2AD",
  accent: "#818CF8",
  accentSoft: "rgba(129,140,248,0.18)",
  shadow: "rgba(0,0,0,0.42)",
  overlay: "rgba(0,0,0,0.56)",
} as const;

const semanticStatusColors = {
  danger: "#F87171",
  warning: "#FBBF24",
  success: "#34D399",
  accentText: "#FFFFFF",
};

export const getThemeColors = (scheme: ColorSchemeName) => {
  const tokens = scheme === "dark" ? darkColorTokens : lightColorTokens;

  return {
    ...tokens,
    ...semanticStatusColors,
  };
};

export type AppThemeColors = ReturnType<typeof getThemeColors>;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};
