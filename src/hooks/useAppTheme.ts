import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from "react-native";

import { getThemeColors } from "@/constants/theme";

export const useAppTheme = () => {
  const colorScheme = useColorScheme();
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
    isDark,
    colors,
    navigationTheme,
    statusBarStyle: isDark ? "light" : "dark",
  } as const;
};
