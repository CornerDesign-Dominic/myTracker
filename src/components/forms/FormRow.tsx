import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { radius, spacing } from "@/theme";

type FormRowProps = {
  label: string;
  value: string;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  multilineValue?: boolean;
};

export const FormRow = ({
  label,
  value,
  onPress,
  isFirst = false,
  isLast = false,
  multilineValue = false,
}: FormRowProps) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Pressable
      style={[styles.row, isFirst ? styles.rowFirst : null, isLast ? styles.rowLast : null]}
      onPress={onPress}
    >
      <Text style={[typography.body, styles.label]}>{label}</Text>
      <View style={styles.right}>
        <Text
          style={[typography.secondary, styles.value, multilineValue ? styles.valueMultiline : null]}
          numberOfLines={multilineValue ? 2 : 1}
        >
          {value}
        </Text>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    row: {
      minHeight: 60,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowFirst: {
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    },
    rowLast: {
      borderBottomWidth: 0,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
    label: {
      color: colors.textPrimary,
      flex: 1,
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexShrink: 1,
      maxWidth: "58%",
    },
    value: {
      color: colors.textSecondary,
      textAlign: "right",
      flexShrink: 1,
    },
    valueMultiline: {
      lineHeight: 20,
    },
  });
