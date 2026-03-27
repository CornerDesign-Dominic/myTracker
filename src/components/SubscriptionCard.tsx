import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "@/hooks/useI18n";
import { createButtonStyles, createSurfaceStyles, radius, spacing } from "@/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Subscription } from "@/types/subscription";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export const SubscriptionCard = ({
  subscription,
  onPress,
  onEdit,
  onCancel,
}: SubscriptionCardProps) => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const statusMap: Record<Subscription["status"], { label: string; color: string }> = {
    active: { label: t("subscription.status_active"), color: colors.success },
    paused: { label: t("subscription.status_paused"), color: colors.warning },
    cancelled: { label: t("subscription.status_cancelled"), color: colors.danger },
  };
  const status = statusMap[subscription.status];

  return (
    <View style={[surfaces.panel, styles.card]}>
      <Pressable onPress={onPress} style={styles.contentArea}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={[typography.cardTitle, styles.name]}>{subscription.name}</Text>
            <Text style={[typography.secondary, styles.category]}>{subscription.category}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${status.color}20` }]}>
            <Text style={[typography.meta, styles.badgeText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={[typography.meta, styles.metaLabel]}>{t("allSubscriptions.price")}</Text>
            <Text style={[typography.body, styles.metaValue]}>
              {formatCurrency(subscription.price, subscription.currency)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[typography.meta, styles.metaLabel]}>
              {t("subscription.billingCycle")}
            </Text>
            <Text style={[typography.body, styles.metaValue]}>
              {t(`subscription.billing_${subscription.billingCycle}`)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[typography.meta, styles.metaLabel]}>
              {t("allSubscriptions.nextPayment")}
            </Text>
            <Text style={[typography.body, styles.metaValue]}>
              {formatDate(subscription.nextPaymentDate)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[typography.meta, styles.metaLabel]}>{t("subscription.endDate")}</Text>
            <Text style={[typography.body, styles.metaValue]}>{formatDate(subscription.endDate)}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        {onEdit ? (
          <Pressable style={[buttons.buttonBase, buttons.secondaryButton, styles.actionButton]} onPress={onEdit}>
            <Text style={[typography.button, styles.secondaryButtonText]}>{t("subscription.edit")}</Text>
          </Pressable>
        ) : null}
        {onCancel ? (
          <Pressable style={[buttons.buttonBase, buttons.primaryButton, styles.actionButton]} onPress={onCancel}>
            <Text style={[typography.button, styles.primaryButtonText]}>
              {t("subscription.markCancelled")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  contentArea: {
    gap: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
  },
  category: {
    color: colors.textSecondary,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  metaItem: {
    width: "48%",
    gap: 4,
  },
  metaLabel: {
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  primaryButtonText: {
    color: colors.accent,
  },
  secondaryButtonText: {
    color: colors.accent,
  },
  });
