import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, spacing } from "@/constants/theme";
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
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrapper}>
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <Pressable
              key={option.value}
              style={[styles.option, isActive ? styles.activeOption : null]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.optionLabel, isActive ? styles.activeOptionLabel : null]}>
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
    fontSize: 14,
    fontWeight: "600",
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
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  activeOption: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  activeOptionLabel: {
    color: colors.accentText,
  },
  });
