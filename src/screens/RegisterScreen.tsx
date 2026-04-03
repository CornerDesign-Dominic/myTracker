import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setError(t("auth.emailError"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordError"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordRepeatError"));
      return;
    }

    try {
      setError(null);
      await startPendingRegistration(email);
      setIsPendingModalVisible(true);
    } catch (submissionError) {
      const errorCode =
        typeof submissionError === "object" &&
        submissionError !== null &&
        "code" in submissionError &&
        typeof (submissionError as { code?: unknown }).code === "string"
          ? (submissionError as { code: string }).code
          : null;

      if (errorCode === "auth/email-already-in-use") {
        setError(t("auth.emailInUseError"));
        return;
      }

      setError(t("auth.registerError"));
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
          />

          <Text style={[typography.meta, styles.label]}>{t("auth.password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={[inputs.input, styles.input]}
          />

          <Text style={[typography.meta, styles.label]}>{t("auth.passwordRepeat")}</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={[inputs.input, styles.input]}
          />

          {error ? <Text style={[typography.secondary, styles.error]}>{error}</Text> : null}

          <Pressable style={[buttons.buttonBase, buttons.primaryButton]} onPress={handleSubmit}>
            <Text style={[typography.button, styles.primaryButtonText]}>{t("auth.registerSubmit")}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.replace("Login")}>
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
