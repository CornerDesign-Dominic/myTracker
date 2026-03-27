import { ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { colors, radius, spacing } from "@/constants/theme";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

export const StatsScreen = () => {
  const { metrics } = useSubscriptions();
  const maxCategoryValue = metrics.byCategory[0]?.monthlyTotal ?? 1;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        title="Statistiken"
        subtitle="Fokus auf die wichtigsten Kennzahlen fuer schnelle Entscheidungen."
      />

      <View style={styles.statsRow}>
        <StatCard
          label="Monatliche Ausgaben"
          value={formatCurrency(metrics.monthlyTotal)}
          tone="accent"
        />
        <StatCard label="Jaehrliche Ausgaben" value={formatCurrency(metrics.yearlyTotal)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Teuerstes Abo</Text>
        {metrics.mostExpensive ? (
          <>
            <Text style={styles.highlightName}>{metrics.mostExpensive.name}</Text>
            <Text style={styles.highlightValue}>
              {formatCurrency(
                metrics.mostExpensive.price,
                metrics.mostExpensive.currency,
              )}{" "}
              / {metrics.mostExpensive.billingCycle}
            </Text>
          </>
        ) : (
          <Text style={styles.helperText}>Noch kein aktives Abo vorhanden.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ausgaben nach Kategorie</Text>
        {metrics.byCategory.length === 0 ? (
          <EmptyState
            title="Noch keine Kategorien"
            description="Sobald du Abos anlegst, erscheinen hier einfache Auswertungen."
          />
        ) : (
          <View style={styles.chartList}>
            {metrics.byCategory.map((item) => (
              <View key={item.category} style={styles.chartItem}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartLabel}>{item.category}</Text>
                  <Text style={styles.chartValue}>{formatCurrency(item.monthlyTotal)}</Text>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Naechste Zahlungen</Text>
        {metrics.nextPayments.length === 0 ? (
          <Text style={styles.helperText}>Keine naechsten Zahlungen vorhanden.</Text>
        ) : (
          <View style={styles.paymentList}>
            {metrics.nextPayments.map((item) => (
              <View key={item.id} style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentName}>{item.name}</Text>
                  <Text style={styles.paymentMeta}>{item.category}</Text>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(item.price, item.currency)}
                  </Text>
                  <Text style={styles.paymentMeta}>{formatDate(item.nextPaymentDate)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  highlightName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  highlightValue: {
    fontSize: 15,
    color: colors.textMuted,
  },
  helperText: {
    fontSize: 14,
    color: colors.textMuted,
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
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },
  chartValue: {
    fontSize: 14,
    color: colors.textMuted,
  },
  chartTrack: {
    width: "100%",
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
  chartFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
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
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
  },
  paymentMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  paymentRight: {
    alignItems: "flex-end",
  },
});
