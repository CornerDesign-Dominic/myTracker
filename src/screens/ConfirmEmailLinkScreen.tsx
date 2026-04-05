import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
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

type LinkState =
  | "checking"
  | "ready"
  | "invalid"
  | "expired"
  | "session-mismatch"
  | "cancelled"
  | "already-linked"
  | "error";

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
    confirmPendingRegistrationLink,
    completePendingRegistration,
  } = useAuth();
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isConfirmingLink, setIsConfirmingLink] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);
  const token = typeof route.params?.token === "string" ? route.params.token.trim() : "";

  useEffect(() => {
    if (!authIsReady) {
      return;
    }

    if (!token) {
      setLinkState("invalid");
      return;
    }

    if (!isAnonymous) {
      setLinkState("already-linked");
      return;
    }

    let isActive = true;

    const confirmLink = async () => {
      try {
        setIsConfirmingLink(true);
        setError(null);
        const result = await confirmPendingRegistrationLink(token);

        if (!isActive) {
          return;
        }

        setConfirmedEmail(result.email);
        setLinkState("ready");
      } catch (confirmationError) {
        if (!isActive) {
          return;
        }

        const errorCode =
          typeof confirmationError === "object" &&
          confirmationError !== null &&
          "code" in confirmationError &&
          typeof (confirmationError as { code?: unknown }).code === "string"
            ? (confirmationError as { code: string }).code
            : null;

        if (
          errorCode === "registration-session-mismatch" ||
          errorCode === "registration-token-mismatch" ||
          errorCode === "registration-not-pending"
        ) {
          setLinkState("session-mismatch");
        } else if (
          errorCode === "pending-registration-expired" ||
          errorCode === "invalid-registration-token"
        ) {
          setLinkState("expired");
        } else if (errorCode === "registration-cancelled") {
          setLinkState("cancelled");
        } else {
          setLinkState("error");
          setError(t("auth.confirmLinkGenericError"));
        }
      } finally {
        if (isActive) {
          setIsConfirmingLink(false);
        }
      }
    };

    confirmLink();

    return () => {
      isActive = false;
    };
  }, [authIsReady, confirmPendingRegistrationLink, isAnonymous, t, token]);

  const canSubmit = useMemo(
    () => linkState === "ready" && !isSubmittingPassword && !isConfirmingLink,
    [isConfirmingLink, isSubmittingPassword, linkState],
  );

  const handleSubmit = async () => {
    console.log("[AuthDebug] ConfirmEmailLinkScreen:submit", {
      tokenLength: token.length,
      linkState,
      confirmedEmail,
      uid: currentUser?.uid ?? null,
      isAnonymous,
      passwordLength: password.length,
      repeatLength: passwordRepeat.length,
    });

    if (password.length < 6) {
      setError(t("auth.passwordError"));
      return;
    }

    if (password !== passwordRepeat) {
      setError(t("auth.passwordRepeatError"));
      return;
    }

    try {
      setIsSubmittingPassword(true);
      setError(null);
      await completePendingRegistration(password);
      navigation.reset({
        index: 1,
        routes: [{ name: "Tabs" }, { name: "Settings" }],
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

      if (errorCode === "auth/email-already-in-use") {
        setError(t("auth.emailInUseError"));
      } else if (errorCode === "pending-registration-expired") {
        setError(t("auth.confirmLinkExpiredDescription"));
      } else if (errorCode === "pending-registration-not-confirmed") {
        setError(t("settings.pendingFinalizeNotConfirmed"));
      } else {
        setError(t("auth.confirmLinkGenericError"));
      }
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const renderBody = () => {
    if (!authIsReady || isConfirmingLink || linkState === "checking") {
      return (
        <View style={styles.centeredState}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.confirmLinkOpeningApp")}
          </Text>
        </View>
      );
    }

    if (linkState === "invalid") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("auth.confirmLinkInvalidTitle")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.confirmLinkInvalidDescription")}
          </Text>
        </View>
      );
    }

    if (linkState === "already-linked") {
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

    if (linkState === "expired") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("auth.confirmLinkExpiredTitle")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.confirmLinkExpiredDescription")}
          </Text>
        </View>
      );
    }

    if (linkState === "cancelled") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("auth.confirmLinkCancelledTitle")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.confirmLinkCancelledDescription")}
          </Text>
        </View>
      );
    }

    if (linkState === "session-mismatch") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("auth.confirmLinkSessionMismatchTitle")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {t("auth.confirmLinkSessionMismatchDescription")}
          </Text>
        </View>
      );
    }

    if (linkState === "error") {
      return (
        <View style={styles.stack}>
          <Text style={[typography.cardTitle, styles.titleText]}>{t("common.actionFailed")}</Text>
          <Text style={[typography.secondary, styles.bodyText]}>
            {error ?? t("auth.confirmLinkGenericError")}
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
        {confirmedEmail ? (
          <View style={styles.emailCard}>
            <Text style={[typography.meta, styles.emailLabel]}>{t("auth.email")}</Text>
            <Text style={[typography.body, styles.emailValue]}>{confirmedEmail}</Text>
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
        <Text style={[typography.meta, styles.hintText]}>{t("auth.confirmLinkHint")}</Text>
        {error ? <Text style={[typography.secondary, styles.errorText]}>{error}</Text> : null}
        <Pressable
          style={[
            buttons.buttonBase,
            buttons.primaryButton,
            !canSubmit ? styles.primaryButtonDisabled : null,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmittingPassword ? (
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
