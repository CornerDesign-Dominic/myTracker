import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing } from "@/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<SegmentedOption<T>>;
}

export const SegmentedField = <T extends string>({
  label,
  value,
  onChange,
  options,
}: SegmentedFieldProps<T>) => {
  const { colors, typography, shadows } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={[typography.secondary, styles.label]}>{label}</Text>
      <View style={styles.wrapper}>
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <Pressable
              key={option.value}
              style={[
                styles.option,
                isActive ? [styles.activeOption, shadows.soft] : null,
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text
                style={[
                  typography.button,
                  styles.optionLabel,
                  isActive ? styles.activeOptionLabel : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textPrimary,
  },
  wrapper: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  option: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  activeOption: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  optionLabel: {
    color: colors.textPrimary,
  },
  activeOptionLabel: {
    color: colors.accent,
  },
  });
