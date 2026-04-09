import { StyleSheet, TextStyle, ViewStyle } from "react-native";

import { radius, shadowPresets, spacing } from "./tokens";
import { AppThemeColors } from "./tokens";

const isLightTheme = (colors: AppThemeColors) => colors.background === "#F8FAFD";
const isDarkTheme = (colors: AppThemeColors) => colors.background === "#090B0E";

export const createScreenLayout = (colors: AppThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
  });

export const createSurfaceStyles = (colors: AppThemeColors) =>
  StyleSheet.create({
    panel: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      ...shadowPresets.card(colors),
    },
    mainPanel: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      padding: spacing.lg,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 30,
      shadowOffset: {
        width: 0,
        height: 16,
      },
      elevation: 6,
    },
    subtlePanel: {
      backgroundColor: isLightTheme(colors) ? colors.surfaceMuted : colors.surfaceSoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isLightTheme(colors) ? colors.borderStrong : colors.border,
      padding: spacing.lg,
    },
    mainSubtlePanel: {
      backgroundColor: isLightTheme(colors) ? colors.surfaceSoft : colors.surfaceSoft,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      padding: spacing.lg,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      elevation: 3,
    },
  });

export const createButtonStyles = (colors: AppThemeColors) =>
  StyleSheet.create({
    buttonBase: {
      minHeight: 50,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    primaryButton: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
      ...shadowPresets.soft(colors),
    },
    secondaryButton: {
      backgroundColor: isDarkTheme(colors) ? colors.surfaceSoft : colors.surface,
      borderColor: isDarkTheme(colors) ? colors.borderStrong : colors.border,
    },
    subtleButton: {
      backgroundColor: isDarkTheme(colors) ? colors.surfaceMuted : colors.surfaceSoft,
      borderColor: isDarkTheme(colors) ? colors.borderStrong : colors.border,
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: isDarkTheme(colors) ? colors.surfaceSoft : colors.surface,
      borderColor: isDarkTheme(colors) ? colors.borderStrong : colors.border,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      ...shadowPresets.soft(colors),
    },
  });

export const createInputStyles = (colors: AppThemeColors) =>
  StyleSheet.create({
    input: {
      minHeight: 54,
      backgroundColor: isDarkTheme(colors) ? colors.surfaceSoft : isLightTheme(colors) ? colors.surfaceSoft : colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isDarkTheme(colors) ? colors.borderStrong : isLightTheme(colors) ? colors.borderStrong : colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
  });

export const dividerStyle = (colors: AppThemeColors): ViewStyle => ({
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
});

export const textColorStyle = (
  color: string,
  extra?: TextStyle,
): TextStyle => ({
  color,
  ...(extra ?? {}),
});
