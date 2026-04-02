import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import {
  buildSavingsSummary,
  getTotalSavedAmount,
} from "@/domain/subscriptionHistory/statistics";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscriptionsHistory } from "@/hooks/useSubscriptionsHistory";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { parseLocalDateInput } from "@/utils/date";

type MonthlySavingsItem = {
  subscriptionId: string;
  subscriptionName: string;
  amount: number;
};

type MonthlySavingsGroup = {
  key: string;
  label: string;
  totalAmount: number;
  items: MonthlySavingsItem[];
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
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

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
  const totalSavedAmount = useMemo(
    () => getTotalSavedAmount(skippedEvents),
    [skippedEvents],
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

  const monthlySavingsGroups = useMemo<MonthlySavingsGroup[]>(() => {
    const subscriptionNames = new Map(
      subscriptions.map((subscription) => [subscription.id, subscription.name]),
    );
    const groups = new Map<
      string,
      {
        date: Date;
        totalAmount: number;
        items: Map<string, MonthlySavingsItem>;
      }
    >();
    const monthFormatter = new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
      month: "long",
      year: "numeric",
    });

    skippedEvents.forEach((event) => {
      const dueDate = parseLocalDateInput(event.dueDate ?? "");
      if (!dueDate) {
        return;
      }

      const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`;
      const existingGroup = groups.get(key) ?? {
        date: new Date(dueDate.getFullYear(), dueDate.getMonth(), 1),
        totalAmount: 0,
        items: new Map<string, MonthlySavingsItem>(),
      };
      const existingItem = existingGroup.items.get(event.subscriptionId);

      existingGroup.totalAmount += event.amount ?? 0;
      if (existingItem) {
        existingItem.amount += event.amount ?? 0;
      } else {
        existingGroup.items.set(event.subscriptionId, {
          subscriptionId: event.subscriptionId,
          subscriptionName:
            subscriptionNames.get(event.subscriptionId) ?? t("common.unavailable"),
          amount: event.amount ?? 0,
        });
      }

      groups.set(key, existingGroup);
    });

    return Array.from(groups.entries())
      .map(([key, group]) => ({
        key,
        label: monthFormatter.format(group.date),
        totalAmount: group.totalAmount,
        items: Array.from(group.items.values()).sort((left, right) => right.amount - left.amount),
      }))
      .sort((left, right) => right.key.localeCompare(left.key));
  }, [language, skippedEvents, subscriptions, t]);

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
          <View style={styles.savedMetric}>
            <Text style={[typography.meta, styles.savedLabel]}>
              {t("stats.savingsAllTime")}
            </Text>
            <Text style={[typography.sectionTitle, styles.savedAmountAccent]}>
              {formatCurrency(totalSavedAmount, currency)}
            </Text>
          </View>
          <View style={styles.savedDivider} />

          <View style={styles.savedSummaryRow}>
            <View style={styles.savedMetric}>
              <Text style={[typography.meta, styles.savedLabel]}>{summaryLabels.currentYear}</Text>
              <Text style={[typography.sectionTitle, styles.savedAmount]}>
                {formatCurrency(savingsSummary.currentYearActual, currency)}
              </Text>
            </View>
            <View style={styles.savedMetric}>
              <Text style={[typography.meta, styles.savedLabel]}>{summaryLabels.previousYear}</Text>
              <Text style={[typography.sectionTitle, styles.savedAmount]}>
                {formatCurrency(savingsSummary.previousYearActual, currency)}
              </Text>
            </View>
          </View>
          <View style={styles.savedDivider} />

          <View style={styles.savedSummaryRow}>
            <View style={styles.savedMetric}>
              <Text style={[typography.meta, styles.savedLabel]}>{summaryLabels.currentMonth}</Text>
              <Text style={[typography.sectionTitle, styles.savedAmount]}>
                {formatCurrency(savingsSummary.currentMonthActual, currency)}
              </Text>
            </View>
            <View style={styles.savedMetric}>
              <Text style={[typography.meta, styles.savedLabel]}>{summaryLabels.previousMonth}</Text>
              <Text style={[typography.sectionTitle, styles.savedAmount]}>
                {formatCurrency(savingsSummary.previousMonthActual, currency)}
              </Text>
            </View>
          </View>
          <View style={styles.savedDivider} />

          <View style={styles.savedSummaryRow}>
            <View style={styles.savedMetric}>
              <Text style={[typography.meta, styles.savedLabel]}>
                {summaryLabels.currentMonthProjection}
              </Text>
              <Text style={[typography.sectionTitle, styles.savedAmountAccent]}>
                {formatCurrency(savingsSummary.currentMonthProjected, currency)}
              </Text>
            </View>
            <View style={styles.savedMetric}>
              <Text style={[typography.meta, styles.savedLabel]}>
                {summaryLabels.currentYearProjection}
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
    savedLabel: {
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
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
    savedFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    savedFooterText: {
      flex: 1,
      color: colors.textSecondary,
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
