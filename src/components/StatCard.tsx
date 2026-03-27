import { StyleSheet, Text, View } from "react-native";

import { createSurfaceStyles, spacing } from "@/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface StatCardProps {
  label: string;
  value: string;
  tone?: "default" | "accent";
}

export const StatCard = ({ label, value, tone = "default" }: StatCardProps) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);
  const surfaces = createSurfaceStyles(colors);
  const isAccent = tone === "accent";

  return (
    <View style={[surfaces.panel, styles.card, isAccent ? styles.accentCard : null]}>
      <Text style={[typography.meta, styles.label, isAccent ? styles.accentLabel : null]}>
        {label}
      </Text>
      <Text style={[typography.metric, styles.value, isAccent ? styles.accentValue : null]}>
        {value}
      </Text>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 120,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  accentCard: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    color: colors.textSecondary,
  },
  value: {
    color: colors.textPrimary,
  },
  accentLabel: {
    color: colors.accentText,
  },
  accentValue: {
    color: colors.accentText,
  },
  });
