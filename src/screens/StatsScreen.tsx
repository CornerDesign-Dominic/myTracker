import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import {
  getSavedAmountForPreviousMonth,
  getSavedAmountForYear,
} from "@/domain/subscriptionHistory/statistics";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptionsHistory } from "@/hooks/useSubscriptionsHistory";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { StatsTabScreenProps } from "@/navigation/types";
import {
  DevelopmentRange,
  DevelopmentPoint,
  DevelopmentSeries,
  buildCostDevelopmentSeries,
  getAverageMonthlyCost,
  getBillingStructure,
  getCurrentMonthCost,
  getProjectedYearlyCost,
  getTopExpensiveSubscriptions,
} from "@/domain/subscriptions/statistics";
import { getMonthlyEquivalent } from "@/domain/subscriptions/metrics";
import { createScreenLayout, createSurfaceStyles, radius, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";

const CHART_HEIGHT = 180;
const Y_AXIS_STEPS = 4;
const X_AXIS_LABEL_AREA = 24;
const PLOT_HEIGHT = CHART_HEIGHT - X_AXIS_LABEL_AREA;
const X_AXIS_LABEL_MIN_WIDTH: Record<DevelopmentRange, number> = {
  6: 44,
  12: 56,
  24: 64,
  36: 38,
  60: 38,
  all: 38,
};
const DEVELOPMENT_RANGE_OPTIONS: Array<{
  key: DevelopmentRange;
  label: "6M" | "1Y" | "2Y" | "3Y" | "5Y" | "ALL";
}> = [
  { key: 6, label: "6M" },
  { key: 12, label: "1Y" },
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

const roundToUnit = (value: number, unit: number) => Math.round(value / unit) * unit;

const formatAxisCurrency = (value: number, currency: "EUR" | "Dollar", language: "de" | "en") =>
  new Intl.NumberFormat(language === "de" ? "de-DE" : "en-US", {
    style: "currency",
    currency: currency === "Dollar" ? "USD" : "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const getShortMonthLabel = (date: Date, language: "de" | "en") =>
  new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
    month: "short",
  }).format(date);

const getShortYearLabel = (date: Date) => String(date.getFullYear()).slice(-2);

const getDevelopmentAxisLabel = (
  date: Date,
  range: DevelopmentRange,
  language: "de" | "en",
) => {
  if (range === 24) {
    return `${getShortMonthLabel(date, language)} ${getShortYearLabel(date)}`;
  }

  if (range === 36 || range === 60 || range === "all") {
    return getShortYearLabel(date);
  }

  return getShortMonthLabel(date, language);
};

const shouldShowBaseDevelopmentAxisLabel = (
  point: DevelopmentPoint,
  index: number,
  range: DevelopmentRange,
) => {
  if (range === 6) {
    return true;
  }

  if (range === 12) {
    return index % 3 === 0;
  }

  if (range === 24) {
    return index % 6 === 0;
  }

  return point.date.getMonth() === 0;
};

const buildDevelopmentAxisLabels = (
  points: DevelopmentPoint[],
  range: DevelopmentRange,
  language: "de" | "en",
  chartWidth: number,
) => {
  if (points.length === 0) {
    return [];
  }

  const candidateIndices = points
    .map((point, index) => (shouldShowBaseDevelopmentAxisLabel(point, index, range) ? index : -1))
    .filter((index) => index >= 0);
  const fallbackIndices = candidateIndices.length > 0 ? candidateIndices : [0];
  const maxVisibleLabels = Math.max(
    1,
    Math.floor(Math.max(chartWidth, 1) / X_AXIS_LABEL_MIN_WIDTH[range]),
  );
  const densityStep = Math.max(1, Math.ceil(fallbackIndices.length / maxVisibleLabels));
  const visibleIndices = new Set(
    fallbackIndices.filter((_, index) => index % densityStep === 0),
  );

  return points.map((point, index) =>
    visibleIndices.has(index) ? getDevelopmentAxisLabel(point.date, range, language) : null,
  );
};

const isYearOnlyDevelopmentRange = (range: DevelopmentRange) =>
  range === 36 || range === 60 || range === "all";

const isWideDevelopmentLabelRange = (range: DevelopmentRange) =>
  range === 6 || range === 12 || isYearOnlyDevelopmentRange(range);

export const StatsScreen = ({ navigation }: StatsTabScreenProps) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { subscriptions, metrics } = useSubscriptions();
  const { history: allHistory } = useSubscriptionsHistory(
    subscriptions.map((subscription) => subscription.id),
  );
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [developmentRange, setDevelopmentRange] = useState<DevelopmentRange>(6);
  const [selectedDevelopmentKey, setSelectedDevelopmentKey] = useState<string | null>(null);
  const [developmentChartWidth, setDevelopmentChartWidth] = useState(0);

  const categoryItems = useMemo(
    () => (showAllCategories ? metrics.byCategory : metrics.byCategory.slice(0, 3)),
    [metrics.byCategory, showAllCategories],
  );
  const maxCategoryValue = categoryItems[0]?.monthlyTotal ?? 1;

  const developmentSeries = useMemo(
    () => buildCostDevelopmentSeries(allHistory, developmentRange, language),
    [allHistory, developmentRange, language],
  );
  const rawMaxDevelopmentValue = Math.max(
    ...developmentSeries.points.map((item) => item.totalAmount),
    1,
  );
  const chartScaleMax = getChartScaleMax(rawMaxDevelopmentValue);
  const axisRoundingUnit = getAxisRoundingUnit(chartScaleMax);
  const yAxisValues = Array.from({ length: Y_AXIS_STEPS }, (_, index) => {
    const ratio = (Y_AXIS_STEPS - index - 1) / (Y_AXIS_STEPS - 1);
    return roundToUnit(chartScaleMax * ratio, axisRoundingUnit);
  });
  const developmentAxisLabels = useMemo(
    () =>
      buildDevelopmentAxisLabels(
        developmentSeries.points,
        developmentRange,
        language,
        developmentChartWidth,
      ),
    [developmentChartWidth, developmentRange, developmentSeries.points, language],
  );
  const billingStructure = useMemo(() => getBillingStructure(subscriptions), [subscriptions]);
  const topSubscriptions = useMemo(
    () => getTopExpensiveSubscriptions(subscriptions, 3),
    [subscriptions],
  );
  const skippedHistory = useMemo(
    () =>
      allHistory.filter(
        (event) => event.type === "payment_skipped_inactive" && !event.deletedAt,
      ),
    [allHistory],
  );
  const currentYearSavedAmount = useMemo(
    () => getSavedAmountForYear(skippedHistory, new Date().getFullYear()),
    [skippedHistory],
  );
  const previousMonthSavedAmount = useMemo(
    () => getSavedAmountForPreviousMonth(skippedHistory),
    [skippedHistory],
  );
  const summary = useMemo(
    () => ({
      currentMonthCost: getCurrentMonthCost(subscriptions),
      averageMonthlyCost: getAverageMonthlyCost(subscriptions),
      yearlyTotal: getProjectedYearlyCost(subscriptions, allHistory),
    }),
    [allHistory, subscriptions],
  );

  useEffect(() => {
    if (developmentSeries.points.length === 0) {
      setSelectedDevelopmentKey(null);
      return;
    }

    if (
      selectedDevelopmentKey &&
      developmentSeries.points.some((point) => point.key === selectedDevelopmentKey)
    ) {
      return;
    }

    setSelectedDevelopmentKey(developmentSeries.points[developmentSeries.points.length - 1]?.key ?? null);
  }, [developmentSeries.points, selectedDevelopmentKey]);

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.contentWithTabBar]}>
        <Text style={[typography.pageTitle, styles.pageTitle]}>{t("stats.title")}</Text>

        <View style={[surfaces.panel, styles.summaryCard]}>
          <SummaryMetric
            label={t("stats.currentMonthCost")}
            value={formatCurrency(summary.currentMonthCost, currency)}
          />
          <View style={styles.summaryDivider} />
          <SummaryMetric
            label={t("stats.averageMonthlyCost")}
            value={formatCurrency(summary.averageMonthlyCost, currency)}
          />
          <View style={styles.summaryDivider} />
          <SummaryMetric
            label={t("stats.yearlyTotal")}
            value={formatCurrency(summary.yearlyTotal, currency)}
          />
        </View>

        <Pressable
          style={[surfaces.panel, styles.card]}
          onPress={() => navigation.navigate("Savings")}
        >
          <View style={styles.cardHeader}>
            <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.savings")}</Text>
            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>
          {skippedHistory.length === 0 ? (
            <Text style={[typography.secondary, styles.helperText]}>
              {t("stats.noSavingsAvailable")}
            </Text>
          ) : (
            <View style={styles.savedCardContent}>
              <View style={styles.savedMetric}>
                <Text style={[typography.meta, styles.savedLabel]}>{t("common.thisYear")}</Text>
                <Text style={[typography.sectionTitle, styles.savedAmount]}>
                  {formatCurrency(currentYearSavedAmount, currency)}
                </Text>
              </View>
              <View style={styles.savedDivider} />
              <View style={styles.savedMetric}>
                <Text style={[typography.meta, styles.savedLabel]}>{t("common.lastMonth")}</Text>
                <Text style={[typography.body, styles.savedSecondaryAmount]}>
                  {formatCurrency(previousMonthSavedAmount, currency)}
                </Text>
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

        <View style={[surfaces.panel, styles.card, styles.developmentCard]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.development")}</Text>
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

          {!developmentSeries.hasHistory ? (
            <EmptyState
              title={t("stats.noDevelopment")}
              description={t("stats.noDevelopmentDescription")}
            />
          ) : (
            <View style={styles.developmentWrap}>
              <View style={styles.yAxis}>
                {yAxisValues.map((value, index) => (
                  <Text key={index} style={[typography.meta, styles.axisLabel]}>
                    {formatAxisCurrency(value, currency, language)}
                  </Text>
                ))}
              </View>
              <View
                style={styles.chartArea}
                onLayout={(event: LayoutChangeEvent) =>
                  setDevelopmentChartWidth(event.nativeEvent.layout.width)
                }
              >
                <View style={styles.yGrid}>
                  {yAxisValues.map((_, index) => (
                    <View key={index} style={styles.gridLine} />
                  ))}
                </View>

                <DevelopmentChart
                  chartWidth={developmentChartWidth}
                  chartScaleMax={chartScaleMax}
                  points={developmentSeries.points}
                  labels={developmentAxisLabels}
                  range={developmentRange}
                  mode={developmentSeries.mode}
                  selectedKey={selectedDevelopmentKey}
                  onSelect={setSelectedDevelopmentKey}
                />
              </View>
            </View>
          )}
        </View>

        <View style={[surfaces.panel, styles.card]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.billingStructure")}</Text>
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
                  <Text style={[typography.secondary, styles.structureMeta]}>
                    {item.count} {t("stats.subscriptionsCount")}
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
                        {subscription.category}
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

const DevelopmentChart = ({
  chartWidth,
  chartScaleMax,
  points,
  labels,
  range,
  mode,
  selectedKey,
  onSelect,
}: {
  chartWidth: number;
  chartScaleMax: number;
  points: DevelopmentPoint[];
  labels: Array<string | null>;
  range: DevelopmentRange;
  mode: DevelopmentSeries["mode"];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) => {
  const { colors, typography } = useAppTheme();
  const styles = getStyles(colors);
  const isYearOnlyRange = isYearOnlyDevelopmentRange(range);
  const isWideLabelRange = isWideDevelopmentLabelRange(range);
  const linePoints = useMemo(
    () => getLinePoints(points, chartWidth, chartScaleMax),
    [chartScaleMax, chartWidth, points],
  );
  const lineSegments = useMemo(() => getLineSegments(linePoints), [linePoints]);

  if (mode === "bar") {
    return (
      <View style={styles.barRow}>
        {points.map((item, index) => {
          const isSelected = item.key === selectedKey;

          return (
            <Pressable key={item.key} style={styles.barColumn} onPress={() => onSelect(item.key)}>
              <View style={styles.barSlot}>
                <View
                  style={[
                    styles.bar,
                    isSelected ? styles.barSelected : null,
                    {
                      height: `${Math.max((item.totalAmount / chartScaleMax) * 100, item.totalAmount > 0 ? 8 : 0)}%`,
                    },
                  ]}
                />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit={!isWideLabelRange}
                minimumFontScale={isWideLabelRange ? 1 : 0.8}
                ellipsizeMode="clip"
                style={[
                  typography.meta,
                  styles.barLabel,
                  isWideLabelRange ? styles.wideBarLabel : null,
                  isYearOnlyRange ? styles.yearOnlyBarLabel : null,
                  !labels[index] ? styles.barLabelHidden : null,
                ]}
              >
                {labels[index] ?? " "}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <>
      <View style={styles.lineCanvas}>
        {lineSegments.map((segment, index) => (
          <View
            key={`${segment.from.key}-${segment.to.key}-${index}`}
            style={[
              styles.lineSegment,
              {
                width: segment.length,
                left: segment.left,
                top: segment.top,
                transform: [{ rotate: `${segment.angle}deg` }],
              },
            ]}
          />
        ))}
        {linePoints.map((point) => {
          const isSelected = point.key === selectedKey;

          return (
            <Pressable
              key={point.key}
              style={[
                styles.linePointPressable,
                {
                  left: point.x - 12,
                  top: point.y - 12,
                },
              ]}
              onPress={() => onSelect(point.key)}
            >
              <View
                style={[
                  styles.linePoint,
                  isSelected ? styles.linePointSelected : null,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.lineLabelRow}>
        {points.map((item, index) => (
          <View key={item.key} style={styles.lineLabelCell}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit={!isWideLabelRange}
              minimumFontScale={isWideLabelRange ? 1 : 0.8}
              ellipsizeMode="clip"
              style={[
                typography.meta,
                styles.barLabel,
                isWideLabelRange ? styles.wideBarLabel : null,
                isYearOnlyRange ? styles.yearOnlyBarLabel : null,
                !labels[index] ? styles.barLabelHidden : null,
              ]}
            >
              {labels[index] ?? " "}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
};

const getLinePoints = (
  points: DevelopmentPoint[],
  chartWidth: number,
  chartScaleMax: number,
) => {
  const width = Math.max(chartWidth - 8, 1);
  const usableHeight = PLOT_HEIGHT;

  return points.map((point, index) => ({
    key: point.key,
    x:
      points.length === 1 ? width / 2 + 4 : (index / Math.max(points.length - 1, 1)) * width + 4,
    y: usableHeight - (point.totalAmount / chartScaleMax) * usableHeight,
  }));
};

const getLineSegments = (points: Array<{ key: string; x: number; y: number }>) =>
  points.slice(0, -1).map((point, index) => {
    const nextPoint = points[index + 1];
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;

    return {
      from: point,
      to: nextPoint,
      length: Math.sqrt(dx * dx + dy * dy),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      left: point.x + dx / 2 - Math.sqrt(dx * dx + dy * dy) / 2,
      top: point.y + dy / 2 - 1,
    };
  });

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
    developmentCard: {
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    sectionDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginTop: -spacing.xs,
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
    helperText: {
      color: colors.textSecondary,
    },
    savedCardContent: {
      gap: spacing.xs,
    },
    savedMetric: {
      gap: spacing.xxs,
    },
    savedLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
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
      gap: 2,
    },
    yAxis: {
      height: CHART_HEIGHT,
      justifyContent: "space-between",
      paddingBottom: X_AXIS_LABEL_AREA,
    },
    axisLabel: {
      color: colors.textSecondary,
      width: 36,
      textAlign: "right",
      fontSize: 10,
      lineHeight: 14,
      paddingRight: 4,
    },
    chartArea: {
      flex: 1,
      gap: spacing.xs,
      minHeight: CHART_HEIGHT + 24,
      marginLeft: -6,
    },
    yGrid: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: PLOT_HEIGHT,
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
      gap: 4,
    },
    barColumn: {
      flex: 1,
      alignItems: "center",
      gap: spacing.xs,
      overflow: "visible",
    },
    barSlot: {
      width: "100%",
      height: PLOT_HEIGHT,
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
    barSelected: {
      backgroundColor: colors.accent,
    },
    barLabel: {
      color: colors.textSecondary,
      textTransform: "capitalize",
      minHeight: 18,
      width: "100%",
      textAlign: "center",
      fontSize: 11,
      lineHeight: 14,
    },
    wideBarLabel: {
      width: 64,
      overflow: "visible",
    },
    yearOnlyBarLabel: {
      width: 72,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: "700",
      overflow: "visible",
    },
    barLabelHidden: {
      color: "transparent",
    },
    lineCanvas: {
      height: PLOT_HEIGHT,
      position: "relative",
      justifyContent: "flex-end",
    },
    lineSegment: {
      position: "absolute",
      height: 2,
      backgroundColor: colors.accent,
    },
    linePointPressable: {
      position: "absolute",
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    linePoint: {
      width: 8,
      height: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    linePointSelected: {
      width: 12,
      height: 12,
      backgroundColor: colors.textPrimary,
      borderColor: colors.accent,
    },
    lineLabelRow: {
      flexDirection: "row",
      marginTop: spacing.xs,
    },
    lineLabelCell: {
      flex: 1,
      alignItems: "center",
      overflow: "visible",
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
