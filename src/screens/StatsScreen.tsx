import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import {
  buildSavingsSummary,
  getTotalSavedAmount,
} from "@/domain/subscriptionHistory/statistics";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptionsHistory } from "@/hooks/useSubscriptionsHistory";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { StatsTabScreenProps } from "@/navigation/types";
import {
  buildHomeMonthlySummary,
  getStartedSubscriptionsForStatistics,
  getBillingStructure,
  getTopExpensiveSubscriptions,
} from "@/domain/subscriptions/statistics";
import { getMonthlyEquivalent } from "@/domain/subscriptions/metrics";
import { createScreenLayout, createSurfaceStyles, radius, spacing } from "@/theme";
import { SubscriptionHistoryEvent } from "@/types/subscriptionHistory";
import { buildSubscriptionMetrics } from "@/utils/subscriptionMetrics";
import { localizeCategory } from "@/utils/categories";
import { formatCurrency } from "@/utils/currency";
import { parseLocalDateInput } from "@/utils/date";

const getBookedEventYearTotal = (
  history: SubscriptionHistoryEvent[],
  year: number,
) =>
  history.reduce((sum, event) => {
    if (event.type !== "payment_booked" || event.deletedAt) {
      return sum;
    }

    const eventDate = parseLocalDateInput(event.dueDate ?? event.bookedAt ?? "");
    if (!eventDate || eventDate.getFullYear() !== year) {
      return sum;
    }

    return sum + (event.amount ?? 0);
  }, 0);

const getBookedMonthlySummaries = (history: SubscriptionHistoryEvent[]) => {
  const buckets = new Map<string, { totalAmount: number; date: Date }>();

  history.forEach((event) => {
    if (event.type !== "payment_booked" || event.deletedAt) {
      return;
    }

    const eventDate = parseLocalDateInput(event.dueDate ?? event.bookedAt ?? "");
    if (!eventDate) {
      return;
    }

    const key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;
    const existing = buckets.get(key);

    if (existing) {
      existing.totalAmount += event.amount ?? 0;
      return;
    }

    buckets.set(key, {
      totalAmount: event.amount ?? 0,
      date: new Date(eventDate.getFullYear(), eventDate.getMonth(), 1),
    });
  });

  return Array.from(buckets.values()).sort((left, right) => left.date.getTime() - right.date.getTime());
};

const getSkippedMonthlySummaries = (history: SubscriptionHistoryEvent[]) => {
  const buckets = new Map<string, { totalAmount: number; date: Date }>();

  history.forEach((event) => {
    if (event.type !== "payment_skipped_inactive" || event.deletedAt) {
      return;
    }

    const eventDate = parseLocalDateInput(event.dueDate ?? "");
    if (!eventDate) {
      return;
    }

    const key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;
    const existing = buckets.get(key);

    if (existing) {
      existing.totalAmount += event.amount ?? 0;
      return;
    }

    buckets.set(key, {
      totalAmount: event.amount ?? 0,
      date: new Date(eventDate.getFullYear(), eventDate.getMonth(), 1),
    });
  });

  return Array.from(buckets.values()).sort((left, right) => left.date.getTime() - right.date.getTime());
};

