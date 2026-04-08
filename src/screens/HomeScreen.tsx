import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useAuth } from "@/context/AuthContext";
import { buildHomeDueSections } from "@/domain/subscriptions/statistics";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptionsHistory } from "@/hooks/useSubscriptionsHistory";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { HomeTabScreenProps } from "@/navigation/types";
import { buildHomeMonthlyCardProjection } from "@/presentation/subscriptions/screenProjections";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";

export const HomeScreen = ({ navigation }: HomeTabScreenProps) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const { isAnonymous, pendingRegistration } = useAuth();
  const { subscriptions, errorMessage, isLoading } = useSubscriptions();
  const { history, isLoading: isHistoryLoading } = useSubscriptionsHistory(
    subscriptions.map((subscription) => subscription.id),
  );
  const isHomeDataLoading = isLoading || (subscriptions.length > 0 && isHistoryLoading);
  const [hasResolvedInitialHomeData, setHasResolvedInitialHomeData] = useState(
    !isHomeDataLoading,
  );
  const contentOpacity = useRef(new Animated.Value(hasResolvedInitialHomeData ? 1 : 0)).current;
  const dueSections = useMemo(() => buildHomeDueSections(subscriptions), [subscriptions]);

  const monthlySummary = useMemo(() => {
    return buildHomeMonthlyCardProjection(subscriptions, history, language);
  }, [history, language, subscriptions]);

  useEffect(() => {
    if (hasResolvedInitialHomeData || isHomeDataLoading) {
      return;
    }

    setHasResolvedInitialHomeData(true);
  }, [contentOpacity, hasResolvedInitialHomeData, isHomeDataLoading]);

  useEffect(() => {
    if (!hasResolvedInitialHomeData) {
      contentOpacity.setValue(0);
      return;
    }

    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [contentOpacity, hasResolvedInitialHomeData]);

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

        {!hasResolvedInitialHomeData ? (
          <>
            <View style={[surfaces.mainPanel, styles.summaryCard]}>
              <View style={[styles.skeletonBlock, styles.skeletonMonth]} />
              <View style={styles.summaryRow}>
                <View style={styles.summaryPrimaryBlock}>
                  <View style={[styles.skeletonBlock, styles.skeletonLabel]} />
                  <View style={[styles.skeletonBlock, styles.skeletonAmount]} />
                  <View style={[styles.skeletonBlock, styles.skeletonLink]} />
                </View>
                <View style={styles.summarySecondaryBlock}>
                  <View style={styles.summarySecondaryItem}>
                    <View style={[styles.skeletonBlock, styles.skeletonLabel]} />
                    <View style={[styles.skeletonBlock, styles.skeletonValue]} />
                  </View>
                  <View style={styles.summarySecondaryItem}>
                    <View style={[styles.skeletonBlock, styles.skeletonLabel]} />
                    <View style={[styles.skeletonBlock, styles.skeletonValue]} />
                  </View>
                </View>
              </View>
            </View>

            <View style={[surfaces.subtlePanel, styles.monthMarkerCard]}>
              <View style={[styles.skeletonBlock, styles.skeletonMarker]} />
            </View>

            <View style={styles.list}>
              {[0, 1, 2].map((item) => (
                <View key={item} style={[surfaces.panel, styles.skeletonSubscriptionCard]}>
                  <View style={styles.skeletonSubscriptionTop}>
                    <View style={styles.skeletonSubscriptionLeft}>
                      <View style={[styles.skeletonCircle, styles.skeletonAvatar]} />
                      <View style={styles.skeletonSubscriptionCopy}>
                        <View style={[styles.skeletonBlock, styles.skeletonTitle]} />
                        <View style={[styles.skeletonBlock, styles.skeletonSubtitle]} />
                      </View>
                    </View>
                    <View style={[styles.skeletonBlock, styles.skeletonStatus]} />
                  </View>
                  <View style={styles.skeletonMetaRow}>
                    <View style={[styles.skeletonBlock, styles.skeletonMetaItem]} />
                    <View style={[styles.skeletonBlock, styles.skeletonMetaItem]} />
                    <View style={[styles.skeletonBlock, styles.skeletonMetaItem]} />
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Animated.View style={{ opacity: contentOpacity }}>
              <View style={[surfaces.mainPanel, styles.summaryCard]}>
                <Text style={[typography.meta, styles.summaryMonth]}>{monthlySummary.homeDateLabel}</Text>
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
            </Animated.View>

            <Animated.View style={{ opacity: contentOpacity }}>
              <View style={[surfaces.subtlePanel, styles.monthMarkerCard]}>
                <Text style={[typography.meta, styles.monthMarkerText]}>
                  {t("home.currentMonthMarker")}
                </Text>
              </View>
            </Animated.View>

            {errorMessage ? (
              <Animated.View style={{ opacity: contentOpacity }}>
                <Text style={[typography.secondary, styles.errorText]}>{errorMessage}</Text>
              </Animated.View>
            ) : null}

            <Animated.View style={[styles.sections, { opacity: contentOpacity }]}>
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
            </Animated.View>
          </>
        )}
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
    skeletonBlock: {
      borderRadius: 999,
      backgroundColor: colors.surfaceSoft,
    },
    skeletonCircle: {
      borderRadius: 999,
      backgroundColor: colors.surfaceSoft,
    },
    skeletonMonth: {
      width: 124,
      height: 24,
    },
    skeletonLabel: {
      width: 64,
      height: 12,
    },
    skeletonAmount: {
      width: 160,
      height: 34,
      borderRadius: 16,
    },
    skeletonLink: {
      width: 108,
      height: 16,
    },
    skeletonValue: {
      width: 86,
      height: 18,
    },
    skeletonMarker: {
      width: 108,
      height: 14,
    },
    skeletonSubscriptionCard: {
      gap: spacing.md,
    },
    skeletonSubscriptionTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    skeletonSubscriptionLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    skeletonAvatar: {
      width: 44,
      height: 44,
    },
    skeletonSubscriptionCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    skeletonTitle: {
      width: "58%",
      height: 16,
      borderRadius: 10,
    },
    skeletonSubtitle: {
      width: "34%",
      height: 12,
      borderRadius: 10,
    },
    skeletonStatus: {
      width: 72,
      height: 28,
    },
    skeletonMetaRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    skeletonMetaItem: {
      flex: 1,
      height: 18,
      borderRadius: 10,
    },
    summaryMonth: {
      color: colors.accent,
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
      color: colors.textMuted,
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
      color: colors.textSecondary,
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
    monthMarkerCard: {
      minHeight: 40,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
      justifyContent: "center",
    },
    monthMarkerText: {
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
    errorText: {
      color: colors.danger,
    },
  });
