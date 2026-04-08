import { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { AllSubscriptionsTabScreenProps } from "@/navigation/types";
import { FREE_SUBSCRIPTION_LIMIT } from "@/services/purchases/freemium";
import {
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  radius,
  spacing,
} from "@/theme";
import { localizeCategory } from "@/utils/categories";

export const AllSubscriptionsScreen = ({ navigation }: AllSubscriptionsTabScreenProps) => {
  const { colors, typography, isDark } = useAppTheme();
  const { language, t } = useI18n();
  const insets = useSafeAreaInsets();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const styles = getStyles(colors);
  const inputs = createInputStyles(colors);
  const { subscriptions, canCreateSubscription, isPremium, pendingSubscriptionsCount } = useSubscriptions();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLimitModalVisible, setIsLimitModalVisible] = useState(false);
  const [isPlanInfoModalVisible, setIsPlanInfoModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setSearchQuery("");
    }, []),
  );

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return subscriptions;
    }

    return subscriptions.filter((subscription) => {
      const searchableText =
        `${subscription.name} ${localizeCategory(subscription.category, language)}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [language, searchQuery, subscriptions]);

  const pausedSubscriptionsCount = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === "paused").length,
    [subscriptions],
  );

  const handleCreateSubscription = () => {
    if (!canCreateSubscription) {
      setIsLimitModalVisible(true);
      return;
    }

    navigation.navigate("SubscriptionForm");
  };

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          layout.content,
          styles.contentWithTabBar,
          { paddingBottom: insets.bottom + spacing.xxl + 76 },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={[typography.pageTitle, styles.pageTitle]}>{t("allSubscriptions.title")}</Text>
        </View>

        <View style={[surfaces.mainPanel, styles.summaryCard]}>
          {!isPremium ? (
            <Pressable
              style={[styles.planBadgeButton, styles.planBadgeButtonFree]}
              onPress={() => setIsPlanInfoModalVisible(true)}
              hitSlop={8}
            >
              <Ionicons name="leaf-outline" size={15} color={colors.textSecondary} />
              <Text style={[typography.meta, styles.planBadgeCounter]}>
                {subscriptions.length}/{FREE_SUBSCRIPTION_LIMIT}
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.planBadgeButton, styles.planBadgeButtonPremium]}>
              <Ionicons name="diamond-outline" size={15} color={colors.textSecondary} />
              <Text style={[typography.meta, styles.planBadgeCounter, styles.planBadgeInfinity]}>
                {"\u221E"}
              </Text>
            </View>
          )}
          <View style={styles.summaryCopy}>
            <Text style={[typography.metric, styles.summaryTitle]}>
              {t("allSubscriptions.totalSubscriptions", { count: subscriptions.length })}
            </Text>
            <Text style={[typography.secondary, styles.summaryAmount]}>
              {t("allSubscriptions.pausedSubscriptionsCount", { count: pausedSubscriptionsCount })}
            </Text>
            {pendingSubscriptionsCount > 0 ? (
              <Text style={[typography.meta, styles.pendingSummary]}>
                {t("allSubscriptions.pendingSyncSummary", { count: pendingSubscriptionsCount })}
              </Text>
            ) : null}
          </View>
          <View style={[inputs.input, styles.searchField, styles.searchFieldMain]}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("allSubscriptions.searchPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
            />
            <Pressable
              style={[styles.clearSearchButton, !isDark ? styles.clearSearchButtonLight : null]}
              onPress={() => setSearchQuery("")}
              hitSlop={8}
            >
              <Ionicons
                name="close"
                size={18}
                color={!isDark ? colors.textPrimary : colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.listSection}>
          {filteredSubscriptions.length === 0 ? (
            subscriptions.length === 0 ? (
              <Text style={[typography.secondary, styles.emptyInlineText]}>
                {t("allSubscriptions.emptyInline")}
              </Text>
            ) : (
              <View style={styles.emptyStateWrap}>
                <Text style={[typography.body, styles.emptyStateTitle]}>
                  {t("allSubscriptions.noSearchResultsTitle")}
                </Text>
                <Text style={[typography.secondary, styles.emptyInlineText]}>
                  {t("allSubscriptions.noSearchResultsDescription")}
                </Text>
              </View>
            )
          ) : (
            <View style={styles.subscriptionList}>
              {filteredSubscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  statusAboveActionIcon
                  accentAmount
                  hideNextPaymentDate
                  hideAmountLabel
                  hideBillingCycleLabel
                  actionText={t("allSubscriptions.detailsLink")}
                  actionIconName="chevron-forward-outline"
                  onPress={() =>
                    navigation.navigate("SubscriptionDetails", {
                      subscriptionId: subscription.id,
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <Pressable
        style={[styles.fabButton, { bottom: spacing.lg }]}
        onPress={handleCreateSubscription}
      >
        <Text style={[typography.cardTitle, styles.addButtonText]}>+</Text>
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        visible={isPlanInfoModalVisible}
        onRequestClose={() => setIsPlanInfoModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsPlanInfoModalVisible(false)}
          />
          <View style={[surfaces.panel, styles.planInfoModal]}>
            <View style={styles.planInfoHeader}>
              <Text style={[typography.cardTitle, styles.limitModalTitle]}>
                {t("allSubscriptions.freePlanUsageTitle")}
              </Text>
              <Pressable onPress={() => setIsPlanInfoModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[typography.secondary, styles.limitModalDescription]}>
              {t("allSubscriptions.freePlanUsageMessage", { count: subscriptions.length })}
            </Text>
            <Pressable
              style={[buttons.buttonBase, buttons.primaryButton, styles.planInfoAction]}
              onPress={() => {
                setIsPlanInfoModalVisible(false);
                navigation.navigate("Settings");
              }}
            >
              <Text style={[typography.button, styles.limitModalPrimaryText]}>
                {t("allSubscriptions.freePlanUsageAction")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isLimitModalVisible}
        onRequestClose={() => setIsLimitModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsLimitModalVisible(false)}
          />
          <View style={[surfaces.panel, styles.limitModal]}>
            <View style={styles.planInfoHeader}>
              <Text style={[typography.cardTitle, styles.limitModalTitle]}>
                {t("subscription.limitReachedTitle")}
              </Text>
              <Pressable onPress={() => setIsLimitModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[typography.secondary, styles.limitModalDescription]}>
              {t("subscription.limitReachedMessage")}
            </Text>
            <Pressable
              style={[buttons.buttonBase, buttons.primaryButton, styles.limitModalSingleAction]}
              onPress={() => {
                setIsLimitModalVisible(false);
                navigation.navigate("Settings");
              }}
            >
              <Text style={[typography.button, styles.limitModalPrimaryText]}>
                {t("subscription.limitReachedUpgrade")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    pageTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 30,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 16,
      minHeight: 40,
    },
    contentWithTabBar: {
      minHeight: "100%",
    },
    summaryCard: {
      gap: spacing.lg,
      position: "relative",
    },
    summaryCopy: {
      gap: spacing.xs,
    },
    summaryTitle: {
      color: colors.textPrimary,
      fontSize: 23,
      lineHeight: 28,
    },
    summaryLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    summaryAmount: {
      color: colors.textSecondary,
      fontSize: 17,
      lineHeight: 22,
    },
    pendingSummary: {
      color: colors.accent,
    },
    planBadgeButton: {
      position: "absolute",
      top: spacing.md,
      right: spacing.md,
      minWidth: 54,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      borderRadius: radius.md,
      alignItems: "center",
      gap: 2,
    },
    planBadgeButtonFree: {
      backgroundColor: "transparent",
      shadowColor: colors.shadow,
      shadowOpacity: 0.35,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 2,
    },
    planBadgeButtonPremium: {
      backgroundColor: "transparent",
    },
    planBadgeCounter: {
      color: colors.textSecondary,
      fontWeight: "700",
    },
    planBadgeInfinity: {
      fontSize: 13,
      lineHeight: 14,
      opacity: 0.92,
    },
    addButtonText: {
      color: colors.accent,
      fontSize: 24,
      lineHeight: 28,
    },
    fabButton: {
      position: "absolute",
      right: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 999,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      elevation: 4,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: "rgba(15, 23, 42, 0.42)",
    },
    limitModal: {
      alignSelf: "center",
      width: "100%",
      maxWidth: 420,
      gap: spacing.lg,
      borderRadius: radius.xl,
    },
    planInfoModal: {
      alignSelf: "center",
      width: "100%",
      maxWidth: 360,
      gap: spacing.md,
      borderRadius: radius.xl,
    },
    planInfoHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    planInfoAction: {
      alignSelf: "stretch",
    },
    limitModalTitle: {
      color: colors.textPrimary,
    },
    limitModalDescription: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    limitModalActions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    limitModalButton: {
      flex: 1,
    },
    limitModalSingleAction: {
      width: "100%",
    },
    limitModalPrimaryText: {
      color: colors.accentText,
    },
    limitModalSecondaryText: {
      color: colors.accent,
    },
    searchField: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingRight: spacing.sm,
    },
    searchFieldMain: {
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 2,
    },
    searchInput: {
      color: colors.textPrimary,
      flex: 1,
      minHeight: 0,
      backgroundColor: "transparent",
      borderWidth: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    clearSearchButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    clearSearchButtonLight: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      borderRadius: 999,
    },
    listSection: {
      gap: spacing.xs,
    },
    emptyStateWrap: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    emptyStateTitle: {
      color: colors.textPrimary,
      textAlign: "center",
    },
    emptyInlineText: {
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      paddingVertical: spacing.sm,
    },
    subscriptionList: {
      gap: spacing.md,
    },
  });

