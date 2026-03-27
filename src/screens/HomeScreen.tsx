import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { HomeTabScreenProps } from "@/navigation/types";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";

export const HomeScreen = ({ navigation }: HomeTabScreenProps) => {
  const { colors, typography } = useAppTheme();
  const { language, t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const { subscriptions, updateSubscription, errorMessage, isLoading } = useSubscriptions();

  const visibleSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status !== "cancelled"),
    [subscriptions],
  );

  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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
      totalAmount: currentMonthSubscriptions.reduce(
        (sum, subscription) => sum + subscription.price,
        0,
      ),
      paymentCount: currentMonthSubscriptions.length,
    };
  }, [subscriptions]);

  const handleCancel = async (id: string) => {
    const subscription = subscriptions.find((item) => item.id === id);

    await updateSubscription(id, {
      status: "cancelled",
      endDate: subscription?.endDate ?? subscription?.nextPaymentDate,
    });
  };

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
          <Text style={[typography.metric, styles.summaryAmount]}>
            {formatCurrency(monthlySummary.totalAmount)}
          </Text>
          <Text style={[typography.secondary, styles.summaryCount]}>
            {monthlySummary.paymentCount}{" "}
            {monthlySummary.paymentCount === 1
              ? t("home.monthPaymentSingular")
              : t("home.monthPaymentPlural")}
          </Text>
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
              onPress={() =>
                navigation.navigate("SubscriptionDetails", {
                  subscriptionId: subscription.id,
                })
              }
              onEdit={() =>
                navigation.navigate("SubscriptionForm", {
                  subscriptionId: subscription.id,
                })
              }
              onCancel={
                subscription.status === "cancelled"
                  ? undefined
                  : () => handleCancel(subscription.id)
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
    },
    pageTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 30,
    },
    settingsTrigger: {
      padding: spacing.xs,
      marginRight: -spacing.xxs,
    },
    summaryCard: {
      gap: 8,
    },
    summaryMonth: {
      color: colors.textSecondary,
      textTransform: "capitalize",
      fontSize: 22,
      lineHeight: 28,
    },
    summaryAmount: {
      color: colors.textPrimary,
    },
    summaryCount: {
      color: colors.textSecondary,
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
