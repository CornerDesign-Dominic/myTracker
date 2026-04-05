import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
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

type Props = NativeStackScreenProps<RootStackParamList, "ConfirmEmailLink">;

export const ConfirmEmailLinkScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const styles = getStyles(colors);
  const {
    authIsReady,
    currentUser,
    isAnonymous,
    pendingRegistration,
    confirmPendingRegistrationWithPassword,
  } = useAuth();
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = typeof route.params?.token === "string" ? route.params.token.trim() : "";

  const pendingState = useMemo(() => {
    if (!pendingRegistration) {
      return "missing" as const;
    }

    if (pendingRegistration.status === "cancelled") {
      return "cancelled" as const;
    }

    if (pendingRegistration.status === "expired") {
      return "expired" as const;
    }

    if (new Date(pendingRegistration.expiresAt).getTime() <= Date.now()) {
      return "expired" as const;
    }

    return pendingRegistration.status;
  }, [pendingRegistration]);

  const handleSubmit = async () => {
    console.log("[AuthDebug] ConfirmEmailLinkScreen:submit", {
      hasToken: token.length > 0,
      pendingStatus: pendingRegistration?.status ?? null,
      uid: currentUser?.uid ?? null,
      isAnonymous,
      passwordLength: password.length,
      repeatLength: passwordRepeat.length,
    });

    if (!token) {
      setError(t("auth.confirmLinkInvalidDescription"));
      return;
    }

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
      await confirmPendingRegistrationWithPassword(token, password);
      navigation.reset({
        index: 1,
        routes: [
          { name: "Tabs" },
          { name: "Settings" },
        ],
      });
    } catch (submissionError) {
      const errorCode =
        typeof submissionError === "object" &&
        submissionError !== null &&
        "code" in submissionError &&
        typeof (submissionError as { code?: unknown }).code === "string"
          ? (submissionError as { code: string }).code
          : null;

      console.log("[AuthDebug] ConfirmEmailLinkScreen:submit:error", {
        code: errorCode,
        message: submissionError instanceof Error ? submissionError.message : String(submissionError),
      });

      if (
        errorCode === "registration-session-mismatch" ||
        errorCode === "registration-token-mismatch" ||
        errorCode === "registration-not-pending"
      ) {
        setError(t("auth.confirmLinkSessionMismatchDescription"));
      } else if (
        errorCode === "pending-registration-expired" ||
        errorCode === "invalid-registration-token"
      ) {
        setError(t("auth.confirmLinkExpiredDescription"));
      } else if (errorCode === "auth/email-already-in-use") {
        setError(t("auth.emailInUseError"));
      } else {
        setError(t("auth.confirmLinkGenericError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBody = () => {
    if (!authIsReady) {
      return (
        <View style={styles.centeredState}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[typography.secondary, styles.bodyText]}>{t("common.loading")}</Text>
        </View>
      );
    }

    if (!token) {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("auth.confirmLinkInvalidTitle")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.confirmLinkInvalidDescription")}
          </Text>
        </View>
      );
    }

    if (!isAnonymous) {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("auth.confirmLinkAlreadyLinkedTitle")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.confirmLinkAlreadyLinkedDescription")}
          </Text>
          <Pressable
            style={[buttons.buttonBase, buttons.primaryButton]}
            onPress={() => navigation.reset({ index: 1, routes: [{ name: "Tabs" }, { name: "Settings" }] })}
          >
            <Text style={[typography.button, styles.primaryButtonText]}>{t("common.okay")}</Text>
          </Pressable>
        </View>
      );
    }

    if (pendingState === "expired") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("auth.confirmLinkExpiredTitle")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.confirmLinkExpiredDescription")}
          </Text>
        </View>
      );
    }

    if (pendingState === "cancelled") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("auth.confirmLinkCancelledTitle")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.confirmLinkCancelledDescription")}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.stack}>
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("auth.confirmLinkTitle")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>{t("auth.confirmLinkDescription")}</Text>
        </View>
        {pendingRegistration?.pendingEmail ? (
          <View style={styles.emailCard}>
            <Text style={[typography.meta, styles.emailLabel]}>{t("auth.email")}</Text>
            <Text style={[typography.body, styles.emailValue]}>{pendingRegistration.pendingEmail}</Text>
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
            editable={!isSubmitting}
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
            editable={!isSubmitting}
          />
        </View>
        <Text style={[typography.meta, styles.hintText]}>{t("auth.confirmLinkHint")}</Text>
        {error ? <Text style={[typography.secondary, styles.errorText]}>{error}</Text> : null}
        <Pressable
          style={[
            buttons.buttonBase,
            buttons.primaryButton,
            isSubmitting ? styles.primaryButtonDisabled : null,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Text style={[typography.button, styles.primaryButtonText]}>
              {t("auth.confirmLinkSubmit")}
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
