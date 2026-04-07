import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscriptionsHistory } from "@/hooks/useSubscriptionsHistory";
import {
  buildMonthlySavingsGroups,
  buildSavingsOverviewProjection,
} from "@/presentation/subscriptions/screenProjections";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";

export const SavingsScreen = () => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { subscriptions } = useSubscriptions();
  const { history } = useSubscriptionsHistory(
    subscriptions.map((subscription) => subscription.id),
  );
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const savingsOverview = useMemo(
    () => buildSavingsOverviewProjection(subscriptions, history, language, t),
    [history, language, subscriptions, t],
  );
  const monthlySavingsGroups = useMemo(
    () =>
      buildMonthlySavingsGroups(
        subscriptions,
        savingsOverview.skippedEvents,
        language,
        t("common.unavailable"),
      ),
    [language, savingsOverview.skippedEvents, subscriptions, t],
  );

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((current) => ({
      ...current,
      [monthKey]: !current[monthKey],
    }));
  };

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={layout.content}>
        <View style={[surfaces.panel, styles.summaryCard]}>
          <View style={styles.cardHeader}>
            <Text style={[typography.cardTitle, styles.cardTitle]}>
              {t("stats.savingsCardTitle")}
            </Text>
          </View>
          {savingsOverview.skippedEvents.length === 0 ? (
            <Text style={[typography.secondary, styles.helperText]}>
              {t("stats.noSavingsAvailable")}
            </Text>
          ) : (
            <>
              <View style={styles.savedMetric}>
                <Text style={[typography.meta, styles.savedLabel]}>
                  {t("stats.savingsAllTime")}
                </Text>
                <Text style={[typography.sectionTitle, styles.savedAmountAccent]}>
                  {formatCurrency(savingsOverview.totalSavedAmount, currency)}
                </Text>
              </View>
              <View style={styles.savedDivider} />

              <Text style={[typography.meta, styles.savedSectionLabel]}>
                {t("stats.savingsPerYear")}
              </Text>
              <View style={styles.savedSummaryRow}>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsOverview.summaryLabels.currentYear}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmount]}>
                    {formatCurrency(savingsOverview.savingsSummary.currentYearActual, currency)}
                  </Text>
                </View>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsOverview.summaryLabels.previousYear}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmount]}>
                    {formatCurrency(savingsOverview.savingsSummary.previousYearActual, currency)}
                  </Text>
                </View>
              </View>
              <View style={styles.savedDivider} />

              <Text style={[typography.meta, styles.savedSectionLabel]}>
                {t("stats.savingsPerMonth")}
              </Text>
              <View style={styles.savedSummaryRow}>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsOverview.summaryLabels.currentMonth}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmount]}>
                    {formatCurrency(savingsOverview.savingsSummary.currentMonthActual, currency)}
                  </Text>
                </View>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsOverview.summaryLabels.previousMonth}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmount]}>
                    {formatCurrency(savingsOverview.savingsSummary.previousMonthActual, currency)}
                  </Text>
                </View>
              </View>
              <View style={styles.savedDivider} />

              <Text style={[typography.meta, styles.savedSectionLabel]}>
                {t("stats.savingsProjectionLabel")}
              </Text>
              <View style={styles.savedSummaryRow}>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsOverview.summaryLabels.currentMonthProjection}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmountAccent]}>
                    {formatCurrency(savingsOverview.savingsSummary.currentMonthProjected, currency)}
                  </Text>
                </View>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsOverview.summaryLabels.currentYearProjection}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmountAccent]}>
                    {formatCurrency(savingsOverview.savingsSummary.currentYearProjected, currency)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {monthlySavingsGroups.length === 0 ? (
          <View style={[surfaces.panel, styles.listCard]}>
            <EmptyState
              title={t("savings.emptyTitle")}
              description={t("savings.emptyDescription")}
            />
          </View>
        ) : (
          monthlySavingsGroups.map((group) => {
            const isExpanded = expandedMonths[group.key] ?? false;

            return (
              <Pressable
                key={group.key}
                style={[surfaces.panel, styles.monthCard]}
                onPress={() => toggleMonth(group.key)}
              >
                <View style={styles.monthCardHeader}>
                  <Text style={[typography.body, styles.monthCardTitle]}>{group.label}</Text>
                  <View style={styles.monthCardMeta}>
                    <Text style={[typography.body, styles.monthCardAmount]}>
                      {formatCurrency(group.totalAmount, currency)}
                    </Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>
                </View>

                {isExpanded ? (
                  <View style={styles.monthCardList}>
                    <View style={styles.savedDivider} />
                    {group.items.map((item, index) => (
                      <View
                        key={item.subscriptionId}
                        style={[
                          styles.monthCardRow,
                          index < group.items.length - 1 ? styles.rowDivider : null,
                        ]}
                      >
                        <Text style={[typography.body, styles.monthCardRowTitle]}>
                          {item.subscriptionName}
                        </Text>
                        <Text style={[typography.body, styles.monthCardRowAmount]}>
                          {formatCurrency(item.amount, currency)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    summaryCard: {
      gap: spacing.md,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.md,
    },
    cardTitle: {
      color: colors.textPrimary,
    },
    savedSummaryRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    savedMetric: {
      flex: 1,
      gap: spacing.xxs,
    },
    helperText: {
      color: colors.textSecondary,
    },
    savedLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
    },
    savedSectionLabel: {
      color: colors.textSecondary,
    },
    savedAmount: {
      color: colors.textPrimary,
    },
    savedAmountAccent: {
      color: colors.accent,
    },
    savedDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    listCard: {
      gap: spacing.md,
    },
    monthCard: {
      gap: spacing.md,
    },
    monthCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    monthCardTitle: {
      color: colors.textPrimary,
      textTransform: "capitalize",
    },
    monthCardMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    monthCardAmount: {
      color: colors.textPrimary,
    },
    monthCardList: {
      gap: spacing.xs,
    },
    monthCardRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    monthCardRowTitle: {
      flex: 1,
      color: colors.textPrimary,
    },
    monthCardRowAmount: {
      color: colors.textPrimary,
      textAlign: "right",
    },
  });
