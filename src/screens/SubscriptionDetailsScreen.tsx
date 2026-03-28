import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { EditorSheet } from "@/components/forms/EditorSheet";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RootStackParamList } from "@/navigation/types";
import { createButtonStyles, createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "SubscriptionDetails">;

export const SubscriptionDetailsScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
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
      <SafeAreaView style={styles.emptyContainer} edges={["top", "bottom"]}>
        <Text style={[typography.secondary, styles.emptyText]}>{t("subscription.detailsNotFound")}</Text>
      </SafeAreaView>
    );
  }

  const bookedPayments = history.filter(
    (event) => event.type === "payment_booked" && !event.deletedAt,
  );
  const totalAmount = bookedPayments.reduce((sum, event) => sum + (event.amount ?? 0), 0);
  const firstPaymentDate = [...bookedPayments].sort((left, right) =>
    (left.dueDate ?? left.effectiveDate ?? left.createdAt).localeCompare(
      right.dueDate ?? right.effectiveDate ?? right.createdAt,
    ),
  )[0];

  const handlePause = async () => {
    await updateSubscription(subscription.id, {
      status: subscription.status === "paused" ? "active" : "paused",
    });
    setPauseSheetVisible(false);
  };

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={layout.content}>
        <View style={[surfaces.panel, styles.heroCard]}>
          <View style={styles.heroMain}>
            <SubscriptionAvatar
              name={subscription.name}
              category={subscription.category}
              size={52}
            />
            <View style={styles.heroCopy}>
              <Text style={[typography.pageTitle, styles.name]}>{subscription.name}</Text>
              <Text style={[typography.secondary, styles.category]}>{subscription.category}</Text>
              <Text style={[typography.metric, styles.amount]}>
                {formatCurrency(subscription.amount, currency)}
              </Text>
              <Text style={[typography.secondary, styles.cycle]}>
                /{t(`subscription.billing_${subscription.billingCycle}`)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[surfaces.panel, styles.card]}>
          <InfoRow
            label={t("subscription.status")}
            value={t(`subscription.status_${subscription.status}`)}
            colors={colors}
          />
          <InfoRow
            label={t("allSubscriptions.nextPayment")}
            value={formatDate(subscription.nextPaymentDate)}
            colors={colors}
          />
          <InfoRow
            label={language === "de" ? "Startdatum" : "Start date"}
            value={formatDate(firstPaymentDate?.dueDate ?? firstPaymentDate?.effectiveDate)}
            colors={colors}
          />
          <InfoRow
            label={language === "de" ? "Insgesamt" : "Total"}
            value={formatCurrency(totalAmount, currency)}
            colors={colors}
          />
          {subscription.notes ? (
            <View style={styles.notesBlock}>
              <Text style={[typography.meta, styles.infoLabel]}>{t("subscription.notes")}</Text>
              <Text style={[typography.body, styles.notes]}>{subscription.notes}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={[surfaces.panel, styles.historyCard]}
          onPress={() =>
            navigation.navigate("SubscriptionHistory", {
              subscriptionId: subscription.id,
            })
          }
        >
          <View style={styles.historyCopy}>
            <Text style={[typography.cardTitle, styles.cardTitle]}>{t("common.history")}</Text>
            <Text style={[typography.secondary, styles.historyHint]}>
              {summary.skippedPaymentsCount > 0
                ? language === "de"
                  ? `${summary.skippedPaymentsCount} ausgesetzte Zahlungen · ${formatCurrency(summary.skippedPaymentsAmount, currency)} gespart`
                  : `${summary.skippedPaymentsCount} skipped payments · ${formatCurrency(summary.skippedPaymentsAmount, currency)} saved`
                : t("subscription.historyHint")}
            </Text>
          </View>
          <Text style={[typography.body, styles.historyArrow]}>›</Text>
        </Pressable>

        {subscription.status === "active" || subscription.status === "paused" ? (
          <Pressable
            style={[buttons.buttonBase, buttons.secondaryButton, styles.pauseButton]}
            onPress={() => setPauseSheetVisible(true)}
          >
            <Text style={[typography.button, styles.pauseButtonText]}>
              {subscription.status === "paused"
                ? language === "de"
                  ? "Abo fortführen"
                  : "Resume subscription"
                : language === "de"
                  ? "Abo pausieren"
                  : "Pause subscription"}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[buttons.buttonBase, buttons.secondaryButton, styles.editButton]}
          onPress={() =>
            navigation.navigate("SubscriptionForm", {
              subscriptionId: subscription.id,
            })
          }
        >
          <Text style={[typography.button, styles.editButtonText]}>{t("subscription.editAction")}</Text>
        </Pressable>
      </ScrollView>

      <EditorSheet
        visible={isPauseSheetVisible}
        title={
          subscription.status === "paused"
            ? language === "de"
              ? "Abo fortführen"
              : "Resume subscription"
            : language === "de"
              ? "Abo pausieren"
              : "Pause subscription"
        }
        onClose={() => setPauseSheetVisible(false)}
        onConfirm={handlePause}
        confirmLabel={
          subscription.status === "paused"
            ? language === "de"
              ? "Fortführen"
              : "Resume"
            : language === "de"
              ? "Pausieren"
              : "Pause"
        }
      >
        <View style={styles.pauseSheetContent}>
          <Text style={[typography.body, styles.pauseSheetText]}>
            {subscription.status === "paused"
              ? language === "de"
                ? "Kommende Fälligkeiten werden wieder normal als Zahlungen behandelt."
                : "Upcoming due dates will be treated as regular payments again."
              : language === "de"
                ? "Kommende Fälligkeiten werden während der Pause als ausgesetzt behandelt."
                : "Upcoming due dates will be treated as skipped while the subscription is paused."}
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
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) => {
  const { typography } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.infoRow}>
      <Text style={[typography.meta, styles.infoLabel]}>{label}</Text>
      <Text style={[typography.body, styles.infoValue]}>{value}</Text>
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
    editButton: {},
    editButtonText: {
      color: colors.textPrimary,
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
