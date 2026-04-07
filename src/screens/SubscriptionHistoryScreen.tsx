import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { EmptyState } from "@/components/EmptyState";
import { useAppSettings } from "@/context/AppSettingsContext";
import { formatHistoryEvent } from "@/domain/subscriptionHistory/events";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { RootStackParamList } from "@/navigation/types";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "SubscriptionHistory">;

export const SubscriptionHistoryScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { currency } = useAppSettings();
  const { language, t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { history, isLoading, errorMessage } = useSubscriptionHistory(
    route.params.subscriptionId,
  );

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={[
          layout.content,
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl + 76 },
        ]}
      >
        <Text style={[typography.secondary, styles.historyIntro]}>{t("history.pageHint")}</Text>

        <View style={[surfaces.panel, styles.listCard]}>
          {isLoading ? (
            <Text style={[typography.secondary, styles.helperText]}>{t("history.loading")}</Text>
          ) : errorMessage ? (
            <Text style={[typography.secondary, styles.errorText]}>{errorMessage}</Text>
          ) : history.length === 0 ? (
            <EmptyState
              title={t("history.emptyTitle")}
              description={t("history.emptyDescription")}
            />
          ) : (
            <View style={styles.historyList}>
              {history.map((event, index) => {
                const entry = formatHistoryEvent(event, { currency, language });
                const syncLabel =
                  event.syncState?.status === "localOnly"
                    ? t("history.localOnlyBadge")
                    : event.syncState?.status === "syncing"
                      ? t("history.syncingBadge")
                      : event.syncState?.status === "retryPending" ||
                          event.syncState?.status === "syncFailed"
                        ? t("history.retryBadge")
                        : event.syncState?.status === "pending"
                          ? t("history.pendingBadge")
                          : null;
                const row = (
                  <View
                    style={[
                      styles.historyRow,
                      index < history.length - 1 ? styles.historyDivider : null,
                    ]}
                  >
                    <View style={styles.historyCopy}>
                      <View style={styles.historyTitleRow}>
                        <Text style={[typography.body, styles.historyTitle]}>{entry.title}</Text>
                        {syncLabel ? (
                          <View
                            style={[
                              styles.historySyncBadge,
                              event.syncState?.hasError
                                ? styles.historySyncBadgeError
                                : event.syncState?.localOnly
                                  ? styles.historySyncBadgeLocalOnly
                                  : styles.historySyncBadgePending,
                            ]}
                          >
                            <Text
                              style={[
                                typography.meta,
                                styles.historySyncBadgeText,
                                event.syncState?.hasError
                                  ? styles.historySyncBadgeTextError
                                  : event.syncState?.localOnly
                                    ? styles.historySyncBadgeTextLocalOnly
                                    : styles.historySyncBadgeTextPending,
                              ]}
                            >
                              {syncLabel}
                            </Text>
                          </View>
                        ) : null}
                        {entry.canEdit ? (
                          <Ionicons
                            name="pencil-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                        ) : null}
                      </View>
                      {entry.subtitle ? (
                        <Text style={[typography.secondary, styles.historySubtitle]}>
                          {entry.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.historyMetaBlock}>
                      {entry.amountLabel ? (
                        <Text style={[typography.body, styles.historyAmount]}>
                          {entry.amountLabel}
                        </Text>
                      ) : null}
                      <Text style={[typography.secondary, styles.historyDate]}>{entry.dateLabel}</Text>
                    </View>
                  </View>
                );

                if (entry.canEdit) {
                  return (
                    <Pressable
                      key={event.id}
                      onPress={() =>
                        navigation.navigate("AddPayment", {
                          subscriptionId: route.params.subscriptionId,
                          eventId: event.id,
                        })
                      }
                    >
                      {row}
                    </Pressable>
                  );
                }

                return <View key={event.id}>{row}</View>;
              })}
            </View>
          )}
        </View>
      </ScrollView>
      <Pressable
        style={[styles.fabButton, { bottom: Math.max(spacing.lg, insets.bottom + spacing.sm) }]}
        onPress={() =>
          navigation.navigate("AddPayment", {
            subscriptionId: route.params.subscriptionId,
          })
        }
      >
        <Ionicons name="add" size={24} color={colors.accent} />
      </Pressable>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    content: {
      minHeight: "100%",
    },
    historyIntro: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    listCard: {
      gap: spacing.md,
    },
    historyList: {
      gap: spacing.xs,
    },
    historyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    historyDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    historyTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    historyTitle: {
      flexShrink: 1,
      color: colors.textPrimary,
    },
    historySyncBadge: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    historySyncBadgePending: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    historySyncBadgeLocalOnly: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.borderStrong,
    },
    historySyncBadgeError: {
      backgroundColor: `${colors.danger}14`,
      borderColor: `${colors.danger}33`,
    },
    historySyncBadgeText: {
      textTransform: "none",
    },
    historySyncBadgeTextPending: {
      color: colors.accent,
    },
    historySyncBadgeTextLocalOnly: {
      color: colors.textSecondary,
    },
    historySyncBadgeTextError: {
      color: colors.danger,
    },
    historySubtitle: {
      color: colors.textSecondary,
    },
    historyMetaBlock: {
      alignItems: "flex-end",
      gap: spacing.xxs,
    },
    historyAmount: {
      color: colors.textPrimary,
      textAlign: "right",
    },
    historyDate: {
      color: colors.textSecondary,
      textAlign: "right",
    },
    helperText: {
      color: colors.textSecondary,
    },
    errorText: {
      color: colors.danger,
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
  });
