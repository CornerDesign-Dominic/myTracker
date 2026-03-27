import { StyleSheet, Text, TextInput, View } from "react-native";

import { radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  helpText?: string;
}

export const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  helpText,
}: FormFieldProps) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline ? styles.multilineInput : null]}
      />
      {helpText ? <Text style={styles.helpText}>{helpText}</Text> : null}
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
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  });
