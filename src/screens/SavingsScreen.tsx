import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import {
  buildSavingsSummary,
} from "@/domain/subscriptionHistory/statistics";
import { getMonthlyEquivalent } from "@/domain/subscriptions/metrics";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscriptionsHistory } from "@/hooks/useSubscriptionsHistory";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { localizeCategory } from "@/utils/categories";
import { formatCurrency } from "@/utils/currency";

type SavingsSubscriptionItem = {
  id: string;
  name: string;
  category: string;
  status: "active" | "paused" | "cancelled";
  monthlyCost: number;
  totalSaved: number;
};

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

  const skippedEvents = useMemo(
    () =>
      history
        .filter((event) => event.type === "payment_skipped_inactive" && !event.deletedAt)
        .sort((left, right) =>
          (right.updatedAt ?? right.createdAt).localeCompare(
            left.updatedAt ?? left.createdAt,
          ),
        ),
    [history],
  );

  const savingsSummary = useMemo(
    () => buildSavingsSummary(subscriptions, skippedEvents, new Date()),
    [skippedEvents, subscriptions],
  );

  const summaryLabels = useMemo(() => {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthFormatter = new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
      month: "long",
    });

    return {
      currentYear: String(now.getFullYear()),
      previousYear: String(now.getFullYear() - 1),
      currentMonth: monthFormatter.format(now),
      previousMonth: monthFormatter.format(previousMonth),
      currentMonthProjection:
        language === "de"
          ? `${monthFormatter.format(now)} Soll`
          : `${monthFormatter.format(now)} projected`,
      currentYearProjection:
        language === "de" ? `${now.getFullYear()} Soll` : `${now.getFullYear()} projected`,
    };
  }, [language]);

  const savingsSubscriptions = useMemo<SavingsSubscriptionItem[]>(() => {
    const totalsBySubscription = new Map<string, number>();

    skippedEvents.forEach((event) => {
      totalsBySubscription.set(
        event.subscriptionId,
        (totalsBySubscription.get(event.subscriptionId) ?? 0) + (event.amount ?? 0),
      );
    });

    return subscriptions
      .filter((subscription) => totalsBySubscription.has(subscription.id))
      .map((subscription) => ({
        id: subscription.id,
        name: subscription.name,
        category: subscription.category,
        status: subscription.status,
        monthlyCost: getMonthlyEquivalent(subscription),
        totalSaved: totalsBySubscription.get(subscription.id) ?? 0,
      }))
      .sort((left, right) => right.totalSaved - left.totalSaved);
  }, [skippedEvents, subscriptions]);

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={layout.content}>
        <View style={[surfaces.panel, styles.summaryCard]}>
          <View style={styles.summaryRow}>
            <View style={styles.metricBlock}>
              <Text style={[typography.meta, styles.metricLabel]}>{summaryLabels.currentYear}</Text>
              <Text style={[typography.sectionTitle, styles.metricValue]}>
                {formatCurrency(savingsSummary.currentYearActual, currency)}
              </Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={[typography.meta, styles.metricLabel]}>{summaryLabels.previousYear}</Text>
              <Text style={[typography.sectionTitle, styles.metricValue]}>
                {formatCurrency(savingsSummary.previousYearActual, currency)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <View style={styles.metricBlock}>
              <Text style={[typography.meta, styles.metricLabel]}>{summaryLabels.currentMonth}</Text>
              <Text style={[typography.sectionTitle, styles.metricValue]}>
                {formatCurrency(savingsSummary.currentMonthActual, currency)}
              </Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={[typography.meta, styles.metricLabel]}>{summaryLabels.previousMonth}</Text>
              <Text style={[typography.sectionTitle, styles.metricValue]}>
                {formatCurrency(savingsSummary.previousMonthActual, currency)}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <View style={styles.metricBlock}>
              <Text style={[typography.meta, styles.metricLabel]}>
                {summaryLabels.currentMonthProjection}
              </Text>
              <Text style={[typography.sectionTitle, styles.metricValueAccent]}>
                {formatCurrency(savingsSummary.currentMonthProjected, currency)}
              </Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={[typography.meta, styles.metricLabel]}>
                {summaryLabels.currentYearProjection}
              </Text>
              <Text style={[typography.sectionTitle, styles.metricValueAccent]}>
                {formatCurrency(savingsSummary.currentYearProjected, currency)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[surfaces.panel, styles.listCard]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>
            {t("savings.subscriptionsWithSavings")}
          </Text>

          {savingsSubscriptions.length === 0 ? (
            <EmptyState
              title={t("savings.emptyTitle")}
              description={t("savings.emptyDescription")}
            />
          ) : (
            <View style={styles.list}>
              {savingsSubscriptions.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.row,
                    index < savingsSubscriptions.length - 1 ? styles.rowDivider : null,
                  ]}
                >
                  <View style={styles.rowMain}>
                    <SubscriptionAvatar name={item.name} category={item.category} />
                    <View style={styles.rowCopy}>
                      <Text style={[typography.body, styles.rowTitle]}>{item.name}</Text>
                      <Text style={[typography.secondary, styles.rowMeta]}>
                        {localizeCategory(item.category, language)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rowDetails}>
                    <Text style={[typography.secondary, styles.detailLine]}>
                      {t("savings.perMonthLabel", {
                        amount: formatCurrency(item.monthlyCost, currency),
                      })}
                    </Text>
                    <Text style={[typography.body, styles.detailValue]}>
                      {t("savings.savedLabel", {
                        amount: formatCurrency(item.totalSaved, currency),
                      })}
                    </Text>
                    <Text style={[typography.secondary, styles.detailStatus]}>
                      {t("savings.statusLabel", {
                        status: t(`subscription.status_${item.status}`),
                      })}
                    </Text>
                  </View>
                </View>
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
    summaryCard: {
      gap: spacing.md,
    },
    summaryRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    metricBlock: {
      flex: 1,
      gap: spacing.xxs,
    },
    metricLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    metricValue: {
      color: colors.textPrimary,
    },
    metricValueAccent: {
      color: colors.accent,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    listCard: {
      gap: spacing.md,
    },
    cardTitle: {
      color: colors.textPrimary,
    },
    list: {
      gap: spacing.xs,
    },
    row: {
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
    rowMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      minWidth: 0,
    },
    rowCopy: {
      flex: 1,
      gap: spacing.xxs,
      minWidth: 0,
    },
    rowTitle: {
      color: colors.textPrimary,
    },
    rowMeta: {
      color: colors.textSecondary,
    },
    rowDetails: {
      alignItems: "flex-end",
      gap: spacing.xxs,
    },
    detailLine: {
      color: colors.textSecondary,
      textAlign: "right",
    },
    detailValue: {
      color: colors.textPrimary,
      textAlign: "right",
    },
    detailStatus: {
      color: colors.accent,
      textAlign: "right",
    },
  });
