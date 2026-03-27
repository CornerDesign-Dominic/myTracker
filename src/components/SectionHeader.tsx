import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <Text style={[typography.sectionTitle, styles.title]}>{title}</Text>
        {subtitle ? <Text style={[typography.secondary, styles.subtitle]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
  },
  });
