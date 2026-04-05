import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

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

type Props = NativeStackScreenProps<RootStackParamList, "Account">;

export const AccountScreen = ({ navigation }: Props) => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const styles = getStyles(colors);
  const {
    currentUser,
    isAnonymous,
    pendingRegistration,
    changePassword,
    completePendingRegistration,
    logout,
  } = useAuth();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [isPasswordChangedModalVisible, setIsPasswordChangedModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [nextPasswordRepeat, setNextPasswordRepeat] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const hasConfirmedPendingRegistration =
    isAnonymous && pendingRegistration?.status === "confirmed";
  const email =
    currentUser?.email ??
    (hasConfirmedPendingRegistration ? pendingRegistration?.pendingEmail ?? "" : "");

  const closeChangePasswordModal = () => {
    if (isChangingPassword) {
      return;
    }

    setIsChangePasswordModalVisible(false);
    setCurrentPassword("");
    setNextPassword("");
    setNextPasswordRepeat("");
    setPasswordError(null);
  };

  const handleChangePassword = async () => {
    if (!email) {
      setPasswordError(t("settings.accountChangePasswordError"));
      return;
    }

    if (!hasConfirmedPendingRegistration && currentPassword.length < 6) {
      setPasswordError(t("settings.accountCurrentPasswordError"));
      return;
    }

    if (nextPassword.length < 6) {
      setPasswordError(t("auth.passwordError"));
      return;
    }

    if (nextPassword !== nextPasswordRepeat) {
      setPasswordError(t("auth.passwordRepeatError"));
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError(null);
      if (hasConfirmedPendingRegistration) {
        await completePendingRegistration(nextPassword);
      } else {
        await changePassword(currentPassword, nextPassword);
      }
      closeChangePasswordModal();
      setIsPasswordChangedModalVisible(true);
    } catch (error) {
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : null;

      if (errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password") {
        setPasswordError(t("settings.accountCurrentPasswordWrong"));
      } else if (errorCode === "pending-registration-not-confirmed") {
        setPasswordError(t("settings.pendingFinalizeNotConfirmed"));
      } else if (errorCode === "pending-registration-expired") {
        setPasswordError(t("settings.pendingExpiredDescription"));
      } else if (errorCode === "auth/weak-password") {
        setPasswordError(t("auth.passwordError"));
      } else {
        setPasswordError(
          hasConfirmedPendingRegistration
            ? t("settings.pendingFinalizeError")
            : t("settings.accountChangePasswordError"),
        );
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsLogoutModalVisible(false);
      navigation.goBack();
    } catch {
      Alert.alert(t("common.actionFailed"), t("common.actionFailed"));
    }
  };

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={layout.content} showsVerticalScrollIndicator={false}>
        <View style={[surfaces.mainPanel, styles.primaryCard]}>
          <Text style={[typography.cardTitle, styles.sectionTitle]}>
            {t("settings.accountEmailTitle")}
          </Text>
          <Text style={[typography.body, styles.emailValue]}>{email || t("common.none")}</Text>
          <View style={styles.verifiedRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
            <Text style={[typography.meta, styles.verifiedLabel]}>
              {t("settings.accountEmailConfirmed")}
            </Text>
          </View>
        </View>

        <View style={[surfaces.panel, styles.secondaryCard]}>
          <Text style={[typography.cardTitle, styles.sectionTitle]}>
            {t("settings.accountPasswordTitle")}
          </Text>
          <Text style={[typography.secondary, styles.hintText]}>
            {hasConfirmedPendingRegistration
              ? t("settings.accountPasswordPendingDescription")
              : t("settings.accountPasswordSetDescription")}
          </Text>
          <View style={styles.primaryActionWrap}>
            <Pressable
              style={[buttons.buttonBase, buttons.primaryButton]}
              onPress={() => setIsChangePasswordModalVisible(true)}
              disabled={!email}
            >
              <Text style={[typography.button, styles.primaryButtonText]}>
                {hasConfirmedPendingRegistration
                  ? t("settings.pendingFinalizeAction")
                  : t("settings.accountChangePasswordAction")}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[buttons.buttonBase, buttons.secondaryButton, styles.logoutButton]}
          onPress={() => setIsLogoutModalVisible(true)}
        >
          <Text style={[typography.button, styles.secondaryButtonText]}>
            {t("settings.logoutAction")}
          </Text>
        </Pressable>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isLogoutModalVisible}
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsLogoutModalVisible(false)} />
          <View style={[surfaces.panel, styles.confirmationSheet]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.cardTitle, styles.modalTitle]}>{t("settings.logoutModalTitle")}</Text>
              <Pressable onPress={() => setIsLogoutModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[typography.secondary, styles.modalText]}>
              {t("settings.logoutModalDescriptionLinked")}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[buttons.buttonBase, buttons.secondaryButton, styles.modalButton]}
                onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={[typography.button, styles.secondaryButtonText]}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                style={[buttons.buttonBase, buttons.primaryButton, styles.modalButton]}
                onPress={handleLogout}
              >
                <Text style={[typography.button, styles.primaryButtonText]}>{t("settings.logoutModalConfirm")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isChangePasswordModalVisible}
        onRequestClose={closeChangePasswordModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeChangePasswordModal} />
          <View style={[surfaces.panel, styles.confirmationSheet]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.cardTitle, styles.modalTitle]}>
                {hasConfirmedPendingRegistration
                  ? t("settings.pendingFinalizeTitle")
                  : t("settings.accountChangePasswordTitle")}
              </Text>
              <Pressable onPress={closeChangePasswordModal} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[typography.secondary, styles.modalText]}>
              {hasConfirmedPendingRegistration
                ? t("settings.pendingFinalizeDescription")
                : t("settings.accountChangePasswordModalHint")}
            </Text>
            <View style={styles.passwordForm}>
              {!hasConfirmedPendingRegistration ? (
                <>
                  <Text style={[typography.meta, styles.inputLabel]}>
                    {t("settings.accountCurrentPasswordLabel")}
                  </Text>
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    style={[inputs.input, styles.input]}
                  />
                </>
              ) : null}
              <Text style={[typography.meta, styles.inputLabel]}>{t("settings.accountNewPasswordLabel")}</Text>
              <TextInput
                value={nextPassword}
                onChangeText={setNextPassword}
                secureTextEntry
                autoCapitalize="none"
                style={[inputs.input, styles.input]}
              />
              <Text style={[typography.meta, styles.inputLabel]}>
                {t("settings.accountNewPasswordRepeatLabel")}
              </Text>
              <TextInput
                value={nextPasswordRepeat}
                onChangeText={setNextPasswordRepeat}
                secureTextEntry
                autoCapitalize="none"
                style={[inputs.input, styles.input]}
              />
              {passwordError ? (
                <Text style={[typography.secondary, styles.errorText]}>{passwordError}</Text>
              ) : null}
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[buttons.buttonBase, buttons.secondaryButton, styles.modalButton]}
                onPress={closeChangePasswordModal}
                disabled={isChangingPassword}
              >
                <Text style={[typography.button, styles.secondaryButtonText]}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                style={[buttons.buttonBase, buttons.primaryButton, styles.modalButton]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                <Text style={[typography.button, styles.primaryButtonText]}>
                  {hasConfirmedPendingRegistration
                    ? t("settings.pendingFinalizeSubmit")
                    : t("settings.accountChangePasswordConfirm")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isPasswordChangedModalVisible}
        onRequestClose={() => setIsPasswordChangedModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsPasswordChangedModalVisible(false)}
          />
          <View style={[surfaces.panel, styles.successSheet]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.cardTitle, styles.modalTitle]}>
                {t("settings.accountChangePasswordTitle")}
              </Text>
              <Pressable onPress={() => setIsPasswordChangedModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.successLead}>
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark" size={18} color={colors.accent} />
              </View>
              <Text style={[typography.secondary, styles.modalText]}>
                {t("settings.accountPasswordChangedSuccess")}
              </Text>
            </View>
            <Pressable
              style={[buttons.buttonBase, buttons.primaryButton]}
              onPress={() => setIsPasswordChangedModalVisible(false)}
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
    primaryCard: {
      gap: spacing.md,
    },
    secondaryCard: {
      gap: spacing.md,
    },
    sectionTitle: {
      color: colors.textPrimary,
    },
    emailValue: {
      color: colors.textPrimary,
    },
    verifiedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    verifiedLabel: {
      color: colors.accent,
      textTransform: "uppercase",
    },
    hintText: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    primaryActionWrap: {
      paddingTop: spacing.xs,
    },
    logoutButton: {
      marginTop: spacing.lg,
    },
    inputLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    input: {
      color: colors.textPrimary,
    },
    passwordForm: {
      gap: spacing.xs,
    },
    primaryButtonText: {
      color: colors.accent,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.overlay,
      padding: spacing.lg,
    },
    confirmationSheet: {
      gap: spacing.lg,
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
      borderRadius: radius.lg,
    },
    successSheet: {
      gap: spacing.lg,
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
    modalTitle: {
      color: colors.textPrimary,
    },
    modalText: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    successLead: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    successIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    modalActions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    modalButton: {
      flex: 1,
    },
    errorText: {
      color: colors.danger,
    },
  });
