import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SubscriptionCard } from "@/components/SubscriptionCard";
import { buildHomeDueSections, buildHomeMonthlySummary } from "@/domain/subscriptions/statistics";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptionsHistory } from "@/hooks/useSubscriptionsHistory";
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
  const { history } = useSubscriptionsHistory(
    subscriptions.map((subscription) => subscription.id),
  );
  const dueSections = useMemo(() => buildHomeDueSections(subscriptions), [subscriptions]);

  const monthlySummary = useMemo(() => {
    const now = new Date();

    const summary = buildHomeMonthlySummary(subscriptions, history, now);

    return {
      ...summary,
      monthLabel: new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
        month: "long",
      }).format(now),
    };
  }, [history, language, subscriptions]);

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

        <View style={[surfaces.mainPanel, styles.summaryCard]}>
          <Text style={[typography.meta, styles.summaryMonth]}>{monthlySummary.monthLabel}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryPrimaryBlock}>
              <Text style={[typography.meta, styles.summaryLabel]}>{t("home.total")}</Text>
              <Text style={[typography.metric, styles.summaryAmount]}>
                {formatCurrency(monthlySummary.totalAmount, currency)}
              </Text>
              <Pressable onPress={() => navigation.navigate("MonthlyPreview")}>
                <Text style={[typography.secondary, styles.summaryLink]}>
                  {t("home.monthlyPreviewLink")}
                </Text>
              </Pressable>
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

        <View style={styles.sections}>
          <View style={styles.section}>
            {dueSections.currentMonthUpcoming.length === 0 ? (
              <View style={[surfaces.subtlePanel, styles.emptySectionRow]}>
                <Text style={[typography.secondary, styles.emptySectionText]}>
                  {t("home.dueFromTodayEmpty")}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {dueSections.currentMonthUpcoming.map((subscription) => (
                  <SubscriptionCard
                    key={`${subscription.id}:${subscription.homeDueDate}`}
                    subscription={subscription}
                    showStatus={false}
                    actionIconName="chevron-forward-outline"
                    onPress={() =>
                      navigation.navigate("SubscriptionDetails", {
                        subscriptionId: subscription.id,
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>

          <View style={[surfaces.subtlePanel, styles.monthDividerCard]}>
            <Text style={[typography.meta, styles.monthDividerText]}>
              {t("home.nextMonthSection")}
            </Text>
          </View>

          <View style={styles.section}>
            {dueSections.nextMonthUpcoming.length === 0 ? (
              <View style={[surfaces.subtlePanel, styles.emptySectionRow]}>
                <Text style={[typography.secondary, styles.emptySectionText]}>
                  {t("home.nextMonthEmpty")}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {dueSections.nextMonthUpcoming.map((subscription) => (
                  <SubscriptionCard
                    key={`${subscription.id}:${subscription.homeDueDate}`}
                    subscription={subscription}
                    showStatus={false}
                    actionIconName="chevron-forward-outline"
                    onPress={() =>
                      navigation.navigate("SubscriptionDetails", {
                        subscriptionId: subscription.id,
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>

          <Pressable
            style={[surfaces.panel, styles.monthlyPreviewCard]}
            onPress={() => navigation.navigate("MonthlyPreview")}
          >
            <View style={styles.monthlyPreviewHeader}>
              <View style={styles.monthlyPreviewCopy}>
                <Text style={[typography.cardTitle, styles.monthlyPreviewTitle]}>
                  {t("home.monthlyPreviewSection")}
                </Text>
                <Text style={[typography.secondary, styles.monthlyPreviewDescription]}>
                  {t("home.monthlyPreviewDescription")}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>
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
    summaryLink: {
      color: colors.accent,
    },
    summarySecondaryValue: {
      color: colors.textPrimary,
    },
    summaryDueValue: {
      color: colors.accent,
    },
    sections: {
      gap: spacing.lg,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      color: colors.textPrimary,
    },
    monthDividerCard: {
      minHeight: 40,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
      justifyContent: "center",
    },
    monthDividerText: {
      color: colors.accent,
      textTransform: "uppercase",
    },
    emptySectionRow: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    emptySectionText: {
      color: colors.textSecondary,
    },
    monthlyPreviewCard: {
      paddingVertical: spacing.md,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    monthlyPreviewHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    monthlyPreviewCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    monthlyPreviewTitle: {
      color: colors.accent,
    },
    monthlyPreviewDescription: {
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
