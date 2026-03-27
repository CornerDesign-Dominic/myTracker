import { DarkTheme, DefaultTheme } from "@react-navigation/native";

import { useAppSettings } from "@/context/AppSettingsContext";
import { getThemeColors, radius, shadowPresets, spacing, typography } from "@/theme";

export const useAppTheme = () => {
  const { theme } = useAppSettings();
  const colorScheme = theme === "Dark" ? "dark" : "light";
  const isDark = colorScheme === "dark";
  const colors = getThemeColors(colorScheme);

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
    colorScheme,
    theme,
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
