import { DarkTheme, DefaultTheme } from "@react-navigation/native";

import { useAppSettings } from "@/context/AppSettingsContext";
import { getThemeColors, radius, shadowPresets, spacing, typography } from "@/theme";

export const useAppTheme = () => {
  const { theme, accentColor } = useAppSettings();
  const mode = theme === "Dark" ? "dark" : "light";
  const isDark = mode === "dark";
  const colors = getThemeColors(mode, accentColor);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      primary: colors.accent,
      text: colors.textPrimary,
      notification: colors.accent,
    },
  };

  return {
    colorScheme: mode,
    mode,
    theme,
    accentColor,
    isDark,
    colors,
    spacing,
    radius,
    typography,
    shadows: {
      card: shadowPresets.card(colors),
      soft: shadowPresets.soft(colors),
    },
    navigationTheme,
    statusBarStyle: isDark ? "light" : "dark",
  } as const;
};
