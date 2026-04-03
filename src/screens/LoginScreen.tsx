import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { RootStackParamList } from "@/navigation/types";
import {
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  spacing,
} from "@/theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export const LoginScreen = ({ navigation }: Props) => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const styles = getStyles(colors);
  const { login, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setError(t("auth.emailError"));
      setSuccessMessage(null);
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordError"));
      setSuccessMessage(null);
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);
      await login(email, password);
      navigation.goBack();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("auth.loginError"));
    }
  };

  const handlePasswordReset = async () => {
    if (!isValidEmail(email)) {
      setError(t("auth.emailError"));
      setSuccessMessage(null);
      return;
    }

    try {
      setIsResetSubmitting(true);
      setError(null);
      await requestPasswordReset(email);
      setSuccessMessage(t("auth.passwordResetSuccess"));
    } catch (resetError) {
      const errorCode =
        typeof resetError === "object" &&
        resetError !== null &&
        "code" in resetError &&
        typeof (resetError as { code?: unknown }).code === "string"
          ? (resetError as { code: string }).code
          : null;

      if (errorCode === "auth/user-not-found") {
        setSuccessMessage(t("auth.passwordResetSuccess"));
      } else {
        setError(t("auth.passwordResetError"));
        setSuccessMessage(null);
      }
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <View style={layout.content}>
        <Text style={[typography.pageTitle, styles.title]}>{t("auth.loginTitle")}</Text>

        <View style={[surfaces.panel, styles.formCard]}>
          <Text style={[typography.meta, styles.label]}>{t("auth.email")}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[inputs.input, styles.input]}
          />

          <Text style={[typography.meta, styles.label]}>{t("auth.password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[inputs.input, styles.input]}
          />

          <Pressable
            onPress={handlePasswordReset}
            disabled={isResetSubmitting}
            style={styles.resetLinkRow}
          >
            <Text style={[typography.secondary, styles.link]}>
              {isResetSubmitting ? t("auth.passwordResetSubmit") : t("auth.passwordForgot")}
            </Text>
          </Pressable>

          {error ? <Text style={[typography.secondary, styles.error]}>{error}</Text> : null}
          {successMessage ? (
            <Text style={[typography.secondary, styles.success]}>{successMessage}</Text>
          ) : null}

          <Pressable style={[buttons.buttonBase, buttons.primaryButton]} onPress={handleSubmit}>
            <Text style={[typography.button, styles.primaryButtonText]}>{t("auth.loginSubmit")}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.replace("Register")}>
            <Text style={[typography.secondary, styles.link]}>{t("auth.loginSwitch")}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    title: {
      color: colors.textPrimary,
    },
    formCard: {
      gap: spacing.md,
    },
    label: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    input: {
      color: colors.textPrimary,
    },
    primaryButtonText: {
      color: colors.accent,
    },
    link: {
      color: colors.accent,
      textAlign: "center",
    },
    resetLinkRow: {
      alignItems: "flex-end",
      marginTop: -spacing.xs,
    },
    error: {
      color: colors.danger,
    },
    success: {
      color: colors.accent,
    },
  });
