import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLayoutEffect, useState } from "react";

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
type ConfirmActionType = "cancel" | "delete" | null;

export const SubscriptionDetailsScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const { subscriptions, updateSubscription, archiveSubscription } = useSubscriptions();
  const { history, summary } = useSubscriptionHistory(route.params.subscriptionId);
  const subscription = subscriptions.find((item) => item.id === route.params.subscriptionId);
  const [isActionsModalVisible, setIsActionsModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionType>(null);
  const [isPauseInfoModalVisible, setIsPauseInfoModalVisible] = useState(false);

  useLayoutEffect(() => {
    if (!subscription) {
      return;
    }

    navigation.setOptions({
      headerRight: () => (
        <Pressable
          hitSlop={10}
          onPress={() => setIsActionsModalVisible(true)}
          style={styles.headerMenuButton}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </Pressable>
      ),
    });
  }, [colors.textPrimary, navigation, styles.headerMenuButton, subscription]);

  if (!subscription) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={["bottom"]}>
        <Text style={[typography.secondary, styles.emptyText]}>{t("subscription.detailsNotFound")}</Text>
      </SafeAreaView>
    );
  }

  const bookedPayments = history.filter((event) => event.type === "payment_booked" && !event.deletedAt);
  const totalAmount = bookedPayments.reduce((sum, event) => sum + (event.amount ?? 0), 0);
  const isPaused = subscription.status === "paused";
  const firstPaymentDate = [...bookedPayments].sort((left, right) =>
    (left.dueDate ?? left.effectiveDate ?? left.createdAt).localeCompare(
      right.dueDate ?? right.effectiveDate ?? right.createdAt,
    ),
  )[0];

  const closeActionsModal = () => setIsActionsModalVisible(false);
  const closeConfirmModal = () => setConfirmAction(null);
  const closePauseInfoModal = () => setIsPauseInfoModalVisible(false);
  const syncStatusLabel =
    subscription.syncState?.status === "localOnly"
      ? t("common.syncLocalOnly")
      : subscription.syncState?.status === "syncing"
        ? t("common.syncing")
        : subscription.syncState?.status === "retryPending" ||
            subscription.syncState?.status === "syncFailed"
          ? t("common.syncRetryPending")
          : subscription.syncState?.status === "pending"
            ? t("common.syncPending")
            : null;

  const handlePauseSubscription = async () => {
    closePauseInfoModal();
    closeActionsModal();

    try {
      await updateSubscription(subscription.id, { status: isPaused ? "active" : "paused" });
    } catch {
      Alert.alert(t("common.actionFailed"), t("common.actionFailed"));
    }
  };

  const handleCancelSubscription = async () => {
    closeConfirmModal();
    closeActionsModal();

    try {
      await updateSubscription(subscription.id, { status: "cancelled" });
    } catch {
      Alert.alert(t("common.actionFailed"), t("common.actionFailed"));
    }
  };

  const handleDeleteSubscription = async () => {
    closeConfirmModal();
    closeActionsModal();

    try {
      await archiveSubscription(subscription.id);
      navigation.goBack();
    } catch {
      Alert.alert(t("common.actionFailed"), t("common.actionFailed"));
    }
  };

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

        {syncStatusLabel ? (
          <View
            style={[
              surfaces.subtlePanel,
              styles.syncNoticeCard,
              subscription.syncState?.hasError
                ? styles.syncNoticeCardError
                : subscription.syncState?.localOnly
                  ? styles.syncNoticeCardLocalOnly
                  : styles.syncNoticeCardPending,
            ]}
          >
            <View style={styles.syncNoticeCopy}>
              <Text
                style={[
                  typography.body,
                  styles.syncNoticeTitle,
                  subscription.syncState?.hasError
                    ? styles.syncNoticeTitleError
                    : subscription.syncState?.localOnly
                      ? styles.syncNoticeTitleLocalOnly
                      : styles.syncNoticeTitlePending,
                ]}
              >
                {syncStatusLabel}
              </Text>
              <Text style={[typography.secondary, styles.syncNoticeDescription]}>
                {subscription.syncState?.hasError
                  ? subscription.syncState.lastError || t("common.actionFailed")
                  : subscription.syncState?.localOnly
                    ? t("common.syncLocalOnlyDescription")
                    : subscription.syncState?.status === "retryPending" ||
                        subscription.syncState?.status === "syncFailed"
                      ? t("common.syncRetryPendingDescription")
                      : t("common.syncPendingDescription")}
              </Text>
            </View>
          </View>
        ) : null}

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
          <View style={styles.notesBlock}>
            <Text style={[typography.meta, styles.infoLabel]}>{t("subscription.note")}</Text>
            <Text style={[typography.body, styles.notes]}>
              {subscription.notes?.trim() || t("common.none")}
            </Text>
          </View>
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

      <Modal
        animationType="fade"
        transparent
        visible={isActionsModalVisible}
        onRequestClose={closeActionsModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeActionsModal} />
          <View style={[surfaces.panel, styles.actionsModal]}>
            <View style={styles.actionsHeader}>
              <Text style={[typography.cardTitle, styles.cardTitle]}>{t("subscription.actionsTitle")}</Text>
              <Pressable onPress={closeActionsModal} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Pressable
              style={styles.actionsRow}
              onPress={() => {
                closeActionsModal();
                setIsPauseInfoModalVisible(true);
              }}
            >
              <Text style={[typography.body, styles.actionsRowText]}>
                {isPaused ? t("subscription.resumeTitle") : t("subscription.pauseTitle")}
              </Text>
            </Pressable>
            <Pressable
              style={styles.actionsRow}
              onPress={() => {
                closeActionsModal();
                setConfirmAction("cancel");
              }}
            >
              <Text style={[typography.body, styles.actionsRowText]}>{t("subscription.markCancelled")}</Text>
            </Pressable>
            <Pressable
              style={styles.actionsRow}
              onPress={() => {
                closeActionsModal();
                setConfirmAction("delete");
              }}
            >
              <Text style={[typography.body, styles.actionsDeleteText]}>{t("subscription.deleteAction")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isPauseInfoModalVisible}
        onRequestClose={closePauseInfoModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePauseInfoModal} />
          <View style={[surfaces.panel, styles.actionsModal]}>
            <View style={styles.actionsHeader}>
              <Text style={[typography.cardTitle, styles.cardTitle]}>
                {isPaused ? t("subscription.resumeModalTitle") : t("subscription.pauseModalTitle")}
              </Text>
              <Pressable onPress={closePauseInfoModal} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[typography.secondary, styles.confirmMessage]}>
              {isPaused ? t("subscription.resumeModalMessage") : t("subscription.pauseModalMessage")}
            </Text>

            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.actionsRow, styles.confirmPrimaryRow]}
                onPress={handlePauseSubscription}
              >
                <Text style={[typography.body, styles.confirmPrimaryText]}>
                  {isPaused ? t("subscription.resumeModalConfirm") : t("subscription.pauseModalConfirm")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={confirmAction !== null}
        onRequestClose={closeConfirmModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeConfirmModal} />
          <View style={[surfaces.panel, styles.actionsModal]}>
            <View style={styles.actionsHeader}>
              <Text style={[typography.cardTitle, styles.cardTitle]}>
                {confirmAction === "cancel"
                  ? t("subscription.confirmCancelTitle")
                  : t("subscription.confirmDeleteTitle")}
              </Text>
              <Pressable onPress={closeConfirmModal} hitSlop={10}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={[typography.secondary, styles.confirmMessage]}>
              {confirmAction === "cancel"
                ? t("subscription.confirmCancelMessage")
                : t("subscription.confirmDeleteMessage")}
            </Text>

            <View style={styles.confirmActions}>
              <Pressable style={styles.actionsRow} onPress={closeConfirmModal}>
                <Text style={[typography.body, styles.actionsRowText]}>{t("common.cancel")}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionsRow, styles.confirmPrimaryRow]}
                onPress={confirmAction === "cancel" ? handleCancelSubscription : handleDeleteSubscription}
              >
                <Text
                  style={[
                    typography.body,
                    confirmAction === "cancel" ? styles.confirmPrimaryText : styles.actionsDeleteText,
                  ]}
                >
                  {confirmAction === "cancel"
                    ? t("subscription.confirmCancelAction")
                    : t("subscription.confirmDeleteAction")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    headerMenuButton: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      marginRight: -spacing.xs,
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
    syncNoticeCard: {
      gap: spacing.xs,
    },
    syncNoticeCardPending: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    syncNoticeCardLocalOnly: {
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfaceSoft,
    },
    syncNoticeCardError: {
      borderColor: `${colors.danger}40`,
      backgroundColor: `${colors.danger}12`,
    },
    syncNoticeCopy: {
      gap: spacing.xxs,
    },
    syncNoticeTitle: {
      color: colors.textPrimary,
    },
    syncNoticeTitlePending: {
      color: colors.accent,
    },
    syncNoticeTitleLocalOnly: {
      color: colors.textPrimary,
    },
    syncNoticeTitleError: {
      color: colors.danger,
    },
    syncNoticeDescription: {
      color: colors.textSecondary,
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
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.overlay,
      padding: spacing.lg,
    },
    actionsModal: {
      gap: spacing.sm,
    },
    actionsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginBottom: spacing.xs,
    },
    actionsRow: {
      minHeight: 48,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      paddingHorizontal: spacing.md,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    actionsRowText: {
      color: colors.textPrimary,
    },
    actionsDeleteText: {
      color: colors.danger,
    },
    confirmMessage: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    confirmActions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    confirmPrimaryRow: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    confirmPrimaryText: {
      color: colors.accent,
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
