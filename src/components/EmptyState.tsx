import { StyleSheet, Text, View } from "react-native";

import { createSurfaceStyles, spacing } from "@/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);
  const surfaces = createSurfaceStyles(colors);

  return (
    <View style={[surfaces.subtlePanel, styles.container]}>
      <Text style={[typography.cardTitle, styles.title]}>{title}</Text>
      <Text style={[typography.secondary, styles.description]}>{description}</Text>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
  },
  description: {
    color: colors.textSecondary,
  },
  });
