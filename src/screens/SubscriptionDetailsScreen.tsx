import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { getSubscriptionStatusTone } from "@/components/SubscriptionCard";
import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { EditorSheet } from "@/components/forms/EditorSheet";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RootStackParamList } from "@/navigation/types";
import { createButtonStyles, createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { localizeCategory } from "@/utils/categories";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "SubscriptionDetails">;

export const SubscriptionDetailsScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const { subscriptions, updateSubscription } = useSubscriptions();
  const { history, summary } = useSubscriptionHistory(route.params.subscriptionId);
  const subscription = subscriptions.find((item) => item.id === route.params.subscriptionId);
  const [isPauseSheetVisible, setPauseSheetVisible] = useState(false);

  if (!subscription) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={["bottom"]}>
        <Text style={[typography.secondary, styles.emptyText]}>{t("subscription.detailsNotFound")}</Text>
      </SafeAreaView>
    );
  }

  const bookedPayments = history.filter((event) => event.type === "payment_booked" && !event.deletedAt);
  const totalAmount = bookedPayments.reduce((sum, event) => sum + (event.amount ?? 0), 0);
  const firstPaymentDate = [...bookedPayments].sort((left, right) =>
    (left.dueDate ?? left.effectiveDate ?? left.createdAt).localeCompare(
      right.dueDate ?? right.effectiveDate ?? right.createdAt,
    ),
  )[0];

  const isPaused = subscription.status === "paused";

  const handlePause = async () => {
    try {
      await updateSubscription(subscription.id, {
        status: isPaused ? "active" : "paused",
      });
      setPauseSheetVisible(false);
    } catch {
      Alert.alert(t("common.actionFailed"), t("common.actionFailed"));
    }
  };

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[layout.content, { paddingBottom: insets.bottom + spacing.xxl + 76 }]}
      >
        <View style={[surfaces.panel, styles.heroCard]}>
          <View style={styles.heroMain}>
            <SubscriptionAvatar name={subscription.name} category={subscription.category} size={52} />
            <View style={styles.heroCopy}>
              <Text style={[typography.pageTitle, styles.name]}>{subscription.name}</Text>
              <Text style={[typography.secondary, styles.category]}>
                {localizeCategory(subscription.category, language)}
              </Text>
              <Text style={[typography.metric, styles.amount]}>{formatCurrency(subscription.amount, currency)}</Text>
              <Text style={[typography.secondary, styles.cycle]}>/{t(`subscription.billing_${subscription.billingCycle}`)}</Text>
            </View>
          </View>
        </View>

        <View style={[surfaces.panel, styles.card]}>
          <InfoRow
            label={t("subscription.status")}
            value={t(`subscription.status_${subscription.status}`)}
            colors={colors}
            badgeTone={getSubscriptionStatusTone(subscription.status, colors)}
          />
          <InfoRow label={t("allSubscriptions.nextPayment")} value={formatDate(subscription.nextPaymentDate)} colors={colors} />
          <InfoRow
            label={t("subscription.startDate")}
            value={formatDate(firstPaymentDate?.dueDate ?? firstPaymentDate?.effectiveDate)}
            colors={colors}
          />
          <InfoRow label={t("subscription.totalPaid")} value={formatCurrency(totalAmount, currency)} colors={colors} />
          {subscription.notes ? (
            <View style={styles.notesBlock}>
              <Text style={[typography.meta, styles.infoLabel]}>{t("subscription.notes")}</Text>
              <Text style={[typography.body, styles.notes]}>{subscription.notes}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={[surfaces.panel, styles.historyCard]}
          onPress={() => navigation.navigate("SubscriptionHistory", { subscriptionId: subscription.id })}
        >
          <View style={styles.historyCopy}>
            <Text style={[typography.cardTitle, styles.cardTitle]}>{t("common.history")}</Text>
            <Text style={[typography.secondary, styles.historyHint]}>
              {summary.skippedPaymentsCount > 0
                ? t("subscription.skippedPaymentsSaved", {
                    count: summary.skippedPaymentsCount,
                    amount: formatCurrency(summary.skippedPaymentsAmount, currency),
                  })
                : t("subscription.historyHint")}
            </Text>
          </View>
          <Text style={[typography.body, styles.historyArrow]}>›</Text>
        </Pressable>

        {(subscription.status === "active" || subscription.status === "paused") ? (
          <Pressable
            style={[buttons.buttonBase, buttons.secondaryButton, styles.pauseButton]}
            onPress={() => setPauseSheetVisible(true)}
          >
            <Text style={[typography.button, styles.pauseButtonText]}>
              {isPaused ? t("subscription.resumeTitle") : t("subscription.pauseTitle")}
            </Text>
          </Pressable>
        ) : null}

      </ScrollView>

      <Pressable
        style={[styles.fabButton, { bottom: Math.max(spacing.lg, insets.bottom + spacing.sm) }]}
        onPress={() => navigation.navigate("SubscriptionForm", { subscriptionId: subscription.id })}
      >
        <Ionicons name="pencil-outline" size={22} color={colors.accent} />
      </Pressable>

      <EditorSheet
        visible={isPauseSheetVisible}
        title={isPaused ? t("subscription.resumeTitle") : t("subscription.pauseTitle")}
        onClose={() => setPauseSheetVisible(false)}
        onConfirm={handlePause}
        confirmLabel={isPaused ? t("subscription.resumeConfirm") : t("subscription.pauseConfirm")}
      >
        <View style={styles.pauseSheetContent}>
          <Text style={[typography.body, styles.pauseSheetText]}>
            {isPaused ? t("subscription.resumeDescription") : t("subscription.pauseDescription")}
          </Text>
        </View>
      </EditorSheet>
    </SafeAreaView>
  );
};

