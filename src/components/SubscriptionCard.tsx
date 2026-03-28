import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useI18n } from "@/hooks/useI18n";
import { createSurfaceStyles, radius, spacing } from "@/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Subscription } from "@/types/subscription";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress?: () => void;
  showStatus?: boolean;
}

export const SubscriptionCard = ({
  subscription,
  onPress,
  showStatus = true,
}: SubscriptionCardProps) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const surfaces = createSurfaceStyles(colors);
  const statusMap: Record<Subscription["status"], { label: string; color: string }> = {
    active: { label: t("subscription.status_active"), color: colors.accent },
    paused: { label: t("subscription.status_paused"), color: colors.warning },
    cancelled: { label: t("subscription.status_cancelled"), color: colors.danger },
  };
  const status = statusMap[subscription.status];

  return (
    <View style={[surfaces.panel, styles.card]}>
      <Pressable onPress={onPress} style={styles.contentArea}>
        <View style={styles.topRow}>
          <View style={styles.headerMain}>
            <SubscriptionAvatar
              name={subscription.name}
              category={subscription.category}
            />
            <View style={styles.titleBlock}>
              <Text style={[typography.cardTitle, styles.name]}>{subscription.name}</Text>
              <Text style={[typography.secondary, styles.category]}>{subscription.category}</Text>
            </View>
          </View>
          {showStatus ? (
            <View style={[styles.badge, { backgroundColor: `${status.color}20` }]}>
              <Text style={[typography.meta, styles.badgeText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={[typography.meta, styles.metaLabel]}>{t("allSubscriptions.amount")}</Text>
            <Text style={[typography.body, styles.metaValue]}>
              {formatCurrency(subscription.amount, currency)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[typography.meta, styles.metaLabel]}>
              {t("subscription.formBillingCycle")}
            </Text>
            <Text style={[typography.body, styles.metaValue]}>
              {t(`subscription.billing_${subscription.billingCycle}`)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={[typography.meta, styles.metaLabel]}>
              {t("subscription.formNextPaymentDate")}
            </Text>
            <Text style={[typography.body, styles.metaValue]}>
              {formatDate(subscription.nextPaymentDate)}
            </Text>
          </View>
          <View style={[styles.metaItem, styles.iconMetaItem]}>
            <Pressable style={styles.iconButton} onPress={onPress} hitSlop={10}>
              <Ionicons name="pencil-outline" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  contentArea: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  headerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
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
    gap: spacing.xs,
  },
  metaItem: {
    width: "48%",
    gap: 2,
  },
  metaLabel: {
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.textPrimary,
  },
  iconMetaItem: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  });