export const StatsScreen = ({ navigation }: StatsTabScreenProps) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { subscriptions, isLoading } = useSubscriptions();
  const { history: allHistory, isLoading: isHistoryLoading } = useSubscriptionsHistory(
    subscriptions.map((subscription) => subscription.id),
  );
  const isStatsDataLoading = isLoading || (subscriptions.length > 0 && isHistoryLoading);
  const [hasResolvedInitialStatsData, setHasResolvedInitialStatsData] = useState(
    !isStatsDataLoading,
  );
  const contentOpacity = useRef(
    new Animated.Value(hasResolvedInitialStatsData ? 1 : 0),
  ).current;
  const [showAllCategories, setShowAllCategories] = useState(false);

  const statisticsSubscriptions = useMemo(
    () => getStartedSubscriptionsForStatistics(subscriptions, allHistory, new Date()),
    [allHistory, subscriptions],
  );
  const statisticsMetrics = useMemo(
    () => buildSubscriptionMetrics(statisticsSubscriptions, language),
    [language, statisticsSubscriptions],
  );
  const displayedCategoryItems = useMemo(
    () =>
      showAllCategories
        ? statisticsMetrics.byCategory
        : statisticsMetrics.byCategory.slice(0, 3),
    [showAllCategories, statisticsMetrics.byCategory],
  );
  const maxCategoryValue = displayedCategoryItems[0]?.monthlyTotal ?? 1;
  const billingStructure = useMemo(
    () => getBillingStructure(statisticsSubscriptions),
    [statisticsSubscriptions],
  );
  const topSubscriptions = useMemo(
    () => getTopExpensiveSubscriptions(statisticsSubscriptions, 5),
    [statisticsSubscriptions],
  );
  const skippedHistory = useMemo(
    () =>
      allHistory.filter(
        (event) => event.type === "payment_skipped_inactive" && !event.deletedAt,
      ),
    [allHistory],
  );
  const savingsSummary = useMemo(
    () => buildSavingsSummary(subscriptions, skippedHistory, new Date()),
    [skippedHistory, subscriptions],
  );
  const totalSavedAmount = useMemo(
    () => getTotalSavedAmount(skippedHistory),
    [skippedHistory],
  );
  const savingsSummaryLabels = useMemo(() => {
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
      currentMonthProjection: t("stats.currentMonthProjectedShort", {
        month: monthFormatter.format(now),
      }),
      currentYearProjection: t("stats.currentYearProjectedShort", {
        year: String(now.getFullYear()),
      }),
    };
  }, [language, t]);
  const homeStyleSummary = useMemo(() => {
    const now = new Date();
    const summary = buildHomeMonthlySummary(subscriptions, allHistory, now);

    return {
      ...summary,
      monthLabel: new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
        month: "long",
      }).format(now),
    };
  }, [allHistory, language, subscriptions]);
  const yearlyActualSummary = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return {
      currentYear,
      currentYearTotal: getBookedEventYearTotal(allHistory, currentYear),
      previousYearTotal: getBookedEventYearTotal(allHistory, currentYear - 1),
    };
  }, [allHistory]);
  const developmentSummary = useMemo(() => {
    const monthlySummaries = getBookedMonthlySummaries(allHistory);
    const totalActualAmount = monthlySummaries.reduce(
      (sum, item) => sum + item.totalAmount,
      0,
    );
    const averageMonthlyActual =
      monthlySummaries.length > 0 ? totalActualAmount / monthlySummaries.length : 0;
    const highestActualMonth =
      monthlySummaries.reduce<{ totalAmount: number; date: Date } | null>((highest, item) => {
        if (!highest || item.totalAmount > highest.totalAmount) {
          return item;
        }

        return highest;
      }, null);

    return {
      currentMonthProjected: homeStyleSummary.totalAmount,
      averageMonthlyActual,
      highestActualMonth,
      highestActualMonthLabel: highestActualMonth
        ? new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
            month: "long",
            year: "numeric",
          }).format(highestActualMonth.date)
        : null,
    };
  }, [allHistory, homeStyleSummary.totalAmount, language]);
  const savingsDevelopmentSummary = useMemo(() => {
    const monthlySummaries = getSkippedMonthlySummaries(skippedHistory);
    const totalActualAmount = monthlySummaries.reduce(
      (sum, item) => sum + item.totalAmount,
      0,
    );
    const averageMonthlyActual =
      monthlySummaries.length > 0 ? totalActualAmount / monthlySummaries.length : 0;
    const highestActualMonth =
      monthlySummaries.reduce<{ totalAmount: number; date: Date } | null>((highest, item) => {
        if (!highest || item.totalAmount > highest.totalAmount) {
          return item;
        }

        return highest;
      }, null);

    return {
      currentMonthProjected: savingsSummary.currentMonthProjected,
      averageMonthlyActual,
      highestActualMonth,
      highestActualMonthLabel: highestActualMonth
        ? new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
            month: "long",
            year: "numeric",
          }).format(highestActualMonth.date)
        : null,
    };
  }, [language, savingsSummary.currentMonthProjected, skippedHistory]);

  useEffect(() => {
    if (hasResolvedInitialStatsData || isStatsDataLoading) {
      return;
    }

    setHasResolvedInitialStatsData(true);
  }, [contentOpacity, hasResolvedInitialStatsData, isStatsDataLoading]);

  useEffect(() => {
    if (!hasResolvedInitialStatsData) {
      contentOpacity.setValue(0);
      return;
    }

    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [contentOpacity, hasResolvedInitialStatsData]);

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.contentWithTabBar]}>
        <View style={styles.titleRow}>
          <Text style={[typography.pageTitle, styles.pageTitle]}>{t("stats.title")}</Text>
        </View>

        {!hasResolvedInitialStatsData ? (
          <StatsScreenSkeleton
            surfaces={surfaces}
            styles={styles}
          />
        ) : (
          <Animated.View style={[styles.loadedContent, { opacity: contentOpacity }]}>
        <Pressable
          style={[surfaces.mainPanel, styles.summaryCard]}
          onPress={() => navigation.navigate("MonthlyPreview")}
        >
          <Text style={[typography.meta, styles.homeSummaryMonth]}>
            {homeStyleSummary.monthLabel}
          </Text>
          <View style={styles.homeSummaryRow}>
            <View style={styles.homeSummaryPrimaryBlock}>
              <Text style={[typography.meta, styles.homeSummaryLabel]}>{t("home.total")}</Text>
              <Text style={[typography.metric, styles.homeSummaryAmount]}>
                {formatCurrency(homeStyleSummary.totalAmount, currency)}
              </Text>
              <Text style={[typography.secondary, styles.homeSummaryLink]}>
                {t("home.monthlyPreviewLink")}
              </Text>
            </View>

            <View style={styles.homeSummarySecondaryBlock}>
              <View style={styles.homeSummarySecondaryItem}>
                <Text style={[typography.meta, styles.homeSummaryLabel]}>{t("home.due")}</Text>
                <Text style={[typography.body, styles.homeSummaryDueValue]}>
                  {formatCurrency(homeStyleSummary.dueAmount, currency)}
                </Text>
              </View>
              <View style={styles.homeSummarySecondaryItem}>
                <Text style={[typography.meta, styles.homeSummaryLabel]}>{t("home.paid")}</Text>
                <Text style={[typography.body, styles.homeSummarySecondaryValue]}>
                  {formatCurrency(homeStyleSummary.paidAmount, currency)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.homeSummaryDivider} />
          <View style={styles.homeSummaryYearRow}>
            <View style={styles.homeSummaryYearItem}>
              <Text style={[typography.meta, styles.homeSummaryLabel]}>
                {t("stats.yearActualCurrent", { year: yearlyActualSummary.currentYear })}
              </Text>
              <Text style={[typography.body, styles.homeSummarySecondaryValue]}>
                {formatCurrency(yearlyActualSummary.currentYearTotal, currency)}
              </Text>
            </View>
            <View style={styles.homeSummaryYearItem}>
              <Text style={[typography.meta, styles.homeSummaryLabel]}>
                {t("stats.yearActualPrevious", { year: yearlyActualSummary.currentYear - 1 })}
              </Text>
              <Text style={[typography.body, styles.homeSummarySecondaryValue]}>
                {formatCurrency(yearlyActualSummary.previousYearTotal, currency)}
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          style={[surfaces.panel, styles.card]}
          onPress={() => navigation.navigate("Savings")}
        >
          <View style={styles.cardHeader}>
            <Text style={[typography.cardTitle, styles.cardTitle]}>
              {t("stats.savingsCardTitle")}
            </Text>
          </View>
          {skippedHistory.length === 0 ? (
            <Text style={[typography.secondary, styles.helperText]}>
              {t("stats.noSavingsAvailable")}
            </Text>
          ) : (
            <View style={styles.savedCardContent}>
              <View style={styles.savedMetric}>
                <Text style={[typography.meta, styles.savedLabel]}>
                  {t("stats.savingsAllTime")}
                </Text>
                <Text style={[typography.sectionTitle, styles.savedAmountAccent]}>
                  {formatCurrency(totalSavedAmount, currency)}
                </Text>
              </View>
              <View style={styles.savedDivider} />
              <Text style={[typography.meta, styles.savedSectionLabel]}>
                {t("stats.savingsPerYear")}
              </Text>
              <View style={styles.savedSummaryRow}>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsSummaryLabels.currentYear}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmount]}>
                    {formatCurrency(savingsSummary.currentYearActual, currency)}
                  </Text>
                </View>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsSummaryLabels.previousYear}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmount]}>
                    {formatCurrency(savingsSummary.previousYearActual, currency)}
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
                    {savingsSummaryLabels.currentMonth}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmount]}>
                    {formatCurrency(savingsSummary.currentMonthActual, currency)}
                  </Text>
                </View>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsSummaryLabels.previousMonth}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmount]}>
                    {formatCurrency(savingsSummary.previousMonthActual, currency)}
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
                    {savingsSummaryLabels.currentMonthProjection}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmountAccent]}>
                    {formatCurrency(savingsSummary.currentMonthProjected, currency)}
                  </Text>
                </View>
                <View style={styles.savedMetric}>
                  <Text style={[typography.meta, styles.savedLabel]}>
                    {savingsSummaryLabels.currentYearProjection}
                  </Text>
                  <Text style={[typography.sectionTitle, styles.savedAmountAccent]}>
                    {formatCurrency(savingsSummary.currentYearProjected, currency)}
                  </Text>
                </View>
              </View>
              <View style={styles.savedFooter}>
                <Text style={[typography.secondary, styles.savedFooterText]}>
                  {t("stats.savingsFooter")}
                </Text>
                <Ionicons
                  name="chevron-forward-outline"
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[surfaces.panel, styles.card]}
          onPress={() => setShowAllCategories((current) => !current)}
        >
          <View style={styles.cardHeader}>
            <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.byCategory")}</Text>
            <Ionicons
              name={showAllCategories ? "chevron-up-outline" : "chevron-down-outline"}
              size={18}
              color={colors.textSecondary}
            />
          </View>

          {statisticsMetrics.byCategory.length === 0 ? (
            <Text style={[typography.secondary, styles.helperText]}>
              {t("stats.noSubscriptionsAvailable")}
            </Text>
          ) : (
            <View style={styles.chartList}>
              {displayedCategoryItems.map((item) => (
                <View key={item.category} style={styles.chartItem}>
                  <View style={styles.chartHeader}>
                    <Text style={[typography.body, styles.chartLabel]}>
                      {localizeCategory(item.category, language)}
                    </Text>
                    <Text style={[typography.secondary, styles.chartValue]}>
                      {formatCurrency(item.monthlyTotal, currency)}
                    </Text>
                  </View>
                  <View style={styles.chartTrack}>
                    <View
                      style={[
                        styles.chartFill,
                        {
                          width: `${Math.max((item.monthlyTotal / maxCategoryValue) * 100, 10)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Pressable>

        <View style={[surfaces.panel, styles.card, styles.developmentCard]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.development")}</Text>
          <View style={styles.developmentCompareHeader}>
            <Text style={[typography.meta, styles.developmentCompareHeading]}>
              {t("stats.costsColumn")}
            </Text>
            <Text style={[typography.meta, styles.developmentCompareHeading, styles.developmentCompareHeadingRight]}>
              {t("stats.savingsColumn")}
            </Text>
          </View>
          <View style={styles.developmentSummaryList}>
            <View style={styles.developmentSummaryRow}>
              <View style={styles.developmentSummaryItem}>
                <Text style={[typography.meta, styles.developmentSummaryLabel]}>
                  {t("stats.currentMonthProjected", { month: homeStyleSummary.monthLabel })}
                </Text>
                <Text style={[typography.sectionTitle, styles.developmentSummaryValue]}>
                  {formatCurrency(developmentSummary.currentMonthProjected, currency)}
                </Text>
              </View>
              <View style={styles.developmentSummaryItem}>
                <Text style={[typography.meta, styles.developmentSummaryLabel]}>
                  {t("stats.currentMonthProjectedSavings", {
                    month: homeStyleSummary.monthLabel,
                  })}
                </Text>
                <Text style={[typography.sectionTitle, styles.developmentSummaryValue]}>
                  {formatCurrency(savingsDevelopmentSummary.currentMonthProjected, currency)}
                </Text>
              </View>
            </View>
            <View style={styles.savedDivider} />
            <View style={styles.developmentSummaryRow}>
              <View style={styles.developmentSummaryItem}>
                <Text style={[typography.meta, styles.developmentSummaryLabel]}>
                  {t("stats.averageMonthlyActual")}
                </Text>
                <Text style={[typography.sectionTitle, styles.developmentSummaryValue]}>
                  {formatCurrency(developmentSummary.averageMonthlyActual, currency)}
                </Text>
              </View>
              <View style={styles.developmentSummaryItem}>
                <Text style={[typography.meta, styles.developmentSummaryLabel]}>
                  {t("stats.averageMonthlySavings")}
                </Text>
                <Text style={[typography.sectionTitle, styles.developmentSummaryValue]}>
                  {formatCurrency(savingsDevelopmentSummary.averageMonthlyActual, currency)}
                </Text>
              </View>
            </View>
            <View style={styles.savedDivider} />
            <View style={styles.developmentSummaryRow}>
              <View style={styles.developmentSummaryItem}>
                <Text style={[typography.meta, styles.developmentSummaryLabel]}>
                  {t("stats.highestActualMonth")}
                </Text>
                <Text style={[typography.sectionTitle, styles.developmentSummaryValue]}>
                  {formatCurrency(developmentSummary.highestActualMonth?.totalAmount ?? 0, currency)}
                </Text>
                <Text style={[typography.secondary, styles.developmentSummaryMeta]}>
                  {developmentSummary.highestActualMonthLabel ?? t("stats.highestActualMonthEmpty")}
                </Text>
              </View>
              <View style={styles.developmentSummaryItem}>
                <Text style={[typography.meta, styles.developmentSummaryLabel]}>
                  {t("stats.highestSavedMonth")}
                </Text>
                <Text style={[typography.sectionTitle, styles.developmentSummaryValue]}>
                  {formatCurrency(savingsDevelopmentSummary.highestActualMonth?.totalAmount ?? 0, currency)}
                </Text>
                <Text style={[typography.secondary, styles.developmentSummaryMeta]}>
                  {savingsDevelopmentSummary.highestActualMonthLabel ?? t("stats.highestSavedMonthEmpty")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable
          style={[surfaces.panel, styles.card]}
          onPress={() => navigation.navigate("BillingFrequency")}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderCopy}>
              <Text style={[typography.cardTitle, styles.cardTitle]}>
                {t("stats.billingStructure")}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.sectionDivider} />
          <View style={styles.structureList}>
            {billingStructure.map((item, index) => (
              <View
                key={item.cycle}
                style={[
                  styles.structureRow,
                  index < billingStructure.length - 1 ? styles.structureDivider : null,
                ]}
              >
                <View style={styles.structureCopy}>
                  <Text style={[typography.body, styles.structureTitle]}>
                    {t(`subscription.billing_${item.cycle}`)}
                  </Text>
                </View>
                <Text style={[typography.secondary, styles.structureMeta]}>
                  {item.count} {t("stats.subscriptionsCount")}
                </Text>
                <Text style={[typography.body, styles.structureValue]}>
                  {formatCurrency(item.totalAmount, currency)}
                </Text>
              </View>
            ))}
          </View>
        </Pressable>

        <View style={[surfaces.panel, styles.card]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.topSubscriptions")}</Text>
          {topSubscriptions.length === 0 ? (
            <Text style={[typography.secondary, styles.helperText]}>{t("stats.noActive")}</Text>
          ) : (
            <View style={styles.topList}>
              <View style={styles.sectionDivider} />
              {topSubscriptions.map((subscription, index) => (
                <View
                  key={subscription.id}
                  style={[
                    styles.topRow,
                    index < topSubscriptions.length - 1 ? styles.topDivider : null,
                  ]}
                >
                  <View style={styles.topMain}>
                    <SubscriptionAvatar
                      name={subscription.name}
                      category={subscription.category}
                      size={40}
                    />
                    <View style={styles.topCopy}>
                      <Text style={[typography.body, styles.topName]}>{subscription.name}</Text>
                      <Text style={[typography.secondary, styles.topMeta]}>
                    {localizeCategory(subscription.category, language)}
                  </Text>
                    </View>
                  </View>
                  <Text style={[typography.body, styles.topValue]}>
                    {`${formatCurrency(getMonthlyEquivalent(subscription), currency)} ${t("stats.perMonth")}`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const StatsScreenSkeleton = ({
  surfaces,
  styles,
}: {
  surfaces: ReturnType<typeof createSurfaceStyles>;
  styles: ReturnType<typeof getStyles>;
}) => (
  <View style={styles.skeletonLayout}>
    <View style={[surfaces.mainPanel, styles.summaryCard]}>
      <View style={[styles.skeletonBlock, styles.skeletonMonth]} />
      <View style={styles.homeSummaryRow}>
        <View style={styles.homeSummaryPrimaryBlock}>
          <View style={[styles.skeletonBlock, styles.skeletonLabel]} />
          <View style={[styles.skeletonBlock, styles.skeletonAmount]} />
          <View style={[styles.skeletonBlock, styles.skeletonLink]} />
        </View>
        <View style={styles.homeSummarySecondaryBlock}>
          <View style={styles.homeSummarySecondaryItem}>
            <View style={[styles.skeletonBlock, styles.skeletonLabel]} />
            <View style={[styles.skeletonBlock, styles.skeletonValue]} />
          </View>
          <View style={styles.homeSummarySecondaryItem}>
            <View style={[styles.skeletonBlock, styles.skeletonLabel]} />
            <View style={[styles.skeletonBlock, styles.skeletonValue]} />
          </View>
        </View>
      </View>
      <View style={styles.homeSummaryDivider} />
      <View style={styles.homeSummaryYearRow}>
        <View style={styles.homeSummaryYearItem}>
          <View style={[styles.skeletonBlock, styles.skeletonLabel]} />
          <View style={[styles.skeletonBlock, styles.skeletonValue]} />
        </View>
        <View style={styles.homeSummaryYearItem}>
          <View style={[styles.skeletonBlock, styles.skeletonLabel]} />
          <View style={[styles.skeletonBlock, styles.skeletonValue]} />
        </View>
      </View>
    </View>

    {[0, 1, 2, 3, 4].map((item) => (
      <View key={item} style={[surfaces.panel, styles.card, styles.skeletonCard]}>
        <View style={styles.cardHeader}>
          <View style={[styles.skeletonBlock, styles.skeletonCardTitle]} />
          <View style={[styles.skeletonCircle, styles.skeletonIcon]} />
        </View>
        <View style={styles.skeletonCardBody}>
          {item === 2 ? (
            <View style={[styles.skeletonBlock, styles.skeletonChartArea]} />
          ) : (
            <>
              <View style={[styles.skeletonBlock, styles.skeletonLineLong]} />
              <View style={[styles.skeletonBlock, styles.skeletonLineMedium]} />
              <View style={[styles.skeletonBlock, styles.skeletonLineShort]} />
            </>
          )}
        </View>
      </View>
    ))}
  </View>
);

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    contentWithTabBar: {
      minHeight: "100%",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      minHeight: 40,
    },
    pageTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 30,
    },
    summaryCard: {
      gap: spacing.md,
    },
    loadedContent: {
      gap: spacing.lg,
    },
    skeletonLayout: {
      gap: spacing.lg,
    },
    skeletonBlock: {
      borderRadius: 999,
      backgroundColor: colors.surfaceSoft,
    },
    skeletonCircle: {
      borderRadius: 999,
      backgroundColor: colors.surfaceSoft,
    },
    skeletonMonth: {
      width: 132,
      height: 24,
    },
    skeletonLabel: {
      width: 72,
      height: 12,
    },
    skeletonAmount: {
      width: 170,
      height: 34,
      borderRadius: 16,
    },
    skeletonLink: {
      width: 116,
      height: 16,
    },
    skeletonValue: {
      width: 88,
      height: 18,
    },
    skeletonCard: {
      gap: spacing.md,
    },
    skeletonCardTitle: {
      width: 148,
      height: 18,
      borderRadius: 10,
    },
    skeletonIcon: {
      width: 18,
      height: 18,
    },
    skeletonCardBody: {
      gap: spacing.md,
    },
    skeletonLineLong: {
      width: "92%",
      height: 16,
      borderRadius: 10,
    },
    skeletonLineMedium: {
      width: "74%",
      height: 16,
      borderRadius: 10,
    },
    skeletonLineShort: {
      width: "58%",
      height: 16,
      borderRadius: 10,
    },
    skeletonChartArea: {
      width: "100%",
      height: 148,
      borderRadius: radius.md,
    },
    homeSummaryMonth: {
      color: colors.textSecondary,
      textTransform: "capitalize",
      fontSize: 22,
      lineHeight: 28,
    },
    homeSummaryRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    homeSummaryPrimaryBlock: {
      flex: 1,
      gap: spacing.xxs,
      minWidth: 0,
    },
    homeSummarySecondaryBlock: {
      minWidth: 108,
      gap: spacing.xs,
      paddingTop: 2,
    },
    homeSummarySecondaryItem: {
      gap: 2,
    },
    homeSummaryLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    homeSummaryAmount: {
      color: colors.textPrimary,
      fontSize: 28,
      lineHeight: 34,
      flexShrink: 1,
    },
    homeSummaryLink: {
      color: colors.accent,
    },
    homeSummarySecondaryValue: {
      color: colors.textPrimary,
    },
    homeSummaryDueValue: {
      color: colors.accent,
    },
    homeSummaryDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    homeSummaryYearRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    homeSummaryYearItem: {
      flex: 1,
      gap: spacing.xxs,
    },
    card: {
      gap: spacing.md,
    },
    developmentCard: {
      gap: spacing.md,
    },
    sectionDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginTop: -spacing.xs,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.md,
    },
    cardHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },
    cardTitle: {
      color: colors.textPrimary,
    },
    helperText: {
      color: colors.textSecondary,
    },
    savedCardContent: {
      gap: spacing.md,
    },
    savedSummaryRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    savedMetric: {
      flex: 1,
      gap: spacing.xxs,
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
    savedDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    savedAmount: {
      color: colors.textPrimary,
    },
    savedSecondaryAmount: {
      color: colors.textPrimary,
    },
    savedAmountAccent: {
      color: colors.accent,
    },
    developmentSummaryList: {
      gap: spacing.md,
    },
    developmentCompareHeader: {
      flexDirection: "row",
      gap: spacing.md,
    },
    developmentCompareHeading: {
      flex: 1,
      color: colors.accent,
      textTransform: "uppercase",
    },
    developmentCompareHeadingRight: {
      textAlign: "left",
    },
    developmentSummaryRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    developmentSummaryItem: {
      flex: 1,
      gap: spacing.xxs,
    },
    developmentSummaryLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
    },
    developmentSummaryValue: {
      color: colors.textPrimary,
    },
    developmentSummaryMeta: {
      color: colors.textSecondary,
      textTransform: "capitalize",
    },
    savedFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    savedFooterText: {
      color: colors.textSecondary,
      flex: 1,
    },
    chartList: {
      gap: spacing.md,
    },
    chartItem: {
      gap: spacing.xs,
    },
    chartHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    chartLabel: {
      color: colors.textPrimary,
    },
    chartValue: {
      color: colors.textPrimary,
      fontWeight: "600",
    },
    chartTrack: {
      width: "100%",
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSoft,
      overflow: "hidden",
    },
    chartFill: {
      height: "100%",
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
    },
    structureList: {
      gap: spacing.xs,
    },
    structureRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    structureDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    structureCopy: {
      flex: 1,
      gap: spacing.xxs,
      minWidth: 0,
    },
    structureTitle: {
      color: colors.accent,
    },
    structureMeta: {
      color: colors.textPrimary,
      minWidth: 80,
      textAlign: "center",
    },
    structureValue: {
      color: colors.textPrimary,
      textAlign: "right",
      minWidth: 92,
    },
    topList: {
      gap: spacing.xs,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    topMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    topDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    topCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    topName: {
      color: colors.textPrimary,
    },
    topMeta: {
      color: colors.textSecondary,
    },
    topValue: {
      color: colors.textPrimary,
      textAlign: "right",
    },
  });
