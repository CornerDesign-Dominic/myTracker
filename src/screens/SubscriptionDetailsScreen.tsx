import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RootStackParamList } from "@/navigation/types";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
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
  const { subscriptions } = useSubscriptions();
  const { history, summary } = useSubscriptionHistory(route.params.subscriptionId);
  const subscription = subscriptions.find((item) => item.id === route.params.subscriptionId);

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

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[layout.content, { paddingBottom: insets.bottom + spacing.xxl + 76 }]}
      >
        <View style={[surfaces.mainPanel, styles.heroCard]}>
          <View style={styles.heroHeader}>
            <SubscriptionAvatar name={subscription.name} category={subscription.category} size={52} />
            <View style={styles.heroHeaderCopy}>
              <Text style={[typography.pageTitle, styles.name]}>{subscription.name}</Text>
              <Text style={[typography.secondary, styles.heroCategory]}>
                {localizeCategory(subscription.category, language)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[surfaces.panel, styles.summaryCard]}>
          <View style={styles.summaryGridRow}>
            <View style={styles.summaryGridItemWide} />
            <Text style={[typography.body, styles.statusValue]}>
              {t(`subscription.status_${subscription.status}`)}
            </Text>
          </View>
          <View style={styles.summaryGridRow}>
            <View style={styles.summaryGridItem}>
              <Text style={[typography.body, styles.infoValueLeft]}>
                {formatCurrency(subscription.amount, currency)}
              </Text>
            </View>
            <View style={styles.summaryGridItem}>
              <Text style={[typography.body, styles.infoValueRight]}>
                {t(`subscription.billing_${subscription.billingCycle}`)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryGridRow}>
            <View style={styles.summaryGridItemWide}>
              <Text style={[typography.meta, styles.infoLabel]}>{t("allSubscriptions.nextPayment")}</Text>
            </View>
            <Text style={[typography.body, styles.infoValueRight]}>{formatDate(subscription.nextPaymentDate)}</Text>
          </View>
          <View style={styles.summaryGridRow}>
            <View style={styles.summaryGridItemWide}>
              <Text style={[typography.meta, styles.infoLabel]}>{t("subscription.oldestPayment")}</Text>
            </View>
            <Text style={[typography.body, styles.infoValueRight]}>
              {formatDate(firstPaymentDate?.dueDate ?? firstPaymentDate?.effectiveDate)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <InfoRow
            label={t("subscription.totalPaid")}
            value={formatCurrency(totalAmount, currency)}
            colors={colors}
          />
          <InfoRow
            label={t("subscription.totalSaved")}
            value={formatCurrency(summary.skippedPaymentsAmount, currency)}
            colors={colors}
          />
        </View>

        <View style={[surfaces.panel, styles.card]}>
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

      </ScrollView>

      <Pressable
        style={[styles.fabButton, { bottom: Math.max(spacing.lg, insets.bottom + spacing.sm) }]}
        onPress={() => navigation.navigate("SubscriptionForm", { subscriptionId: subscription.id })}
      >
        <Ionicons name="pencil-outline" size={22} color={colors.accent} />
      </Pressable>
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
    heroHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    heroHeaderCopy: {
      flex: 1,
      gap: spacing.xxs,
      minWidth: 0,
    },
    name: {
      color: colors.textPrimary,
    },
    heroCategory: {
      color: colors.textSecondary,
    },
    card: {
      gap: spacing.md,
    },
    summaryCard: {
      gap: spacing.md,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    summaryGridRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    summaryGridItem: {
      flex: 1,
      gap: spacing.xxs,
      minWidth: 0,
    },
    summaryGridItemWide: {
      flex: 1,
      minWidth: 0,
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
    infoValueLeft: {
      color: colors.textPrimary,
    },
    infoValueRight: {
      color: colors.textPrimary,
      textAlign: "right",
    },
    statusValue: {
      color: colors.accent,
      textAlign: "right",
    },
    notesBlock: {
      gap: spacing.xs,
    },
    notes: {
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
