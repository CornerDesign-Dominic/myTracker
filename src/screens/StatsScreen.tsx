import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import {
  DevelopmentRange,
  buildCostDevelopmentSeries,
  getAverageMonthlyCost,
  getBillingStructure,
  getCurrentMonthCost,
  getTopExpensiveSubscriptions,
} from "@/domain/subscriptions/statistics";
import { createScreenLayout, createSurfaceStyles, radius, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";

const CHART_HEIGHT = 180;
const Y_AXIS_STEPS = 4;
const DEVELOPMENT_RANGE_OPTIONS: Array<{
  key: DevelopmentRange;
  label: "6M" | "1Y" | "2Y" | "3Y" | "5Y" | "ALL";
}> = [
  { key: 6, label: "6M" },
  { key: 12, label: "1Y" },
  { key: 24, label: "2Y" },
  { key: 36, label: "3Y" },
  { key: 60, label: "5Y" },
  { key: "all", label: "ALL" },
];

const getChartScaleMax = (value: number) => {
  if (value <= 0) {
    return 300;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  if (normalized <= 1) {
    return 1 * magnitude;
  }

  if (normalized <= 1.5) {
    return 1.5 * magnitude;
  }

  if (normalized <= 2) {
    return 2 * magnitude;
  }

  if (normalized <= 2.5) {
    return 2.5 * magnitude;
  }

  if (normalized <= 5) {
    return 5 * magnitude;
  }

  if (normalized <= 7.5) {
    return 7.5 * magnitude;
  }

  return 10 * magnitude;
};

const getAxisRoundingUnit = (value: number) => {
  if (value >= 5000) {
    return 500;
  }

  if (value >= 1000) {
    return 100;
  }

  if (value >= 500) {
    return 50;
  }

  return 10;
};

const roundToUnit = (value: number, unit: number) =>
  Math.round(value / unit) * unit;

const formatAxisCurrency = (value: number, currency: "EUR" | "Dollar", language: "de" | "en") =>
  new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: currency === "Dollar" ? "USD" : "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const StatsScreen = () => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { subscriptions, metrics } = useSubscriptions();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [developmentRange, setDevelopmentRange] = useState<DevelopmentRange>(6);

  const summary = useMemo(
    () => ({
      currentMonthCost: getCurrentMonthCost(subscriptions),
      averageMonthlyCost: getAverageMonthlyCost(subscriptions),
      yearlyTotal: metrics.yearlyTotal,
    }),
    [metrics.yearlyTotal, subscriptions],
  );

  const categoryItems = useMemo(
    () => (showAllCategories ? metrics.byCategory : metrics.byCategory.slice(0, 3)),
    [metrics.byCategory, showAllCategories],
  );
  const maxCategoryValue = categoryItems[0]?.monthlyTotal ?? 1;

  const developmentSeries = useMemo(
    () => buildCostDevelopmentSeries(subscriptions, developmentRange),
    [developmentRange, subscriptions],
  );
  const rawMaxDevelopmentValue = Math.max(
    ...developmentSeries.map((item) => item.totalAmount),
    1,
  );
  const chartScaleMax = getChartScaleMax(rawMaxDevelopmentValue);
  const axisRoundingUnit = getAxisRoundingUnit(chartScaleMax);
  const chartContentWidth = Math.max(developmentSeries.length * 34, 240);
  const yAxisValues = Array.from({ length: Y_AXIS_STEPS }, (_, index) => {
    const ratio = (Y_AXIS_STEPS - index - 1) / (Y_AXIS_STEPS - 1);
    return roundToUnit(chartScaleMax * ratio, axisRoundingUnit);
  });

  const billingStructure = useMemo(
    () => getBillingStructure(subscriptions),
    [subscriptions],
  );
  const topSubscriptions = useMemo(
    () => getTopExpensiveSubscriptions(subscriptions, 3),
    [subscriptions],
  );

  const copy =
    language === "de"
      ? {
          currentMonthCost: "Aktuelle Monatskosten",
          averageMonthlyCost: "Durchschnittsmonatskosten",
          yearlyTotal: "Jährliche Gesamtkosten",
          development: "Entwicklung",
          billingStructure: "Abrechnungsstruktur",
          topSubscriptions: "Top 3 teuerste Abos",
          tapToExpand: showAllCategories ? "Tippen zum Einklappen" : "Tippen für alle Kategorien",
          noDevelopment: "Noch keine Entwicklung vorhanden",
          noTopSubscriptions: "Noch keine aktiven Abos vorhanden.",
          monthly: "Monatlich",
          quarterly: "Quartal",
          yearly: "Jährlich",
        }
      : {
          currentMonthCost: "Current month cost",
          averageMonthlyCost: "Average monthly cost",
          yearlyTotal: "Yearly total",
          development: "Development",
          billingStructure: "Billing structure",
          topSubscriptions: "Top 3 most expensive subscriptions",
          tapToExpand: showAllCategories ? "Tap to collapse" : "Tap to show all categories",
          noDevelopment: "No development data yet",
          noTopSubscriptions: "No active subscriptions yet.",
          monthly: "Monthly",
          quarterly: "Quarterly",
          yearly: "Yearly",
        };

  const cycleLabel = (cycle: "monthly" | "quarterly" | "yearly") => {
    switch (cycle) {
      case "monthly":
        return copy.monthly;
      case "quarterly":
        return copy.quarterly;
      case "yearly":
        return copy.yearly;
    }
  };

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.contentWithTabBar]}>
        <Text style={[typography.pageTitle, styles.pageTitle]}>{t("stats.title")}</Text>

        <View style={[surfaces.panel, styles.summaryCard]}>
          <SummaryMetric
            label={copy.currentMonthCost}
            value={formatCurrency(summary.currentMonthCost, currency)}
          />
          <View style={styles.summaryDivider} />
          <SummaryMetric
            label={copy.averageMonthlyCost}
            value={formatCurrency(summary.averageMonthlyCost, currency)}
          />
          <View style={styles.summaryDivider} />
          <SummaryMetric
            label={copy.yearlyTotal}
            value={formatCurrency(summary.yearlyTotal, currency)}
          />
        </View>

        <Pressable
          style={[surfaces.panel, styles.card]}
          onPress={() => setShowAllCategories((current) => !current)}
        >
          <View style={styles.cardHeader}>
            <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.byCategory")}</Text>
            <Text style={[typography.secondary, styles.cardHint]}>{copy.tapToExpand}</Text>
          </View>

          {metrics.byCategory.length === 0 ? (
            <EmptyState
              title={t("stats.noCategories")}
              description={t("stats.noCategoriesDescription")}
            />
          ) : (
            <View style={styles.chartList}>
              {categoryItems.map((item) => (
                <View key={item.category} style={styles.chartItem}>
                  <View style={styles.chartHeader}>
                    <Text style={[typography.body, styles.chartLabel]}>{item.category}</Text>
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

        <View style={[surfaces.panel, styles.card]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{copy.development}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rangeSelector}
          >
            {DEVELOPMENT_RANGE_OPTIONS.map((option) => {
              const isActive = option.key === developmentRange;

              return (
                <Pressable
                  key={option.label}
                  style={[
                    styles.rangeChip,
                    isActive ? styles.rangeChipActive : null,
                  ]}
                  onPress={() => setDevelopmentRange(option.key)}
                >
                  <Text
                    style={[
                      typography.meta,
                      styles.rangeChipLabel,
                      isActive ? styles.rangeChipLabelActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {developmentSeries.every((item) => item.totalAmount === 0) ? (
            <Text style={[typography.secondary, styles.helperText]}>{copy.noDevelopment}</Text>
          ) : (
            <View style={styles.developmentWrap}>
              <View style={styles.yAxis}>
                {yAxisValues.map((value, index) => (
                  <Text key={index} style={[typography.meta, styles.axisLabel]}>
                    {formatAxisCurrency(value, currency, language)}
                  </Text>
                ))}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                <View style={[styles.chartArea, { width: chartContentWidth }]}>
                  <View style={styles.yGrid}>
                    {yAxisValues.map((_, index) => (
                      <View key={index} style={styles.gridLine} />
                    ))}
                  </View>

                  <View style={styles.barRow}>
                    {developmentSeries.map((item) => (
                      <View key={item.key} style={styles.barColumn}>
                        <View style={styles.barSlot}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: `${Math.max((item.totalAmount / chartScaleMax) * 100, item.totalAmount > 0 ? 8 : 0)}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[typography.meta, styles.barLabel]}>
                          {new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
                            month: "short",
                          }).format(item.date)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        <View style={[surfaces.panel, styles.card]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{copy.billingStructure}</Text>
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
                  <Text style={[typography.body, styles.structureTitle]}>{cycleLabel(item.cycle)}</Text>
                  <Text style={[typography.secondary, styles.structureMeta]}>
                    {item.count} {language === "de" ? "Abos" : "subscriptions"}
                  </Text>
                </View>
                <Text style={[typography.body, styles.structureValue]}>
                  {formatCurrency(item.totalAmount, currency)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[surfaces.panel, styles.card]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{copy.topSubscriptions}</Text>
          {topSubscriptions.length === 0 ? (
            <Text style={[typography.secondary, styles.helperText]}>{copy.noTopSubscriptions}</Text>
          ) : (
            <View style={styles.topList}>
              {topSubscriptions.map((subscription, index) => (
                <View
                  key={subscription.id}
                  style={[
                    styles.topRow,
                    index < topSubscriptions.length - 1 ? styles.topDivider : null,
                  ]}
                >
                  <View style={styles.topCopy}>
                    <Text style={[typography.body, styles.topName]}>{subscription.name}</Text>
                    <Text style={[typography.secondary, styles.topMeta]}>
                      {subscription.category}
                    </Text>
                  </View>
                  <Text style={[typography.body, styles.topValue]}>
                    {formatCurrency(subscription.amount, currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const SummaryMetric = ({ label, value }: { label: string; value: string }) => {
  const { colors, typography } = useAppTheme();

  return (
    <View>
      <Text style={[typography.meta, { color: colors.textSecondary, textTransform: "uppercase" }]}>
        {label}
      </Text>
      <Text style={[typography.sectionTitle, { color: colors.textPrimary, marginTop: spacing.xxs }]}>
        {value}
      </Text>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    contentWithTabBar: {
      minHeight: "100%",
    },
    pageTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 30,
    },
    summaryCard: {
      gap: spacing.md,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    card: {
      gap: spacing.md,
    },
    rangeSelector: {
      gap: spacing.xs,
    },
    rangeChip: {
      minWidth: 48,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    rangeChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    rangeChipLabel: {
      color: colors.textSecondary,
    },
    rangeChipLabelActive: {
      color: colors.accent,
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
    cardHint: {
      color: colors.textSecondary,
    },
    helperText: {
      color: colors.textSecondary,
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
      color: colors.textSecondary,
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
    developmentWrap: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    yAxis: {
      height: CHART_HEIGHT,
      justifyContent: "space-between",
      paddingBottom: 24,
    },
    axisLabel: {
      color: colors.textSecondary,
      width: 68,
    },
    chartArea: {
      flex: 1,
      gap: spacing.sm,
    },
    chartScroll: {
      flex: 1,
    },
    yGrid: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 24,
      justifyContent: "space-between",
    },
    gridLine: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    barRow: {
      height: CHART_HEIGHT,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
    },
    barColumn: {
      flex: 1,
      alignItems: "center",
      gap: spacing.xs,
    },
    barSlot: {
      width: "100%",
      height: CHART_HEIGHT - 24,
      justifyContent: "flex-end",
      alignItems: "center",
    },
    bar: {
      width: "70%",
      minHeight: 0,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      borderTopLeftRadius: radius.sm,
      borderTopRightRadius: radius.sm,
    },
    barLabel: {
      color: colors.textSecondary,
      textTransform: "capitalize",
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
    },
    structureTitle: {
      color: colors.textPrimary,
    },
    structureMeta: {
      color: colors.textSecondary,
    },
    structureValue: {
      color: colors.textPrimary,
      textAlign: "right",
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
