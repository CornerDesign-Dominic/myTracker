import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useI18n } from "@/hooks/useI18n";
import { createSurfaceStyles, radius, spacing } from "@/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Subscription } from "@/types/subscription";
import { localizeCategory } from "@/utils/categories";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type StatusTone = {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress?: () => void;
  showStatus?: boolean;
  neutralInactiveStatus?: boolean;
  compact?: boolean;
  hideNextPaymentDate?: boolean;
  hideBillingCycle?: boolean;
  hideBillingCycleLabel?: boolean;
  hideAmountLabel?: boolean;
  stackAmountUnderCategory?: boolean;
  denseHeader?: boolean;
  statusAboveActionIcon?: boolean;
  accentAmount?: boolean;
  actionText?: string;
  actionIconName?: "pencil-outline" | "chevron-forward-outline";
}

export const getSubscriptionStatusTone = (
  status: Subscription["status"],
  colors: ReturnType<typeof useAppTheme>["colors"],
  neutralInactiveStatus = false,
): StatusTone => {
  if (status === "active") {
    return {
      backgroundColor: colors.accentSoft,
      borderColor: `${colors.accent}30`,
      textColor: colors.accent,
    };
  }

  if (neutralInactiveStatus || status === "paused") {
    return {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      textColor: colors.textSecondary,
    };
  }

  return {
    backgroundColor: `${colors.danger}14`,
    borderColor: `${colors.danger}2E`,
    textColor: colors.danger,
  };
};

