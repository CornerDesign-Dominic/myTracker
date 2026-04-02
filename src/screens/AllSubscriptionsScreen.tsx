import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { EmptyState } from "@/components/EmptyState";
import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { AllSubscriptionsTabScreenProps } from "@/navigation/types";
import {
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  spacing,
} from "@/theme";
import { localizeCategory } from "@/utils/categories";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

export const AllSubscriptionsScreen = ({ navigation }: AllSubscriptionsTabScreenProps) => {
  const { colors, typography, isDark } = useAppTheme();
  const { language, t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const inputs = createInputStyles(colors);
  const { currency } = useAppSettings();
  const { subscriptions } = useSubscriptions();
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.contentWithTabBar]}>
        <View style={styles.titleRow}>
          <Text style={[typography.pageTitle, styles.pageTitle]}>{t("allSubscriptions.title")}</Text>
          <Pressable
            style={[surfaces.subtlePanel, styles.addButton]}
            onPress={() => navigation.navigate("SubscriptionForm")}
          >
            <Text style={[typography.cardTitle, styles.addButtonText]}>+</Text>
          </Pressable>
        </View>

        <View style={[surfaces.panel, styles.summaryCard]}>
          <View style={styles.summaryCopy}>
            <Text style={[typography.metric, styles.summaryTitle]}>
              {t("allSubscriptions.totalSubscriptions", { count: subscriptions.length })}
            </Text>
            <Text style={[typography.secondary, styles.summaryAmount]}>
              {t("allSubscriptions.pausedSubscriptionsCount", { count: pausedSubscriptionsCount })}
            </Text>
          </View>
          <View style={[inputs.input, styles.searchField]}>
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

        <View style={[surfaces.panel, styles.listCard]}>
          {filteredSubscriptions.length === 0 ? (
            subscriptions.length === 0 ? (
              <EmptyState
                title={t("allSubscriptions.emptyTitle")}
                description={t("allSubscriptions.emptyDescription")}
              />
            ) : (
              <EmptyState
                title={t("allSubscriptions.noSearchResultsTitle")}
                description={t("allSubscriptions.noSearchResultsDescription")}
              />
            )
          ) : (
            <View style={styles.subscriptionList}>
              {filteredSubscriptions.map((subscription, index) => (
                (() => {
                  const isAccentStatus = subscription.status === "active";

                  return (
                <Pressable
                  key={subscription.id}
                  style={[
                    styles.subscriptionRow,
                    index < filteredSubscriptions.length - 1 ? styles.rowDivider : null,
                  ]}
                  onPress={() =>
                    navigation.navigate("SubscriptionDetails", {
                      subscriptionId: subscription.id,
                    })
                  }
                >
                  <View style={styles.rowTop}>
                    <View style={styles.rowMain}>
                      <SubscriptionAvatar
                        name={subscription.name}
                        category={subscription.category}
                      />
                      <View style={styles.rowTitleBlock}>
                        <Text style={[typography.body, styles.subscriptionName]}>
                          {subscription.name}
                        </Text>
                        <Text style={[typography.secondary, styles.subscriptionCategory]}>
                          {localizeCategory(subscription.category, language)}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        !isAccentStatus ? styles.statusBadgeMuted : null,
                      ]}
                    >
                      <Text
                        style={[
                          typography.meta,
                          styles.statusText,
                          !isAccentStatus ? styles.statusTextMuted : null,
                        ]}
                      >
                        {t(`subscription.status_${subscription.status}`)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                      <Text style={[typography.meta, styles.metaLabel]}>
                        {t("allSubscriptions.amount")}
                      </Text>
                      <Text style={[typography.secondary, styles.metaValue]}>
                        {formatCurrency(subscription.amount, currency)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[typography.meta, styles.metaLabel]}>
                        {t("allSubscriptions.billingCycle")}
                      </Text>
                      <Text style={[typography.secondary, styles.metaValue]}>
                        {t(`subscription.billing_${subscription.billingCycle}`)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[typography.meta, styles.metaLabel]}>
                        {t("allSubscriptions.nextPayment")}
                      </Text>
                      <Text style={[typography.secondary, styles.metaValue]}>
                        {formatDate(subscription.nextPaymentDate)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
                  );
                })()
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
      justifyContent: "space-between",
      gap: 16,
      minHeight: 40,
    },
    contentWithTabBar: {
      minHeight: "100%",
    },
    summaryCard: {
      gap: spacing.lg,
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
      color: colors.textPrimary,
      fontSize: 17,
      lineHeight: 22,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      marginRight: -spacing.xxs,
    },
    addButtonText: {
      color: colors.accent,
    },
    searchField: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingRight: spacing.sm,
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
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 999,
    },
    listCard: {
      gap: spacing.xs,
    },
    subscriptionList: {
      gap: spacing.xs,
    },
    subscriptionRow: {
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    rowMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    rowTitleBlock: {
      flex: 1,
      gap: spacing.xxs,
    },
    subscriptionName: {
      color: colors.textPrimary,
    },
    subscriptionCategory: {
      color: colors.textSecondary,
    },
    statusBadge: {
      backgroundColor: colors.accentSoft,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    statusBadgeMuted: {
      backgroundColor: colors.surfaceSoft,
    },
    statusText: {
      color: colors.accent,
      textTransform: "capitalize",
    },
    statusTextMuted: {
      color: colors.textSecondary,
    },
    metaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    metaItem: {
      minWidth: "30%",
      gap: spacing.xxs,
    },
    metaLabel: {
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    metaValue: {
      color: colors.textPrimary,
    },
  });
