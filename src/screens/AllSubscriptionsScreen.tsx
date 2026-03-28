import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptionsHistory } from "@/hooks/useSubscriptionsHistory";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { AllSubscriptionsTabScreenProps } from "@/navigation/types";
import { getProjectedYearlyCost } from "@/domain/subscriptions/statistics";
import {
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  spacing,
} from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

export const AllSubscriptionsScreen = ({ navigation }: AllSubscriptionsTabScreenProps) => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const styles = getStyles(colors);
  const { currency } = useAppSettings();
  const { subscriptions } = useSubscriptions();
  const { history: allHistory } = useSubscriptionsHistory(
    subscriptions.map((subscription) => subscription.id),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return subscriptions;
    }

    return subscriptions.filter((subscription) => {
      const searchableText = `${subscription.name} ${subscription.category}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }, [searchQuery, subscriptions]);

  const totalYearlyAmount = useMemo(
    () => getProjectedYearlyCost(subscriptions, allHistory),
    [allHistory, subscriptions],
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
            <Text style={[typography.cardTitle, styles.summaryTitle]}>
              {t("allSubscriptions.totalSubscriptions", { count: subscriptions.length })}
            </Text>
            <Text style={[typography.meta, styles.summaryLabel]}>
              {t("allSubscriptions.yearlySpend")}
            </Text>
            <Text style={[typography.metric, styles.summaryAmount]}>
              {formatCurrency(totalYearlyAmount, currency)}
            </Text>
          </View>
        </View>

        <View style={[surfaces.panel, styles.listCard]}>
          <View style={styles.listSearch}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("allSubscriptions.searchPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              style={[inputs.input, styles.searchInput]}
            />
            <Text style={[typography.secondary, styles.listMeta]}>
              {t("allSubscriptions.entries", { count: filteredSubscriptions.length })}
            </Text>
          </View>

          <View style={styles.searchDivider} />

          {filteredSubscriptions.length === 0 ? (
            <EmptyState
              title={t("allSubscriptions.emptyTitle")}
              description={t("allSubscriptions.emptyDescription")}
            />
          ) : (
            <View style={styles.subscriptionList}>
              {filteredSubscriptions.map((subscription, index) => (
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
                          {subscription.category}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={[typography.meta, styles.statusText]}>
                        {t(`subscription.status_${subscription.status}`)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaGrid}>
                    <View style={styles.metaItem}>
                      <Text style={[typography.meta, styles.metaLabel]}>{t("allSubscriptions.amount")}</Text>
                      <Text style={[typography.secondary, styles.metaValue]}>
                        {formatCurrency(subscription.amount, currency)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[typography.meta, styles.metaLabel]}>{t("allSubscriptions.billingCycle")}</Text>
                      <Text style={[typography.secondary, styles.metaValue]}>
                        {t(`subscription.billing_${subscription.billingCycle}`)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={[typography.meta, styles.metaLabel]}>{t("allSubscriptions.nextPayment")}</Text>
                      <Text style={[typography.secondary, styles.metaValue]}>
                        {formatDate(subscription.nextPaymentDate)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
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
    },
    summaryLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    summaryAmount: {
      color: colors.accent,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      marginRight: -spacing.xxs,
    },
    addButtonText: {
      color: colors.accent,
    },
    listSearch: {
      gap: spacing.sm,
    },
    searchInput: {
      color: colors.textPrimary,
    },
    listCard: {
      gap: spacing.lg,
    },
    listMeta: {
      color: colors.textSecondary,
    },
    searchDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginTop: -spacing.xs,
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
    statusText: {
      color: colors.accent,
      textTransform: "capitalize",
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
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    metaValue: {
      color: colors.textPrimary,
    },
  });