export const SubscriptionCard = ({
  subscription,
  onPress,
  showStatus = true,
  neutralInactiveStatus = false,
  compact = false,
  hideNextPaymentDate = false,
  hideBillingCycle = false,
  hideBillingCycleLabel = false,
  hideAmountLabel = false,
  stackAmountUnderCategory = false,
  denseHeader = false,
  statusAboveActionIcon = false,
  accentAmount = false,
  actionText,
  actionIconName = "pencil-outline",
}: SubscriptionCardProps) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const styles = getStyles(colors);
  const surfaces = createSurfaceStyles(colors);
  const localizedCategory = localizeCategory(subscription.category, language);
  const statusTone = getSubscriptionStatusTone(
    subscription.status,
    colors,
    neutralInactiveStatus,
  );

  return (
    <View style={[surfaces.panel, styles.card]}>
      <Pressable onPress={onPress} style={styles.contentArea}>
        <View style={styles.topRow}>
          <View
            style={[
              styles.headerMain,
              statusAboveActionIcon ? styles.headerMainTopAligned : null,
            ]}
          >
            {statusAboveActionIcon ? (
              <View style={styles.leadingStatusAvatarColumn}>
                <SubscriptionAvatar
                  name={subscription.name}
                  category={subscription.category}
                />
              </View>
            ) : (
              <SubscriptionAvatar
                name={subscription.name}
                category={subscription.category}
              />
            )}
            <View
              style={[
                styles.titleBlock,
                denseHeader ? styles.titleBlockDense : null,
                statusAboveActionIcon ? styles.titleBlockTight : null,
              ]}
            >
              <Text
                style={[
                  typography.cardTitle,
                  styles.name,
                  denseHeader ? styles.nameDense : null,
                ]}
              >
                {subscription.name}
              </Text>
              <Text style={[typography.secondary, styles.category]}>{localizedCategory}</Text>
              {statusAboveActionIcon && hideNextPaymentDate ? (
                <View style={styles.amountIntervalRow}>
                  <View style={styles.alignedMetaBlock}>
                    {hideAmountLabel ? null : (
                      <Text style={[typography.meta, styles.metaLabel]}>{t("allSubscriptions.amount")}</Text>
                    )}
                    <Text
                      style={[
                        typography.body,
                        styles.metaValue,
                        accentAmount ? styles.accentAmountValue : null,
                      ]}
                    >
                      {formatCurrency(subscription.amount, currency)}
                    </Text>
                  </View>
                  {hideBillingCycle ? null : (
                    <View style={[styles.alignedMetaBlock, styles.intervalMetaBlock]}>
                      {hideBillingCycleLabel ? null : (
                        <Text style={[typography.meta, styles.metaLabel]}>
                          {t("subscription.formBillingCycle")}
                        </Text>
                      )}
                      <Text style={[typography.body, styles.metaValue]}>
                        {t(`subscription.billing_${subscription.billingCycle}`)}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
              {stackAmountUnderCategory ? (
                <View style={styles.stackedAmountRow}>
                  <Text
                    style={[
                      typography.body,
                      styles.stackedAmountValue,
                      accentAmount ? styles.accentAmountValue : null,
                    ]}
                  >
                    {formatCurrency(subscription.amount, currency)}
                  </Text>
                  <Pressable style={styles.stackedChevronButton} onPress={onPress} hitSlop={10}>
                    <Ionicons name={actionIconName} size={18} color={colors.textPrimary} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
          {compact ? (
            <Text style={[typography.body, styles.compactAmount]}>
              {formatCurrency(subscription.amount, currency)}
            </Text>
          ) : null}
          {showStatus && !compact && !statusAboveActionIcon ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: statusTone.backgroundColor,
                  borderColor: statusTone.borderColor,
                },
              ]}
            >
              <Text
                style={[
                  typography.meta,
                  styles.badgeText,
                  { color: statusTone.textColor },
                ]}
              >
                {t(`subscription.status_${subscription.status}`)}
              </Text>
            </View>
          ) : null}
        </View>

        {compact ? null : (
          hideNextPaymentDate ? (
            statusAboveActionIcon ? (
              <View style={styles.statusActionRow}>
                <View style={styles.statusActionLeading}>
                  <Text
                    style={[
                      typography.meta,
                      styles.plainStatusText,
                      { color: statusTone.textColor },
                    ]}
                  >
                    {t(`subscription.status_${subscription.status}`)}
                  </Text>
                </View>
                <View style={styles.statusActionTrailing}>
                  {actionText ? (
                    <Pressable onPress={onPress} hitSlop={10}>
                      <Text style={[typography.body, styles.actionText]}>{actionText}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : stackAmountUnderCategory && hideBillingCycle ? null : (
              <View style={styles.compactMetaRow}>
                <View style={[styles.metaItem, styles.compactMetaItem]}>
                  {stackAmountUnderCategory ? null : (
                    <>
                      {hideAmountLabel ? null : (
                        <Text style={[typography.meta, styles.metaLabel]}>{t("allSubscriptions.amount")}</Text>
                      )}
                      <Text
                        style={[
                          typography.body,
                          styles.metaValue,
                          accentAmount ? styles.accentAmountValue : null,
                        ]}
                      >
                        {formatCurrency(subscription.amount, currency)}
                      </Text>
                    </>
                  )}
                </View>
                <View style={[styles.metaItem, styles.compactMetaItem]}>
                  {hideBillingCycle ? null : (
                    <>
                      {hideBillingCycleLabel ? null : (
                        <Text style={[typography.meta, styles.metaLabel]}>
                          {t("subscription.formBillingCycle")}
                        </Text>
                      )}
                      <Text style={[typography.body, styles.metaValue]}>
                        {t(`subscription.billing_${subscription.billingCycle}`)}
                      </Text>
                    </>
                  )}
                </View>
                <Pressable style={styles.inlineIconButton} onPress={onPress} hitSlop={10}>
                  <Ionicons name={actionIconName} size={18} color={colors.textPrimary} />
                </Pressable>
              </View>
            )
          ) : (
            <View style={[styles.metaGrid, statusAboveActionIcon ? styles.metaGridAligned : null]}>
              <View style={styles.metaItem}>
                {stackAmountUnderCategory ? null : (
                  <>
                    {hideAmountLabel ? null : (
                      <Text style={[typography.meta, styles.metaLabel]}>{t("allSubscriptions.amount")}</Text>
                    )}
                    <Text
                      style={[
                        typography.body,
                        styles.metaValue,
                        accentAmount ? styles.accentAmountValue : null,
                      ]}
                    >
                      {formatCurrency(subscription.amount, currency)}
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.metaItem}>
                {hideBillingCycle ? null : (
                  <>
                    {hideBillingCycleLabel ? null : (
                      <Text style={[typography.meta, styles.metaLabel]}>
                        {t("subscription.formBillingCycle")}
                      </Text>
                    )}
                    <Text style={[typography.body, styles.metaValue]}>
                      {t(`subscription.billing_${subscription.billingCycle}`)}
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.metaItem}>
                <Text style={[typography.meta, styles.metaLabel]}>
                  {t("subscription.formNextPaymentDate")}
                </Text>
                <Text style={[typography.body, styles.metaValue]}>
                  {formatDate(subscription.nextPaymentDate)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <View style={styles.iconMetaItem}>
                  <Pressable style={styles.iconButton} onPress={onPress} hitSlop={10}>
                    <Ionicons name={actionIconName} size={18} color={colors.textPrimary} />
                  </Pressable>
                </View>
              </View>
            </View>
          )
        )}
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
  headerMainTopAligned: {
    alignItems: "flex-start",
  },
  leadingStatusAvatarColumn: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  titleBlockDense: {
    gap: 2,
  },
  titleBlockTight: {
    gap: 2,
  },
  stackedAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: 0,
    marginBottom: -2,
  },
  stackedAmountValue: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
  },
  stackedChevronButton: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    lineHeight: 28,
  },
  nameDense: {
    fontSize: 20,
    lineHeight: 26,
  },
  category: {
    color: colors.textSecondary,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
  },
  badgeTrailing: {
    alignSelf: "flex-end",
  },
  badgeTopLeft: {
    alignItems: "center",
  },
  borderlessBadge: {
    borderWidth: 0,
  },
  badgeText: {
  },
  plainStatusText: {
    textTransform: "uppercase",
    textAlign: "center",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  metaGridAligned: {
    paddingLeft: 44 + spacing.md,
  },
  amountIntervalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  alignedMetaBlock: {
    minWidth: 0,
    gap: 2,
  },
  intervalMetaBlock: {
    alignItems: "flex-start",
  },
  statusActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statusActionLeading: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  statusActionTrailing: {
    flex: 1,
    minWidth: 0,
  },
  actionText: {
    color: colors.accent,
  },
  compactMetaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  metaItem: {
    width: "48%",
    gap: 2,
  },
  compactMetaItem: {
    flex: 1,
    width: undefined,
    minWidth: 0,
  },
  metaLabel: {
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  metaValue: {
    color: colors.textPrimary,
  },
  accentAmountValue: {
    color: colors.accent,
  },
  compactAmount: {
    color: colors.textPrimary,
    textAlign: "right",
    alignSelf: "center",
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
  inlineIconButton: {
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  });
