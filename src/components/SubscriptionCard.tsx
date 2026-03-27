import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";
import { Subscription } from "@/types/subscription";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

const statusMap: Record<Subscription["status"], { label: string; color: string }> = {
  active: { label: "Aktiv", color: colors.success },
  paused: { label: "Pausiert", color: colors.warning },
  cancelled: { label: "Gekuendigt", color: colors.danger },
};

export const SubscriptionCard = ({
  subscription,
  onPress,
  onEdit,
  onCancel,
}: SubscriptionCardProps) => {
  const status = statusMap[subscription.status];

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} style={styles.contentArea}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.name}>{subscription.name}</Text>
            <Text style={styles.category}>{subscription.category}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${status.color}20` }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Preis</Text>
            <Text style={styles.metaValue}>
              {formatCurrency(subscription.price, subscription.currency)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Intervall</Text>
            <Text style={styles.metaValue}>{subscription.billingCycle}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Naechste Zahlung</Text>
            <Text style={styles.metaValue}>{formatDate(subscription.nextPaymentDate)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Ende</Text>
            <Text style={styles.metaValue}>{formatDate(subscription.endDate)}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        {onEdit ? (
          <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={onEdit}>
            <Text style={styles.secondaryButtonText}>Bearbeiten</Text>
          </Pressable>
        ) : null}
        {onCancel ? (
          <Pressable style={[styles.actionButton, styles.primaryButton]} onPress={onCancel}>
            <Text style={styles.primaryButtonText}>Als gekuendigt markieren</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  category: {
    fontSize: 14,
    color: colors.textMuted,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
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
    fontSize: 12,
    color: colors.textMuted,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
