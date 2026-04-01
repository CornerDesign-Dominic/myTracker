import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const { t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
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
  const { currentUser, isAnonymous, logout } = useAuth();
  const {
    hasSupportColors,
    isPurchasing,
    isRefreshing,
    isStoreConnected,
    purchaseError,
    supportColorsProduct,
    purchaseSupportColors,
    restorePurchases,
    clearPurchaseError,
  } = usePurchases();
  const [isPurchaseModalVisible, setIsPurchaseModalVisible] = useState(false);
  const supportColorsPrice = supportColorsProduct?.displayPrice ?? null;
  const hasLockedAccents = !hasSupportColors;
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
    if (!isPurchaseModalVisible) {
      clearPurchaseError();
    }
  }, [clearPurchaseError, isPurchaseModalVisible]);

  useEffect(() => {
    if (hasSupportColors) {
      setIsPurchaseModalVisible(false);
    }
  }, [hasSupportColors]);

  const openPurchaseModal = () => {
    clearPurchaseError();
    setIsPurchaseModalVisible(true);
  };

  const closePurchaseModal = () => {
    if (isPurchasing || isRefreshing) {
      return;
    }

    setIsPurchaseModalVisible(false);
  };

  const handleAccentPress = (option: AccentColor) => {
    if (!canUseAccentColor(option, hasSupportColors)) {
      openPurchaseModal();
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

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={[layout.content, styles.contentWithTabBar]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[surfaces.panel, styles.groupCard]}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.cardTitle, styles.groupTitle]}>{t("settings.accountTitle")}</Text>
          </View>
          {!isAnonymous && currentUser?.email ? (
            <View style={styles.accountStatusCard}>
              <View style={styles.accountStatusHeader}>
                <View style={styles.accountStatusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                  <Text style={[typography.meta, styles.accountStatusBadgeText]}>
                    {t("settings.loggedInBadge")}
                  </Text>
                </View>
              </View>
              <View style={styles.accountIdentityRow}>
                <Text style={[typography.meta, styles.accountIdentityLabel]}>{t("auth.email")}</Text>
                <Text style={[typography.body, styles.accountIdentityValue]}>{currentUser.email}</Text>
              </View>
            </View>
          ) : null}
          <Text style={[typography.secondary, styles.accountText]}>
            {isAnonymous ? t("settings.accountAnonymous") : t("settings.accountSignedIn")}
          </Text>
          <View style={styles.optionRow}>
            {isAnonymous ? (
              <>
                <Pressable
                  style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButton]}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Text style={[typography.button, styles.optionText]}>{t("settings.loginAction")}</Text>
                </Pressable>
                <Pressable
                  style={[buttons.buttonBase, buttons.primaryButton, styles.actionButton]}
                  onPress={() => navigation.navigate("Register")}
                >
                  <Text
                    style={[
                      typography.button,
                      styles.actionPrimaryText,
                      mode === "light" ? styles.actionPrimaryTextLight : null,
                    ]}
                  >
                    {t("settings.registerAction")}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButtonSingle]}
                onPress={logout}
              >
                <Text style={[typography.button, styles.optionText]}>{t("settings.logoutAction")}</Text>
              </Pressable>
            )}
          </View>
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
          <View style={styles.cardHeaderRow}>
            <Text style={[typography.cardTitle, styles.groupTitle]}>{t("settings.accentColor")}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.accentStatusBadge, styles.accentStatusBadgeFree]}>
                <Text style={[typography.meta, styles.accentStatusBadgeText]}>{t("settings.accentFreeBadge")}</Text>
              </View>
              {hasLockedAccents ? (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
                </View>
              ) : (
                <View style={[styles.accentStatusBadge, styles.accentStatusBadgeUnlocked]}>
                  <Text style={[typography.meta, styles.accentStatusBadgeText]}>{t("settings.accentPremiumBadge")}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={[typography.secondary, styles.lockedHint]}>{t("settings.purchaseLockedHint")}</Text>
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

        <View style={styles.legalLinks}>
          <Pressable onPress={() => navigation.navigate("Terms")}>
            <Text style={[typography.secondary, styles.legalLink]}>{t("common.terms")}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Privacy")}>
            <Text style={[typography.secondary, styles.legalLink]}>{t("common.privacy")}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Imprint")}>
            <Text style={[typography.secondary, styles.legalLink]}>{t("common.imprint")}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={isPurchaseModalVisible}
        onRequestClose={closePurchaseModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePurchaseModal} />
          <View style={[surfaces.panel, styles.purchaseSheet]}>
            <View style={styles.purchaseSheetHeader}>
              <View style={styles.purchaseIconWrap}>
                <Ionicons name="color-palette-outline" size={18} color={colors.accent} />
              </View>
              <Pressable onPress={closePurchaseModal} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[typography.cardTitle, styles.groupTitle]}>{t("settings.purchaseTitle")}</Text>
            <Text style={[typography.secondary, styles.purchaseDescription]}>
              {t("settings.purchaseDescription")}
            </Text>
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
                <Text style={[typography.button, styles.purchasePrimaryText]}>
                  {supportColorsPrice
                    ? t("settings.purchaseBuy", { price: supportColorsPrice })
                    : t("settings.purchaseBuyUnavailable")}
                </Text>
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
    accountText: {
      color: colors.textSecondary,
      lineHeight: 22,
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
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
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
      color: colors.accentText,
    },
    actionPrimaryTextLight: {
      color: colors.textPrimary,
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
    lockBadge: {
      width: 28,
      height: 28,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    accentStatusBadge: {
      minHeight: 28,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    accentStatusBadgeFree: {
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
    },
    accentStatusBadgeUnlocked: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    accentStatusBadgeText: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    lockedHint: {
      color: colors.textSecondary,
      lineHeight: 21,
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
    legalLinks: {
      gap: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    legalLink: {
      color: colors.textSecondary,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.overlay,
      padding: spacing.lg,
    },
    purchaseSheet: {
      gap: spacing.md,
      borderRadius: radius.lg,
      paddingBottom: spacing.lg,
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
      color: colors.accentText,
    },
    purchaseErrorText: {
      color: colors.danger,
      lineHeight: 21,
    },
    purchaseStoreHint: {
      color: colors.textSecondary,
    },
  });
