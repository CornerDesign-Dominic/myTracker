import { StyleSheet, Text, View } from "react-native";

import { radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface StatCardProps {
  label: string;
  value: string;
  tone?: "default" | "accent";
}

export const StatCard = ({ label, value, tone = "default" }: StatCardProps) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const isAccent = tone === "accent";

  return (
    <View style={[styles.card, isAccent ? styles.accentCard : null]}>
      <Text style={[styles.label, isAccent ? styles.accentLabel : null]}>{label}</Text>
      <Text style={[styles.value, isAccent ? styles.accentValue : null]}>{value}</Text>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  accentCard: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  accentLabel: {
    color: colors.accentText,
  },
  accentValue: {
    color: colors.accentText,
  },
  });
