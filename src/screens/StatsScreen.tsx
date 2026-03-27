import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

export const StatsScreen = () => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const { metrics } = useSubscriptions();
  const maxCategoryValue = metrics.byCategory[0]?.monthlyTotal ?? 1;

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.contentWithTabBar]}>
        <SectionHeader
          title={t("stats.title")}
          subtitle={t("stats.subtitle")}
        />

        <View style={styles.statsRow}>
          <StatCard
            label={t("stats.monthlySpend")}
            value={formatCurrency(metrics.monthlyTotal)}
            tone="accent"
          />
          <StatCard label={t("stats.yearlySpend")} value={formatCurrency(metrics.yearlyTotal)} />
        </View>

        <View style={[surfaces.panel, styles.card]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.mostExpensive")}</Text>
          {metrics.mostExpensive ? (
            <>
              <Text style={[typography.pageTitle, styles.highlightName]}>
                {metrics.mostExpensive.name}
              </Text>
              <Text style={[typography.secondary, styles.highlightValue]}>
                {formatCurrency(
                  metrics.mostExpensive.price,
                  metrics.mostExpensive.currency,
                )}{" "}
                / {metrics.mostExpensive.billingCycle}
              </Text>
            </>
          ) : (
            <Text style={[typography.secondary, styles.helperText]}>
              {t("stats.noActive")}
            </Text>
          )}
        </View>

        <View style={[surfaces.panel, styles.card]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.byCategory")}</Text>
          {metrics.byCategory.length === 0 ? (
            <EmptyState
              title={t("stats.noCategories")}
              description={t("stats.noCategoriesDescription")}
            />
          ) : (
            <View style={styles.chartList}>
              {metrics.byCategory.map((item) => (
                <View key={item.category} style={styles.chartItem}>
                  <View style={styles.chartHeader}>
                    <Text style={[typography.body, styles.chartLabel]}>{item.category}</Text>
                    <Text style={[typography.secondary, styles.chartValue]}>
                      {formatCurrency(item.monthlyTotal)}
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
        </View>

        <View style={[surfaces.panel, styles.card]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{t("stats.upcomingPayments")}</Text>
          {metrics.nextPayments.length === 0 ? (
            <Text style={[typography.secondary, styles.helperText]}>
              {t("stats.noUpcoming")}
            </Text>
          ) : (
            <View style={styles.paymentList}>
              {metrics.nextPayments.map((item) => (
                <View key={item.id} style={styles.paymentRow}>
                  <View>
                    <Text style={[typography.body, styles.paymentName]}>{item.name}</Text>
                    <Text style={[typography.secondary, styles.paymentMeta]}>{item.category}</Text>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={[typography.body, styles.paymentAmount]}>
                      {formatCurrency(item.price, item.currency)}
                    </Text>
                    <Text style={[typography.secondary, styles.paymentMeta]}>
                      {formatDate(item.nextPaymentDate)}
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
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  contentWithTabBar: {
    minHeight: "100%",
  },
  card: {
    gap: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  highlightName: {
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
  },
  highlightValue: {
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
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    overflow: "hidden",
  },
  chartFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 999,
  },
  paymentList: {
    gap: spacing.md,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  paymentName: {
    color: colors.textPrimary,
  },
  paymentAmount: {
    color: colors.textPrimary,
    textAlign: "right",
  },
  paymentMeta: {
    color: colors.textSecondary,
  },
  paymentRight: {
    alignItems: "flex-end",
  },
  });
