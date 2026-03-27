import { StyleSheet, Text, TextInput, View } from "react-native";

import { createInputStyles, spacing } from "@/theme";
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
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);
  const inputs = createInputStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={[typography.secondary, styles.label]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[inputs.input, styles.input, multiline ? styles.multilineInput : null]}
      />
      {helpText ? <Text style={[typography.meta, styles.helpText]}>{helpText}</Text> : null}
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
  input: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  helpText: {
    color: colors.textSecondary,
  },
  });
