import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StatsCarousel, StatsCarouselPage } from "@/components/StatsCarousel";
import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { useAppSettings } from "@/context/AppSettingsContext";
import { getMonthlyEquivalent } from "@/domain/subscriptions/metrics";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useStatsProjection } from "@/hooks/useStatsProjection";
import { StatsTabScreenProps } from "@/navigation/types";
import { createScreenLayout, createSurfaceStyles, radius, spacing } from "@/theme";
import { localizeCategory } from "@/utils/categories";
import { formatCurrency } from "@/utils/currency";

export const StatsScreen = ({ navigation }: StatsTabScreenProps) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const {
    isStatsDataLoading,
    homeStyleSummary,
    savingsOverview,
    yearlyActualSummary,
    developmentSummary,
    savingsDevelopmentSummary,
    statsSubscriptionsProjection,
    statisticsMetrics,
  } = useStatsProjection();
  const [hasResolvedInitialStatsData, setHasResolvedInitialStatsData] = useState(
    !isStatsDataLoading,
  );
  const contentOpacity = useRef(
    new Animated.Value(hasResolvedInitialStatsData ? 1 : 0),
  ).current;
  const [showAllCategories, setShowAllCategories] = useState(false);
  const displayedCategoryItems = useMemo(
    () =>
      showAllCategories
        ? statisticsMetrics.byCategory
        : statisticsMetrics.byCategory.slice(0, 3),
    [showAllCategories, statisticsMetrics.byCategory],
  );
  const maxCategoryValue = displayedCategoryItems[0]?.monthlyTotal ?? 1;

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

  const wrapPageContent = (content: React.ReactNode) => (
    <ScrollView
      style={styles.pageScroll}
      contentContainerStyle={styles.pageScrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
      nestedScrollEnabled
    >
      {content}
    </ScrollView>
  );

  const summaryPage = wrapPageContent(
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
    </Pressable>,
  );

  const savingsPage = wrapPageContent(
    <Pressable
      style={[surfaces.panel, styles.card]}
      onPress={() => navigation.navigate("Savings")}
    >
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
        <View style={styles.savedCardContent}>
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
    </Pressable>,
  );

  const categoriesPage = wrapPageContent(
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
    </Pressable>,
  );

  const developmentPage = wrapPageContent(
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
    </View>,
  );

  const billingPage = wrapPageContent(
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
        {statsSubscriptionsProjection.billingStructure.map((item, index) => (
          <View
            key={item.cycle}
            style={[
              styles.structureRow,
              index < statsSubscriptionsProjection.billingStructure.length - 1
                ? styles.structureDivider
                : null,
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
    </Pressable>,
  );

  const topSubscriptionsPage = wrapPageContent(
    <View style={[surfaces.panel, styles.card]}>
      <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.topSubscriptions")}</Text>
      {statsSubscriptionsProjection.topSubscriptions.length === 0 ? (
        <Text style={[typography.secondary, styles.helperText]}>{t("stats.noActive")}</Text>
      ) : (
        <View style={styles.topList}>
          <View style={styles.sectionDivider} />
          {statsSubscriptionsProjection.topSubscriptions.map((subscription, index) => (
            <View
              key={subscription.id}
              style={[
                styles.topRow,
                index < statsSubscriptionsProjection.topSubscriptions.length - 1
                  ? styles.topDivider
                  : null,
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
    </View>,
  );

  const carouselPages = useMemo<StatsCarouselPage[]>(
    () => [
      {
        key: "summary",
        headerClaim: t("stats.summaryClaim", {
          amount: formatCurrency(homeStyleSummary.totalAmount, currency),
        }),
        content: summaryPage,
      },
      {
        key: "savings",
        headerClaim: t("stats.savingsClaim", {
          amount: formatCurrency(savingsOverview.totalSavedAmount, currency),
        }),
        content: savingsPage,
      },
      {
        key: "categories",
        headerClaim: t("stats.categoriesClaim", {
          label:
            statisticsMetrics.byCategory[0]
              ? localizeCategory(statisticsMetrics.byCategory[0].category, language)
              : t("stats.noCategories"),
        }),
        content: categoriesPage,
      },
      {
        key: "development",
        headerClaim: t("stats.developmentClaim", {
          amount: formatCurrency(developmentSummary.currentMonthProjected, currency),
        }),
        content: developmentPage,
      },
      {
        key: "billing",
        headerClaim: t("stats.billingClaim", {
          count: String(
            statsSubscriptionsProjection.billingStructure.reduce(
              (sum, item) => sum + item.count,
              0,
            ),
          ),
        }),
        content: billingPage,
      },
      {
        key: "top-subscriptions",
        headerClaim: t("stats.topSubscriptionsClaim", {
          name:
            statsSubscriptionsProjection.topSubscriptions[0]?.name ??
            t("stats.noActive"),
        }),
        content: topSubscriptionsPage,
      },
    ],
    [
      categoriesPage,
      currency,
      developmentPage,
      developmentSummary.currentMonthProjected,
      homeStyleSummary.totalAmount,
      language,
      billingPage,
      savingsOverview.totalSavedAmount,
      savingsPage,
      statsSubscriptionsProjection.billingStructure,
      statsSubscriptionsProjection.topSubscriptions,
      statisticsMetrics.byCategory,
      summaryPage,
      t,
      topSubscriptionsPage,
    ],
  );

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <View style={[layout.content, styles.contentWithTabBar]}>
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
            <StatsCarousel pages={carouselPages} />
          </Animated.View>
        )}
      </View>
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
    <View style={[surfaces.mainPanel, styles.skeletonHeaderCard]}>
      <View style={[styles.skeletonBlock, styles.skeletonHeaderLine]} />
      <View style={[styles.skeletonBlock, styles.skeletonHeaderLineShort]} />
    </View>

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
  </View>
);

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    contentWithTabBar: {
      minHeight: "100%",
      flex: 1,
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
      flex: 1,
    },
    pageScroll: {
      flex: 1,
    },
    pageScrollContent: {
      paddingBottom: spacing.xs,
    },
    skeletonLayout: {
      flex: 1,
      gap: spacing.lg,
    },
    skeletonHeaderCard: {
      minHeight: 84,
      justifyContent: "center",
      gap: spacing.sm,
    },
    skeletonHeaderLine: {
      width: "72%",
      height: 18,
      borderRadius: 12,
    },
    skeletonHeaderLineShort: {
      width: "48%",
      height: 18,
      borderRadius: 12,
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
