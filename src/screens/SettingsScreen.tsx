import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import { usePurchases } from "@/context/PurchaseContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { RootStackParamList } from "@/navigation/types";
import { FREE_ACCENT_COLOR } from "@/services/purchases/constants";
import { canUseAccentColor } from "@/services/purchases/entitlements";
import {
  accentColorOptions,
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  getAccentPalette,
  radius,
  spacing,
} from "@/theme";
import { AccentColor } from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const OptionGroup = <T extends string>({
  title,
  value,
  options,
  formatLabel,
  onChange,
}: {
  title: string;
  value: T;
  options: readonly T[];
  formatLabel?: (value: T) => string;
  onChange: (value: T) => void;
}) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);
  const surfaces = createSurfaceStyles(colors);
  const getLabel = formatLabel ?? ((option: T) => String(option));

  return (
    <View style={[surfaces.panel, styles.groupCard]}>
      <Text style={[typography.cardTitle, styles.groupTitle]}>{title}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const isActive = option === value;

          return (
            <Pressable
              key={option}
              style={[styles.optionButton, isActive ? styles.optionButtonActive : null]}
              onPress={() => onChange(option)}
            >
              <Text style={[typography.button, styles.optionText, isActive ? styles.optionTextActive : null]}>
                {getLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const SettingsScreen = ({ navigation }: Props) => {
  const { colors, typography, mode } = useAppTheme();
  const { language: uiLanguage, t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const {
    language,
    currency,
    theme,
    accentColor,
    setLanguage,
    setCurrency,
    setTheme,
    setAccentColor,
  } = useAppSettings();
  const {
    currentUser,
    isAnonymous,
    pendingRegistration,
    resendPendingRegistration,
    cancelPendingRegistration,
    completePendingRegistration,
  } = useAuth();
  const {
    hasSupportColors,
    isPremium,
    isPurchasing,
    isRefreshing,
    isStoreConnected,
    purchaseError,
    supportColorsProduct,
    purchaseSupportColors,
    restorePurchases,
    clearPurchaseError,
  } = usePurchases();
  const [isPremiumModalVisible, setIsPremiumModalVisible] = useState(false);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [isCompleteRegistrationModalVisible, setIsCompleteRegistrationModalVisible] = useState(false);
  const [completionPassword, setCompletionPassword] = useState("");
  const [completionPasswordRepeat, setCompletionPasswordRepeat] = useState("");
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [isCompletingRegistration, setIsCompletingRegistration] = useState(false);
  const [isResendingPendingRegistration, setIsResendingPendingRegistration] = useState(false);
  const supportColorsPrice = supportColorsProduct?.displayPrice ?? null;
  const hasLockedAccents = !hasSupportColors;
  const pendingRegistrationState = useMemo(() => {
    if (!isAnonymous || !pendingRegistration) {
      return "idle" as const;
    }

    if (pendingRegistration.status === "confirmed") {
      return "confirmed" as const;
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

    return "pending" as const;
  }, [isAnonymous, pendingRegistration]);
  const hasPendingRegistration = pendingRegistrationState === "pending";
  const hasConfirmedRegistration = pendingRegistrationState === "confirmed";
  const pendingRegistrationExpiresLabel = useMemo(() => {
    if (!pendingRegistration?.expiresAt) {
      return null;
    }

    return new Intl.DateTimeFormat(uiLanguage === "de" ? "de-DE" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(pendingRegistration.expiresAt));
  }, [pendingRegistration?.expiresAt, uiLanguage]);
  const purchaseMessage = useMemo(() => {
    if (!purchaseError) {
      return null;
    }

    if (purchaseError === "cancelled") {
      return t("settings.purchaseCancelled");
    }

    return purchaseError;
  }, [purchaseError, t]);

  useEffect(() => {
    if (!isPremiumModalVisible) {
      clearPurchaseError();
    }
  }, [clearPurchaseError, isPremiumModalVisible]);

  useEffect(() => {
    if (hasSupportColors) {
      setIsPremiumModalVisible(false);
    }
  }, [hasSupportColors]);

  useEffect(() => {
    if (pendingRegistrationState !== "pending") {
      setIsResendingPendingRegistration(false);
    }
  }, [pendingRegistrationState]);

  const openPremiumModal = () => {
    clearPurchaseError();
    setIsPremiumModalVisible(true);
  };

  const closePremiumModal = () => {
    if (isPurchasing || isRefreshing) {
      return;
    }

    setIsPremiumModalVisible(false);
  };

  const handleAccentPress = (option: AccentColor) => {
    if (!canUseAccentColor(option, hasSupportColors)) {
      openPremiumModal();
      return;
    }

    setAccentColor(option);
  };

  const handlePurchase = async () => {
    try {
      await purchaseSupportColors();
    } catch {
      // Error state is handled inside the purchase context.
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
    } catch {
      // Error state is handled inside the purchase context.
    }
  };

  const handleResendPendingRegistration = async () => {
    console.log("[AuthDebug] SettingsScreen:pending:resend:tap", {
      email: pendingRegistration?.pendingEmail ?? null,
      status: pendingRegistration?.status ?? null,
    });

    if (pendingRegistrationState !== "pending") {
      console.log("[AuthDebug] SettingsScreen:pending:resend:ignored-non-pending", {
        email: pendingRegistration?.pendingEmail ?? null,
        state: pendingRegistrationState,
      });
      return;
    }

    try {
      setIsResendingPendingRegistration(true);
      const resendResult = await resendPendingRegistration();
      console.log("[AuthDebug] SettingsScreen:pending:resend:success", {
        email: pendingRegistration?.pendingEmail ?? null,
        result: resendResult,
      });

      if (resendResult === "resent") {
        Alert.alert(t("settings.pendingStatusTitle"), t("settings.pendingResendQueued"));
      } else if (resendResult === "confirmed") {
        Alert.alert(t("settings.pendingConfirmedTitle"), t("settings.pendingConfirmedDescription"));
      }
    } catch (error) {
      console.log("[AuthDebug] SettingsScreen:pending:resend:error", {
        email: pendingRegistration?.pendingEmail ?? null,
        code:
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof (error as { code?: unknown }).code === "string"
            ? (error as { code: string }).code
            : null,
        message: error instanceof Error ? error.message : String(error),
      });
      Alert.alert(t("common.actionFailed"), t("settings.pendingResendError"));
    } finally {
      setIsResendingPendingRegistration(false);
    }
  };

  const handleCancelPendingRegistration = async () => {
    console.log("[AuthDebug] SettingsScreen:pending:cancel:tap", {
      email: pendingRegistration?.pendingEmail ?? null,
      status: pendingRegistration?.status ?? null,
    });
    try {
      await cancelPendingRegistration();
      console.log("[AuthDebug] SettingsScreen:pending:cancel:success", {
        email: pendingRegistration?.pendingEmail ?? null,
      });
    } catch (error) {
      console.log("[AuthDebug] SettingsScreen:pending:cancel:error", {
        email: pendingRegistration?.pendingEmail ?? null,
        message: error instanceof Error ? error.message : String(error),
      });
      Alert.alert(t("common.actionFailed"), t("common.actionFailed"));
    }
  };

  const closeCompleteRegistrationModal = () => {
    if (isCompletingRegistration) {
      return;
    }

    setIsCompleteRegistrationModalVisible(false);
    setCompletionPassword("");
    setCompletionPasswordRepeat("");
    setCompletionError(null);
  };

  const handleCompleteRegistration = async () => {
    console.log("[AuthDebug] SettingsScreen:pending:complete:tap", {
      email: pendingRegistration?.pendingEmail ?? null,
      status: pendingRegistration?.status ?? null,
      passwordLength: completionPassword.length,
      repeatLength: completionPasswordRepeat.length,
    });

    if (completionPassword.length < 6) {
      console.log("[AuthDebug] SettingsScreen:pending:complete:invalid-password-length", {
        passwordLength: completionPassword.length,
      });
      setCompletionError(t("auth.passwordError"));
      return;
    }

    if (completionPassword !== completionPasswordRepeat) {
      console.log("[AuthDebug] SettingsScreen:pending:complete:password-mismatch");
      setCompletionError(t("auth.passwordRepeatError"));
      return;
    }

    try {
      setIsCompletingRegistration(true);
      setCompletionError(null);
      await completePendingRegistration(completionPassword);
      console.log("[AuthDebug] SettingsScreen:pending:complete:success", {
        email: pendingRegistration?.pendingEmail ?? null,
      });
      closeCompleteRegistrationModal();
    } catch (error) {
      console.log("[AuthDebug] SettingsScreen:pending:complete:error", {
        email: pendingRegistration?.pendingEmail ?? null,
        message: error instanceof Error ? error.message : String(error),
      });
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : null;

      if (errorCode === "auth/email-already-in-use") {
        setCompletionError(t("auth.emailInUseError"));
      } else if (errorCode === "pending-registration-not-confirmed") {
        setCompletionError(t("settings.pendingFinalizeNotConfirmed"));
      } else if (errorCode === "pending-registration-expired") {
        setCompletionError(t("settings.pendingExpiredDescription"));
      } else {
        setCompletionError(t("settings.pendingFinalizeError"));
      }
    } finally {
      setIsCompletingRegistration(false);
    }
  };

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[layout.content, styles.contentWithTabBar]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[surfaces.mainPanel, styles.primaryCard]}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.cardTitle, styles.groupTitle]}>{t("settings.accountTitle")}</Text>
          </View>
          {!isAnonymous && currentUser?.email ? (
            <>
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={[typography.meta, styles.verifiedLabel]}>
                  {t("settings.accountVerified")}
                </Text>
              </View>
              <Text style={[typography.secondary, styles.accountText]}>
                {t("settings.accountSignedIn")}
              </Text>
            </>
          ) : hasConfirmedRegistration ? (
            <>
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                <Text style={[typography.meta, styles.verifiedLabel]}>
                  {t("settings.pendingConfirmedTitle")}
                </Text>
              </View>
              <Text style={[typography.secondary, styles.accountText]}>
                {t("settings.pendingConfirmedDescription")}
              </Text>
            </>
          ) : hasPendingRegistration ? (
            <>
              <View style={styles.accountStatusCard}>
                <View style={styles.accountStatusHeader}>
                  <View style={styles.accountStatusBadge}>
                    <Ionicons name="mail-outline" size={16} color={colors.accent} />
                    <Text style={[typography.meta, styles.accountStatusBadgeText]}>
                      {t("settings.pendingStatusTitle")}
                    </Text>
                  </View>
                </View>
                <View style={styles.accountIdentityRow}>
                  <Text style={[typography.meta, styles.accountIdentityLabel]}>
                    {t("auth.email")}
                  </Text>
                  <Text style={[typography.body, styles.accountIdentityValue]}>
                    {pendingRegistration?.pendingEmail}
                  </Text>
                </View>
                <View style={styles.accountIdentityRow}>
                  <Text style={[typography.meta, styles.accountIdentityLabel]}>
                    {t("settings.pendingExpiresLabel")}
                  </Text>
                  <Text style={[typography.body, styles.accountIdentityValue]}>
                    {pendingRegistrationExpiresLabel ?? t("common.none")}
                  </Text>
                </View>
              </View>
              <Text style={[typography.secondary, styles.accountText]}>
                {t("settings.pendingStatusDescription")}
              </Text>
              <Text style={[typography.secondary, styles.pendingBackendHint]}>
                {t("settings.pendingBackendHint")}
              </Text>
            </>
          ) : pendingRegistrationState === "expired" ? (
            <Text style={[typography.secondary, styles.accountText]}>
              {t("settings.pendingExpiredDescription")}
            </Text>
          ) : pendingRegistrationState === "cancelled" ? (
            <Text style={[typography.secondary, styles.accountText]}>
              {t("settings.pendingCancelledDescription")}
            </Text>
          ) : (
            <>
              <Text style={[typography.secondary, styles.accountText]}>
                {t("settings.accountAnonymous")}
              </Text>
              <View style={styles.accountBenefitList}>
                <View style={styles.accountBenefitRow}>
                  <Ionicons name="cloud-upload-outline" size={16} color={colors.accent} />
                  <Text style={[typography.secondary, styles.accountBenefitText]}>
                    {t("settings.accountBenefitBackup")}
                  </Text>
                </View>
                <View style={styles.accountBenefitRow}>
                  <Ionicons name="phone-portrait-outline" size={16} color={colors.accent} />
                  <Text style={[typography.secondary, styles.accountBenefitText]}>
                    {t("settings.accountBenefitDevices")}
                  </Text>
                </View>
                <View style={styles.accountBenefitRow}>
                  <Ionicons name="refresh-outline" size={16} color={colors.accent} />
                  <Text style={[typography.secondary, styles.accountBenefitText]}>
                    {t("settings.accountBenefitRestore")}
                  </Text>
                </View>
              </View>
            </>
          )}
          <View style={styles.optionRow}>
            {hasPendingRegistration ? (
              <>
                <Pressable
                  style={[buttons.buttonBase, buttons.primaryButton, styles.actionButton]}
                  onPress={handleResendPendingRegistration}
                  disabled={isResendingPendingRegistration || pendingRegistrationState !== "pending"}
                >
                  <Text style={[typography.button, styles.actionPrimaryText]}>
                    {t("settings.pendingResendAction")}
                  </Text>
                </Pressable>
                <Pressable
                  style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButton]}
                  onPress={handleCancelPendingRegistration}
                >
                  <Text style={[typography.button, styles.optionText]}>
                    {t("settings.pendingCancelAction")}
                  </Text>
                </Pressable>
              </>
            ) : hasConfirmedRegistration ? (
              <Pressable
                style={[buttons.buttonBase, buttons.primaryButton, styles.actionButtonSingle]}
                onPress={() => setIsCompleteRegistrationModalVisible(true)}
              >
                <Text style={[typography.button, styles.actionPrimaryText]}>
                  {t("settings.pendingFinalizeAction")}
                </Text>
              </Pressable>
            ) : (
              <>
                {isAnonymous ? (
                  <>
                    <Pressable
                      style={[buttons.buttonBase, buttons.primaryButton, styles.actionButton]}
                      onPress={() => navigation.navigate("Register")}
                    >
                      <Text style={[typography.button, styles.actionPrimaryText]}>
                        {t("settings.registerAction")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButton]}
                      onPress={() => navigation.navigate("Login")}
                    >
                      <Text style={[typography.button, styles.optionText]}>
                        {t("settings.loginAction")}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    style={[buttons.buttonBase, buttons.primaryButton, styles.actionButtonSingle]}
                    onPress={() => navigation.navigate("Account")}
                  >
                    <Text style={[typography.button, styles.actionPrimaryText]}>
                      {t("settings.accountManageAction")}
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>

        <View style={[surfaces.mainPanel, styles.primaryCard]}>
          <Text style={[typography.cardTitle, styles.groupTitle]}>
            {isPremium ? t("settings.premiumCardTitlePremium") : t("settings.premiumCardTitleFree")}
          </Text>
          <Text style={[typography.secondary, styles.premiumLead]}>
            {isPremium
              ? t("settings.premiumCardDescriptionPremium")
              : t("settings.premiumCardDescriptionFree")}
          </Text>

          <Pressable
            style={[buttons.buttonBase, buttons.primaryButton, styles.actionButtonSingle]}
            onPress={openPremiumModal}
          >
            <Text style={[typography.button, styles.purchasePrimaryText]}>
              {isPremium ? t("settings.premiumViewBenefits") : t("settings.premiumLearnMore")}
            </Text>
          </Pressable>
        </View>

        <OptionGroup
          title={t("settings.language")}
          value={language}
          options={["de", "en"] as const}
          formatLabel={(option) => (option === "de" ? t("settings.languageDe") : t("settings.languageEn"))}
          onChange={setLanguage}
        />
        <OptionGroup
          title={t("settings.currency")}
          value={currency}
          options={["EUR", "Dollar"] as const}
          formatLabel={(option) => (option === "EUR" ? t("settings.currencyEur") : t("settings.currencyDollar"))}
          onChange={setCurrency}
        />
        <OptionGroup
          title={t("settings.theme")}
          value={theme}
          options={["Dark", "Light"] as const}
          formatLabel={(option) => (option === "Dark" ? t("settings.themeDark") : t("settings.themeLight"))}
          onChange={setTheme}
        />

        <View style={[surfaces.panel, styles.groupCard]}>
          <Text style={[typography.cardTitle, styles.groupTitle]}>{t("settings.accentColor")}</Text>
          <View style={styles.accentGrid}>
            {accentColorOptions.map((option) => {
              const isActive = option === accentColor;
              const accentPreview = getAccentPalette(option, mode);
              const isLocked = !canUseAccentColor(option, hasSupportColors);
              const isFree = option === FREE_ACCENT_COLOR;

              return (
                <Pressable
                  key={option}
                  style={[
                    styles.accentOption,
                    { borderColor: isActive ? colors.accent : colors.border },
                    isActive ? styles.accentOptionActive : null,
                    isLocked ? styles.accentOptionLocked : null,
                  ]}
                  onPress={() => handleAccentPress(option)}
                >
                  {isLocked ? (
                    <View style={styles.accentOptionLock}>
                      <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.accentSwatch,
                      {
                        backgroundColor: accentPreview.accentSoft,
                        borderColor: accentPreview.accent,
                      },
                    ]}
                  >
                    <View style={[styles.accentSwatchInner, { backgroundColor: accentPreview.accent }]} />
                  </View>
                  <Text
                    style={[
                      typography.meta,
                      styles.accentOptionLabel,
                      isActive && !isLocked ? styles.optionTextActive : null,
                      isLocked ? styles.accentOptionLabelLocked : null,
                    ]}
                  >
                    {getAccentLabel(option, t)}
                  </Text>
                  <Text
                    style={[
                      typography.meta,
                      styles.accentMetaLabel,
                      isLocked ? styles.accentOptionLabelLocked : null,
                    ]}
                  >
                    {isFree
                      ? t("settings.accentFreeBadge")
                      : isLocked
                        ? t("settings.accentLockedLabel")
                        : t("settings.accentPremiumBadge")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.legalSection}>
          <Text style={[typography.meta, styles.legalHeading]}>{t("settings.legalTitle")}</Text>
          <View style={styles.legalList}>
            <Pressable style={styles.legalRow} onPress={() => navigation.navigate("Terms")}>
              <Text style={[typography.secondary, styles.legalLink]}>{t("common.terms")}</Text>
            </Pressable>
            <Pressable style={styles.legalRow} onPress={() => navigation.navigate("Privacy")}>
              <Text style={[typography.secondary, styles.legalLink]}>{t("common.privacy")}</Text>
            </Pressable>
            <Pressable style={styles.legalRow} onPress={() => navigation.navigate("Imprint")}>
              <Text style={[typography.secondary, styles.legalLink]}>{t("common.imprint")}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.legalRow} onPress={() => setIsContactModalVisible(true)}>
            <Text style={[typography.secondary, styles.legalLink]}>{t("settings.contactTitle")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isCompleteRegistrationModalVisible}
        onRequestClose={closeCompleteRegistrationModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCompleteRegistrationModal} />
          <View style={[surfaces.panel, styles.confirmationSheet]}>
            <View style={styles.purchaseSheetHeader}>
              <Text style={[typography.cardTitle, styles.groupTitle]}>
                {t("settings.pendingFinalizeTitle")}
              </Text>
              <Pressable onPress={closeCompleteRegistrationModal} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[typography.secondary, styles.confirmationText]}>
              {t("settings.pendingFinalizeDescription")}
            </Text>
            <View style={styles.completionForm}>
              <Text style={[typography.meta, styles.accountIdentityLabel]}>{t("auth.password")}</Text>
              <TextInput
                value={completionPassword}
                onChangeText={setCompletionPassword}
                secureTextEntry
                style={[inputs.input, styles.completionInput]}
              />
            </View>
            <View style={styles.completionForm}>
              <Text style={[typography.meta, styles.accountIdentityLabel]}>
                {t("auth.passwordRepeat")}
              </Text>
              <TextInput
                value={completionPasswordRepeat}
                onChangeText={setCompletionPasswordRepeat}
                secureTextEntry
                style={[inputs.input, styles.completionInput]}
              />
            </View>
            {completionError ? (
              <Text style={[typography.secondary, styles.purchaseErrorText]}>{completionError}</Text>
            ) : null}
            <View style={styles.confirmationActions}>
              <Pressable
                style={[buttons.buttonBase, buttons.secondaryButton, styles.confirmationButton]}
                onPress={closeCompleteRegistrationModal}
                disabled={isCompletingRegistration}
              >
                <Text style={[typography.button, styles.optionText]}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                style={[buttons.buttonBase, buttons.primaryButton, styles.confirmationButton]}
                onPress={handleCompleteRegistration}
                disabled={isCompletingRegistration}
              >
                {isCompletingRegistration ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Text style={[typography.button, styles.purchasePrimaryText]}>
                    {t("settings.pendingFinalizeAction")}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isPremiumModalVisible}
        onRequestClose={closePremiumModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePremiumModal} />
          <View style={[surfaces.panel, styles.purchaseSheet]}>
            <ScrollView
              style={styles.purchaseScroll}
              contentContainerStyle={styles.purchaseScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.purchaseSheetHeader}>
                <Text style={[typography.cardTitle, styles.groupTitle]}>{t("settings.premiumModalTitle")}</Text>
                <Pressable onPress={closePremiumModal} hitSlop={10}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
              <Text style={[typography.secondary, styles.purchaseDescription]}>
                {t("settings.premiumModalDescription")}
              </Text>
              <View style={styles.premiumTierList}>
                <View style={[styles.premiumTierCard, styles.premiumTierCardFree]}>
                  <View style={styles.premiumTierHeader}>
                    <Text style={[typography.cardTitle, styles.premiumTierTitle]}>{t("settings.premiumFreeCardTitle")}</Text>
                    <Ionicons name="leaf-outline" size={18} color={colors.textSecondary} />
                  </View>
                  <View style={styles.premiumFeatureList}>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="albums-outline" size={16} color={colors.textSecondary} />
                      <Text style={[typography.secondary, styles.premiumFeatureText]}>
                        {t("settings.premiumItemSubscriptionsFree")}
                      </Text>
                    </View>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={[typography.secondary, styles.premiumFeatureText]}>
                        {t("settings.premiumItemHistoryFree")}
                      </Text>
                    </View>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="cloud-outline" size={16} color={colors.textSecondary} />
                      <Text style={[typography.secondary, styles.premiumFeatureText]}>
                        {t("settings.premiumItemCloudFree")}
                      </Text>
                    </View>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="bar-chart-outline" size={16} color={colors.textSecondary} />
                      <Text style={[typography.secondary, styles.premiumFeatureText]}>
                        {t("settings.premiumItemStats")}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.premiumPriceCard}>
                  <Text style={[typography.button, styles.premiumPriceText]}>
                    {supportColorsPrice
                      ? t("settings.premiumOneTimePrice", { price: supportColorsPrice })
                      : t("settings.premiumOneTimePriceLoading")}
                  </Text>
                </View>

                <View style={[styles.premiumTierCard, styles.premiumTierCardPremium]}>
                  <View style={styles.premiumTierHeader}>
                    <Text style={[typography.cardTitle, styles.premiumTierTitle]}>{t("settings.premiumPlanBadge")}</Text>
                    <Ionicons name="diamond-outline" size={18} color={colors.accent} />
                  </View>
                  <View style={styles.premiumFeatureList}>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="albums-outline" size={16} color={colors.accent} />
                      <Text style={[typography.secondary, styles.premiumFeatureText, styles.premiumFeatureTextStrong]}>
                        {t("settings.premiumItemSubscriptionsPremium")}
                      </Text>
                    </View>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="time-outline" size={16} color={colors.accent} />
                      <Text style={[typography.secondary, styles.premiumFeatureText]}>
                        {t("settings.premiumItemHistoryPremium")}
                      </Text>
                    </View>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="cloud-outline" size={16} color={colors.accent} />
                      <Text style={[typography.secondary, styles.premiumFeatureText]}>
                        {t("settings.premiumItemCloudPremium")}
                      </Text>
                    </View>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="bar-chart-outline" size={16} color={colors.accent} />
                      <Text style={[typography.secondary, styles.premiumFeatureText]}>
                        {t("settings.premiumItemStats")}
                      </Text>
                    </View>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="color-palette-outline" size={16} color={colors.accent} />
                      <Text style={[typography.secondary, styles.premiumFeatureText]}>
                        {t("settings.premiumItemAccents")}
                      </Text>
                    </View>
                    <View style={styles.premiumFeatureRow}>
                      <Ionicons name="heart-outline" size={16} color={colors.accent} />
                      <Text style={[typography.secondary, styles.premiumFeatureText]}>
                        {t("settings.premiumItemSupport")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              {purchaseMessage ? (
                <Text style={[typography.secondary, styles.purchaseErrorText]}>{purchaseMessage}</Text>
              ) : null}
              {!isStoreConnected && !isRefreshing ? (
                <Text style={[typography.secondary, styles.purchaseStoreHint]}>
                  {t("settings.purchaseUnavailable")}
                </Text>
              ) : null}
              <Pressable
                style={[
                  buttons.buttonBase,
                  buttons.primaryButton,
                  styles.purchaseButton,
                  !supportColorsPrice || isPurchasing || isRefreshing ? styles.purchaseButtonDisabled : null,
                ]}
                disabled={!supportColorsPrice || isPurchasing || isRefreshing}
                onPress={handlePurchase}
              >
                {isPurchasing ? (
                  <ActivityIndicator size="small" color={colors.accentText} />
                ) : (
                  <Text style={[typography.button, styles.purchasePrimaryText]}>{t("settings.premiumUpgrade")}</Text>
                )}
              </Pressable>
              <Pressable
                style={[buttons.buttonBase, buttons.secondaryButton, styles.purchaseButton]}
                disabled={isPurchasing || isRefreshing}
                onPress={handleRestore}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Text style={[typography.button, styles.optionText]}>{t("settings.purchaseRestore")}</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isContactModalVisible}
        onRequestClose={() => setIsContactModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsContactModalVisible(false)} />
          <View style={[surfaces.panel, styles.purchaseSheet]}>
            <ScrollView
              style={styles.purchaseScroll}
              contentContainerStyle={styles.purchaseScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.purchaseSheetHeader}>
                <Text style={[typography.cardTitle, styles.groupTitle]}>{t("settings.contactTitle")}</Text>
                <Pressable onPress={() => setIsContactModalVisible(false)} hitSlop={10}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
              <View style={styles.contactIntroCard}>
                <View style={styles.contactIntroHeader}>
                  <View style={styles.purchaseIconWrap}>
                    <Ionicons name="mail-outline" size={18} color={colors.accent} />
                  </View>
                  <Text style={[typography.secondary, styles.contactIntroText]}>
                    {t("settings.contactModalDescription")}
                  </Text>
                </View>
              </View>
              <View style={styles.contactActionList}>
                <View style={styles.contactActionRow}>
                  <View style={styles.contactActionLead}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.textSecondary} />
                    <View style={styles.contactActionCopy}>
                      <Text style={[typography.secondary, styles.contactActionText]}>{t("settings.contactFeedback")}</Text>
                      <Text style={[typography.meta, styles.contactActionMeta]}>
                        {t("settings.contactPreparedDescription")}
                      </Text>
                    </View>
                  </View>
                  <Text style={[typography.meta, styles.contactPreparedBadge]}>{t("settings.contactPrepared")}</Text>
                </View>
                <View style={styles.contactActionRow}>
                  <View style={styles.contactActionLead}>
                    <Ionicons name="bug-outline" size={16} color={colors.textSecondary} />
                    <View style={styles.contactActionCopy}>
                      <Text style={[typography.secondary, styles.contactActionText]}>{t("settings.contactBug")}</Text>
                      <Text style={[typography.meta, styles.contactActionMeta]}>
                        {t("settings.contactPreparedDescription")}
                      </Text>
                    </View>
                  </View>
                  <Text style={[typography.meta, styles.contactPreparedBadge]}>{t("settings.contactPrepared")}</Text>
                </View>
                <View style={styles.contactActionRow}>
                  <View style={styles.contactActionLead}>
                    <Ionicons name="mail-open-outline" size={16} color={colors.textSecondary} />
                    <View style={styles.contactActionCopy}>
                      <Text style={[typography.secondary, styles.contactActionText]}>{t("settings.contactEmail")}</Text>
                      <Text style={[typography.meta, styles.contactActionMeta]}>
                        {t("settings.contactPreparedDescription")}
                      </Text>
                    </View>
                  </View>
                  <Text style={[typography.meta, styles.contactPreparedBadge]}>{t("settings.contactPrepared")}</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getAccentLabel = (option: AccentColor, t: (key: string) => string) =>
  (
    {
      indigo: t("settings.accentIndigo"),
      slate: t("settings.accentSlate"),
      graphite: t("settings.accentGraphite"),
      blue: t("settings.accentBlue"),
      sage: t("settings.accentSage"),
      cyan: t("settings.accentCyan"),
      teal: t("settings.accentTeal"),
      green: t("settings.accentGreen"),
      forest: t("settings.accentForest"),
      sand: t("settings.accentSand"),
      amber: t("settings.accentAmber"),
      orange: t("settings.accentOrange"),
      coral: t("settings.accentCoral"),
      gold: t("settings.accentGold"),
      violet: t("settings.accentViolet"),
      rose: t("settings.accentRose"),
    } satisfies Record<AccentColor, string>
  )[option];

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    contentWithTabBar: {
      minHeight: "100%",
      paddingTop: 0,
    },
    primaryCard: {
      gap: spacing.md,
    },
    accountText: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    verifiedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    verifiedLabel: {
      color: colors.accent,
      textTransform: "uppercase",
    },
    pendingBackendHint: {
      color: colors.textMuted,
      lineHeight: 20,
    },
    accountBenefitList: {
      gap: spacing.sm,
    },
    accountBenefitRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    accountBenefitText: {
      flex: 1,
      color: colors.textSecondary,
    },
    accountStatusCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    accountStatusHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    accountStatusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      minHeight: 28,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
    accountStatusBadgeText: {
      color: colors.accent,
      textTransform: "uppercase",
    },
    accountIdentityRow: {
      gap: spacing.xxs,
    },
    accountIdentityLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    accountIdentityValue: {
      color: colors.textPrimary,
    },
    groupCard: {
      gap: spacing.md,
    },
    sectionHeader: {
      minHeight: 28,
      justifyContent: "center",
    },
    groupTitle: {
      color: colors.textPrimary,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    cardHeaderCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    premiumLead: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    confirmationSheet: {
      gap: spacing.lg,
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
    },
    confirmationText: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    confirmationActions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    confirmationButton: {
      flex: 1,
    },
    completionForm: {
      gap: spacing.xs,
    },
    completionInput: {
      color: colors.textPrimary,
    },
    premiumTierList: {
      gap: spacing.sm,
    },
    premiumTierCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      backgroundColor: colors.surfaceSoft,
    },
    premiumTierHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    premiumTierCardFree: {
      borderColor: colors.border,
    },
    premiumTierCardPremium: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    premiumPriceCard: {
      minHeight: 48,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    premiumPriceText: {
      color: colors.accent,
      textAlign: "center",
    },
    premiumTierTitle: {
      color: colors.textPrimary,
      textTransform: "uppercase",
    },
    premiumFeatureList: {
      gap: spacing.sm,
    },
    premiumFeatureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    premiumFeatureText: {
      flex: 1,
      color: colors.textPrimary,
    },
    premiumFeatureTextStrong: {
      fontWeight: "700",
    },
    premiumModalInfo: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
    },
    premiumInfoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    optionRow: {
      flexDirection: "row",
      gap: spacing.sm,
      flexWrap: "wrap",
    },
    actionButton: {
      flex: 1,
      minWidth: 132,
    },
    actionButtonSingle: {
      minWidth: 132,
    },
    optionButton: {
      minWidth: 92,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    optionButtonActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    optionText: {
      color: colors.textPrimary,
    },
    optionTextActive: {
      color: colors.accent,
    },
    actionPrimaryText: {
      color: colors.accent,
    },
    accentGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: spacing.sm,
    },
    accentOption: {
      width: "23%",
      minWidth: 0,
      minHeight: 100,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      backgroundColor: colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },
    accentOptionActive: {
      backgroundColor: colors.accentSoft,
    },
    accentOptionLocked: {
      opacity: 0.82,
    },
    accentOptionLock: {
      position: "absolute",
      top: spacing.xs,
      right: spacing.xs,
      width: 18,
      height: 18,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    accentSwatch: {
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    accentSwatchInner: {
      width: 14,
      height: 14,
      borderRadius: radius.pill,
    },
    accentOptionLabel: {
      color: colors.textPrimary,
      textTransform: "capitalize",
      fontSize: 11,
      lineHeight: 14,
      textAlign: "center",
    },
    accentOptionLabelLocked: {
      color: colors.textSecondary,
    },
    accentMetaLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      lineHeight: 12,
      textTransform: "uppercase",
      textAlign: "center",
    },
    contactActionList: {
      gap: spacing.sm,
    },
    contactIntroCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
    },
    contactIntroHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    contactIntroText: {
      flex: 1,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    contactActionRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
      minHeight: 72,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
    },
    contactActionLead: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    contactActionCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    contactActionText: {
      color: colors.textPrimary,
    },
    contactActionMeta: {
      color: colors.textMuted,
      lineHeight: 18,
    },
    contactPreparedBadge: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    legalSection: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    legalHeading: {
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    legalList: {
      gap: spacing.sm,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    legalLink: {
      color: colors.textSecondary,
    },
    legalRow: {
      minHeight: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.overlay,
      padding: spacing.lg,
    },
    purchaseSheet: {
      maxHeight: "82%",
      borderRadius: radius.lg,
      padding: 0,
      overflow: "hidden",
    },
    purchaseScroll: {
      flexGrow: 0,
    },
    purchaseScrollContent: {
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    purchaseSheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    purchaseIconWrap: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    purchaseDescription: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    purchaseButton: {
      minHeight: 48,
    },
    purchaseButtonDisabled: {
      opacity: 0.55,
    },
    purchasePrimaryText: {
      color: colors.accent,
    },
    purchaseErrorText: {
      color: colors.danger,
      lineHeight: 21,
    },
    purchaseStoreHint: {
      color: colors.textSecondary,
    },
  });
