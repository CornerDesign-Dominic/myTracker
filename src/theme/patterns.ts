import { StyleSheet, TextStyle, ViewStyle } from "react-native";

import { radius, shadowPresets, spacing } from "./tokens";
import { AppThemeColors } from "./tokens";

const isLightTheme = (colors: AppThemeColors) => colors.background === "#F8FAFD";

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
      borderWidth: 1,
      borderColor: colors.borderStrong,
      padding: spacing.lg,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 26,
      shadowOffset: {
        width: 0,
        height: 14,
      },
      elevation: 5,
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
      borderWidth: 1,
      borderColor: colors.borderStrong,
      padding: spacing.lg,
      ...shadowPresets.soft(colors),
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
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    subtleButton: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderColor: colors.border,
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
      backgroundColor: isLightTheme(colors) ? colors.surfaceSoft : colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: isLightTheme(colors) ? colors.borderStrong : colors.border,
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
