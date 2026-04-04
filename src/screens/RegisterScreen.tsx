import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
  radius,
  spacing,
} from "@/theme";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export const RegisterScreen = ({ navigation }: Props) => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const styles = getStyles(colors);
  const { startPendingRegistration } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async () => {
    console.log("[AuthDebug] RegisterScreen:submit", { email: email.trim() });

    if (!isValidEmail(email)) {
      console.log("[AuthDebug] RegisterScreen:submit:invalid-email", { email: email.trim() });
      setError(t("auth.emailError"));
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await startPendingRegistration(email);
      console.log("[AuthDebug] RegisterScreen:submit:success", { email: email.trim() });
      setIsPendingModalVisible(true);
    } catch (submissionError) {
      const errorCode =
        typeof submissionError === "object" &&
        submissionError !== null &&
        "code" in submissionError &&
        typeof (submissionError as { code?: unknown }).code === "string"
          ? (submissionError as { code: string }).code
          : null;
      const errorStatus =
        typeof submissionError === "object" &&
        submissionError !== null &&
        "status" in submissionError &&
        typeof (submissionError as { status?: unknown }).status === "number"
          ? (submissionError as { status: number }).status
          : null;
      const errorBody =
        typeof submissionError === "object" &&
        submissionError !== null &&
        "body" in submissionError &&
        typeof (submissionError as { body?: unknown }).body === "string"
          ? (submissionError as { body: string }).body
          : null;

      if (errorCode === "auth/email-already-in-use") {
        console.log("[AuthDebug] RegisterScreen:submit:email-in-use", { email: email.trim() });
        setError(t("auth.emailInUseError"));
        return;
      }

      console.log("[AuthDebug] RegisterScreen:submit:error", {
        email: email.trim(),
        code: errorCode,
        status: errorStatus,
        body: errorBody,
        message: submissionError instanceof Error ? submissionError.message : String(submissionError),
      });
      setError(errorCode ? `${t("auth.registerError")} (${errorCode})` : t("auth.registerError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <View style={layout.content}>
        <Text style={[typography.pageTitle, styles.title]}>{t("auth.registerTitle")}</Text>

        <View style={[surfaces.panel, styles.formCard]}>
          <Text style={[typography.meta, styles.label]}>{t("auth.email")}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[inputs.input, styles.input]}
            editable={!isSubmitting}
          />
          {error ? <Text style={[typography.secondary, styles.error]}>{error}</Text> : null}

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
              <Text style={[typography.button, styles.primaryButtonText]}>{t("auth.registerSubmit")}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => navigation.replace("Login")} disabled={isSubmitting}>
            <Text style={[typography.secondary, styles.link]}>{t("auth.registerSwitch")}</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isPendingModalVisible}
        onRequestClose={() => setIsPendingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsPendingModalVisible(false)} />
          <View style={[surfaces.panel, styles.pendingModal]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.cardTitle, styles.title]}>{t("auth.pendingModalTitle")}</Text>
              <Pressable onPress={() => setIsPendingModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[typography.secondary, styles.pendingText]}>
              {t("auth.pendingModalDescription")}
            </Text>
            <Text style={[typography.secondary, styles.pendingHint]}>
              {t("auth.pendingModalBackendHint")}
            </Text>
            <Pressable
              style={[buttons.buttonBase, buttons.primaryButton]}
              onPress={() => {
                setIsPendingModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={[typography.button, styles.primaryButtonText]}>{t("common.okay")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    primaryButtonDisabled: {
      opacity: 0.72,
    },
    link: {
      color: colors.accent,
      textAlign: "center",
    },
    error: {
      color: colors.danger,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.overlay,
      padding: spacing.lg,
    },
    pendingModal: {
      gap: spacing.md,
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
      borderRadius: radius.lg,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    pendingText: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    pendingHint: {
      color: colors.textMuted,
      lineHeight: 20,
    },
  });
