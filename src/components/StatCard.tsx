import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

interface StatCardProps {
  label: string;
  value: string;
  tone?: "default" | "accent";
}

export const StatCard = ({ label, value, tone = "default" }: StatCardProps) => {
  const isAccent = tone === "accent";

  return (
    <View style={[styles.card, isAccent ? styles.accentCard : null]}>
      <Text style={[styles.label, isAccent ? styles.accentLabel : null]}>{label}</Text>
      <Text style={[styles.value, isAccent ? styles.accentValue : null]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  accentLabel: {
    color: "#DBF1E9",
  },
  accentValue: {
    color: "#FFFFFF",
  },
});
