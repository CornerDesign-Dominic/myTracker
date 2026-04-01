import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { buildUpcomingMonthlyCostPreview } from "@/domain/subscriptions/statistics";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { getRecurringDueDateForMonth } from "@/utils/recurringDates";

type Props = NativeStackScreenProps<RootStackParamList, "MonthlyPreview">;

const formatShortDueDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.`;

export const MonthlyCostPreviewScreen = (_props: Props) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const insets = useSafeAreaInsets();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { subscriptions } = useSubscriptions();
  const [expandedMonthKey, setExpandedMonthKey] = useState<string | null>(null);

  const items = buildUpcomingMonthlyCostPreview(subscriptions, 12);
  const months = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        entries: subscriptions
          .filter((subscription) => subscription.status === "active")
          .map((subscription) => {
            const dueDate = getRecurringDueDateForMonth({
              anchorDate: subscription.nextPaymentDate,
              billingCycle: subscription.billingCycle,
              targetMonth: item.date,
            });

            if (!dueDate) {
              return null;
            }

            return {
              id: `${item.key}:${subscription.id}`,
              name: subscription.name,
              dueDate: formatShortDueDate(dueDate),
              amount: subscription.amount,
            };
          })
          .filter((entry): entry is { id: string; name: string; dueDate: string; amount: number } => Boolean(entry)),
      })),
    [items, subscriptions],
  );

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          layout.content,
          styles.contentWithTabBar,
          { paddingBottom: spacing.xxl + Math.max(insets.bottom, spacing.md) },
        ]}
      >
        {months.map((item) => {
          const isExpanded = expandedMonthKey === item.key;

          return (
            <Pressable
              key={item.key}
              style={[surfaces.panel, styles.card]}
              onPress={() => setExpandedMonthKey((current) => (current === item.key ? null : item.key))}
            >
              <View style={styles.monthRow}>
                <Text style={[typography.body, styles.monthLabel]}>
                  {new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
                    month: "long",
                    year: "numeric",
                  }).format(item.date)}
                </Text>
                <View style={styles.monthSummary}>
                  <Text style={[typography.body, styles.amountLabel]}>
                    {formatCurrency(item.totalAmount, currency)}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up-outline" : "chevron-forward-outline"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
              </View>

              {isExpanded ? (
                <View style={styles.expandedList}>
                  {item.entries.map((entry, index) => (
                    <View
                      key={entry.id}
                      style={[styles.entryRow, index < item.entries.length - 1 ? styles.entryDivider : null]}
                    >
                      <Text style={[typography.secondary, styles.entryName]}>{entry.name}</Text>
                      <Text style={[typography.secondary, styles.entryDue]}>{entry.dueDate}</Text>
                      <Text style={[typography.secondary, styles.entryAmount]}>
                        {formatCurrency(entry.amount, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    contentWithTabBar: {
      minHeight: "100%",
    },
    card: {
      gap: spacing.md,
    },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    monthSummary: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    expandedList: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    entryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingTop: spacing.md,
    },
    entryDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.md,
    },
    monthLabel: {
      color: colors.textPrimary,
      textTransform: "capitalize",
      flex: 1,
    },
    amountLabel: {
      color: colors.textPrimary,
      textAlign: "right",
    },
    entryName: {
      color: colors.textPrimary,
      flex: 1,
    },
    entryDue: {
      color: colors.textSecondary,
      minWidth: 84,
      textAlign: "right",
    },
    entryAmount: {
      color: colors.textPrimary,
      minWidth: 92,
      textAlign: "right",
    },
  });
