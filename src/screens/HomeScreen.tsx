import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { HomeTabScreenProps } from "@/navigation/types";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";

export const HomeScreen = ({ navigation }: HomeTabScreenProps) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const { subscriptions, errorMessage, isLoading } = useSubscriptions();

  const visibleSubscriptions = useMemo(() => {
    const now = new Date();
    const todayKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const monthEndKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0"),
    ].join("-");

    return subscriptions.filter((subscription) => {
      if (subscription.status !== "active") {
        return false;
      }

      return (
        subscription.nextPaymentDate >= todayKey &&
        subscription.nextPaymentDate <= monthEndKey
      );
    });
  }, [subscriptions]);

  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const currentMonthSubscriptions = subscriptions.filter((subscription) => {
      if (subscription.status !== "active") {
        return false;
      }

      const nextPayment = new Date(subscription.nextPaymentDate);

      if (Number.isNaN(nextPayment.getTime())) {
        return false;
      }

      return (
        nextPayment.getMonth() === currentMonth &&
        nextPayment.getFullYear() === currentYear
      );
    });

    return {
      monthLabel: new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
        month: "long",
      }).format(now),
      subscriptionCount: currentMonthSubscriptions.length,
      totalAmount: currentMonthSubscriptions.reduce(
        (sum, subscription) => sum + subscription.amount,
        0,
      ),
      dueAmount: currentMonthSubscriptions
        .filter((subscription) => subscription.nextPaymentDate >= todayKey)
        .reduce((sum, subscription) => sum + subscription.amount, 0),
      paidAmount: currentMonthSubscriptions
        .filter((subscription) => subscription.nextPaymentDate < todayKey)
        .reduce((sum, subscription) => sum + subscription.amount, 0),
    };
  }, [language, subscriptions]);

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.contentWithTabBar]}>
        <View style={styles.heroHeader}>
          <Text style={[typography.pageTitle, styles.pageTitle]}>{t("common.home")}</Text>
          <Pressable
            style={styles.settingsTrigger}
            hitSlop={10}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={[surfaces.panel, styles.summaryCard]}>
          <Text style={[typography.meta, styles.summaryMonth]}>{monthlySummary.monthLabel}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPrimaryBlock}>
              <Text style={[typography.meta, styles.summaryLabel]}>{t("home.total")}</Text>
              <Text style={[typography.metric, styles.summaryAmount]}>
                {formatCurrency(monthlySummary.totalAmount, currency)}
              </Text>
              <Text style={[typography.secondary, styles.summaryCount]}>
                {monthlySummary.subscriptionCount}{" "}
                {monthlySummary.subscriptionCount === 1
                  ? t("home.monthPaymentSingular")
                  : t("home.monthPaymentPlural")}
              </Text>
            </View>

            <View style={styles.summarySecondaryBlock}>
              <View style={styles.summarySecondaryItem}>
                <Text style={[typography.meta, styles.summaryLabel]}>{t("home.due")}</Text>
                <Text style={[typography.body, styles.summaryDueValue]}>
                  {formatCurrency(monthlySummary.dueAmount, currency)}
                </Text>
              </View>
              <View style={styles.summarySecondaryItem}>
                <Text style={[typography.meta, styles.summaryLabel]}>{t("home.paid")}</Text>
                <Text style={[typography.body, styles.summarySecondaryValue]}>
                  {formatCurrency(monthlySummary.paidAmount, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {errorMessage ? (
          <Text style={[typography.secondary, styles.errorText]}>{errorMessage}</Text>
        ) : null}

        {isLoading ? (
          <Text style={[typography.secondary, styles.helperText]}>{t("common.loading")}</Text>
        ) : null}

        {!isLoading && visibleSubscriptions.length === 0 ? (
          <EmptyState
            title={t("home.emptyTitle")}
            description={t("home.emptyDescription")}
          />
        ) : null}

        <View style={styles.list}>
          {visibleSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              showStatus={false}
              onPress={() =>
                navigation.navigate("SubscriptionDetails", {
                  subscriptionId: subscription.id,
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    heroHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      minHeight: 40,
    },
    pageTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 30,
    },
    settingsTrigger: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginRight: -spacing.xxs,
    },
    summaryCard: {
      gap: spacing.sm,
      borderColor: colors.accent,
    },
    summaryMonth: {
      color: colors.textSecondary,
      textTransform: "capitalize",
      fontSize: 22,
      lineHeight: 28,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    summaryPrimaryBlock: {
      flex: 1,
      gap: spacing.xxs,
      minWidth: 0,
    },
    summarySecondaryBlock: {
      minWidth: 108,
      gap: spacing.xs,
      paddingTop: 2,
    },
    summarySecondaryItem: {
      gap: 2,
    },
    summaryLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    summaryAmount: {
      color: colors.textPrimary,
      fontSize: 28,
      lineHeight: 34,
      flexShrink: 1,
    },
    summaryCount: {
      color: colors.textSecondary,
    },
    summarySecondaryValue: {
      color: colors.textPrimary,
    },
    summaryDueValue: {
      color: colors.accent,
    },
    list: {
      gap: 20,
    },
    contentWithTabBar: {
      minHeight: "100%",
    },
    helperText: {
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.danger,
    },
  });