const InfoRow = ({
  label,
  value,
  colors,
  badgeTone,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>["colors"];
  badgeTone?: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  };
}) => {
  const { typography } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.infoRow}>
      <Text style={[typography.meta, styles.infoLabel]}>{label}</Text>
      {badgeTone ? (
        <View
          style={[
            styles.infoBadge,
            {
              backgroundColor: badgeTone.backgroundColor,
              borderColor: badgeTone.borderColor,
            },
          ]}
        >
          <Text style={[typography.meta, styles.infoBadgeText, { color: badgeTone.textColor }]}>
            {value}
          </Text>
        </View>
      ) : (
        <Text style={[typography.body, styles.infoValue]}>{value}</Text>
      )}
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    heroCard: {
      gap: spacing.xs,
    },
    heroMain: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    heroCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    name: {
      color: colors.textPrimary,
    },
    category: {
      color: colors.textSecondary,
    },
    amount: {
      marginTop: spacing.sm,
      color: colors.accent,
    },
    cycle: {
      color: colors.textSecondary,
    },
    card: {
      gap: spacing.md,
    },
    historyCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    historyCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    historyHint: {
      color: colors.textSecondary,
    },
    historyArrow: {
      color: colors.textSecondary,
      fontSize: 22,
      lineHeight: 22,
    },
    cardTitle: {
      color: colors.textPrimary,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    infoLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    infoValue: {
      flex: 1,
      textAlign: "right",
      color: colors.textPrimary,
    },
    infoBadge: {
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      alignSelf: "flex-start",
    },
    infoBadgeText: {
      textTransform: "capitalize",
    },
    notesBlock: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    notes: {
      color: colors.textPrimary,
    },
    pauseSheetContent: {
      paddingTop: spacing.xs,
    },
    pauseSheetText: {
      color: colors.textPrimary,
    },
    pauseButton: {},
    pauseButtonText: {
      color: colors.textPrimary,
    },
    fabButton: {
      position: "absolute",
      right: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 999,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      elevation: 4,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    emptyText: {
      color: colors.textSecondary,
    },
  });
