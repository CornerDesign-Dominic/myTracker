import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { verifyPasswordResetCode } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { firebaseAuth, hasRequiredFirebaseConfig } from "@/firebase/config";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import type { RootStackParamList } from "@/navigation/types";
import {
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  radius,
  spacing,
} from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "ResetPasswordLink">;

type ResetState = "checking" | "ready" | "invalid" | "expired" | "success";

export const ResetPasswordLinkScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const { completePasswordReset } = useAuth();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const styles = getStyles(colors);
  const [state, setState] = useState<ResetState>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const oobCode = typeof route.params?.oobCode === "string" ? route.params.oobCode.trim() : "";

  useEffect(() => {
    const run = async () => {
      if (!hasRequiredFirebaseConfig || !firebaseAuth) {
        setState("invalid");
        return;
      }

      if (!oobCode) {
        setState("invalid");
        return;
      }

      try {
        const resolvedEmail = await verifyPasswordResetCode(firebaseAuth, oobCode);
        setEmail(resolvedEmail);
        setState("ready");
      } catch (verificationError) {
        const errorCode =
          typeof verificationError === "object" &&
          verificationError !== null &&
          "code" in verificationError &&
          typeof (verificationError as { code?: unknown }).code === "string"
            ? (verificationError as { code: string }).code
            : null;

        if (errorCode === "auth/expired-action-code" || errorCode === "auth/invalid-action-code") {
          setState(errorCode === "auth/expired-action-code" ? "expired" : "invalid");
        } else {
          setState("invalid");
        }
      }
    };

    run().catch(() => setState("invalid"));
  }, [oobCode]);

  const canSubmit = useMemo(
    () => state === "ready" && !isSubmitting,
    [isSubmitting, state],
  );

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError(t("auth.passwordError"));
      return;
    }

    if (password !== passwordRepeat) {
      setError(t("auth.passwordRepeatError"));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await completePasswordReset(oobCode, password);
      setState("success");
    } catch (submissionError) {
      const errorCode =
        typeof submissionError === "object" &&
        submissionError !== null &&
        "code" in submissionError &&
        typeof (submissionError as { code?: unknown }).code === "string"
          ? (submissionError as { code: string }).code
          : null;

      if (errorCode === "auth/expired-action-code") {
        setState("expired");
      } else if (errorCode === "auth/invalid-action-code") {
        setState("invalid");
      } else if (errorCode === "auth/weak-password") {
        setError(t("auth.passwordError"));
      } else {
        setError(t("auth.passwordResetScreenGenericError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBody = () => {
    if (state === "checking") {
      return (
        <View style={styles.centeredState}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.passwordResetScreenChecking")}
          </Text>
        </View>
      );
    }

    if (state === "invalid") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>
            {t("auth.passwordResetScreenInvalidTitle")}
          </Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.passwordResetScreenInvalidDescription")}
          </Text>
        </View>
      );
    }

    if (state === "expired") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>
            {t("auth.passwordResetScreenExpiredTitle")}
          </Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.passwordResetScreenExpiredDescription")}
          </Text>
        </View>
      );
    }

    if (state === "success") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>
            {t("auth.passwordResetScreenSuccessTitle")}
          </Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.passwordResetScreenSuccessDescription")}
          </Text>
          <Pressable
            style={[buttons.buttonBase, buttons.primaryButton]}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: "Tabs", params: { screen: "Home" } }] })}
          >
            <Text style={[typography.button, styles.primaryButtonText]}>{t("common.okay")}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stack}>
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>
            {t("auth.passwordResetScreenTitle")}
          </Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.passwordResetScreenDescription")}
          </Text>
        </View>
        {email ? (
          <View style={styles.emailCard}>
            <Text style={[typography.meta, styles.emailLabel]}>
              {t("auth.passwordResetScreenEmailLabel")}
            </Text>
            <Text style={[typography.body, styles.emailValue]}>{email}</Text>
          </View>
        ) : null}
        <View style={styles.stack}>
          <Text style={[typography.meta, styles.inputLabel]}>{t("auth.password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={[inputs.input, styles.input]}
            editable={canSubmit}
          />
        </View>
        <View style={styles.stack}>
          <Text style={[typography.meta, styles.inputLabel]}>{t("auth.passwordRepeat")}</Text>
          <TextInput
            value={passwordRepeat}
            onChangeText={setPasswordRepeat}
            secureTextEntry
            autoCapitalize="none"
            style={[inputs.input, styles.input]}
            editable={canSubmit}
          />
        </View>
        <Text style={[typography.meta, styles.hintText]}>{t("auth.passwordResetScreenHint")}</Text>
        {error ? <Text style={[typography.secondary, styles.errorText]}>{error}</Text> : null}
        <Pressable
          style={[buttons.buttonBase, buttons.primaryButton, !canSubmit ? styles.primaryButtonDisabled : null]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[typography.button, styles.primaryButtonText]}>
              {t("auth.passwordResetScreenSubmit")}
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={layout.screen}>
      <View style={[layout.content, { justifyContent: "center" }]}>
        <View style={[surfaces.mainPanel, styles.panel]}>{renderBody()}</View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    panel: {
      gap: spacing.md,
      width: "100%",
      maxWidth: 460,
      alignSelf: "center",
      borderRadius: radius.lg,
    },
    stack: {
      gap: spacing.sm,
    },
    centeredState: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    titleText: {
      color: colors.textPrimary,
    },
    bodyText: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    emailCard: {
      gap: spacing.xxs,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    emailLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    emailValue: {
      color: colors.textPrimary,
    },
    inputLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    input: {
      color: colors.textPrimary,
    },
    hintText: {
      color: colors.textMuted,
      lineHeight: 20,
    },
    errorText: {
      color: colors.danger,
      lineHeight: 21,
    },
    primaryButtonText: {
      color: colors.accent,
    },
    primaryButtonDisabled: {
      opacity: 0.72,
    },
  });
