import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { getHistorySyncSummary, formatHistoryEvent } from "@/domain/subscriptionHistory/events";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { RootStackParamList } from "@/navigation/types";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";

type Props = NativeStackScreenProps<RootStackParamList, "SubscriptionHistory">;

export const SubscriptionHistoryScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { language } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { history, summary, isLoading, errorMessage } = useSubscriptionHistory(
    route.params.subscriptionId,
  );

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.content]}>
        <View style={[surfaces.panel, styles.summaryCard]}>
          <Text style={[typography.cardTitle, styles.sectionTitle]}>
            {language === "de" ? "Ausgesetzte Zahlungen" : "Skipped payments"}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[typography.meta, styles.summaryLabel]}>
                {language === "de" ? "Anzahl" : "Count"}
              </Text>
              <Text style={[typography.sectionTitle, styles.summaryValue]}>
                {summary.skippedPaymentsCount}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[typography.meta, styles.summaryLabel]}>
                {language === "de" ? "Gespart" : "Saved"}
              </Text>
              <Text style={[typography.sectionTitle, styles.summaryValue]}>
                {formatCurrency(summary.skippedPaymentsAmount, currency)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[surfaces.panel, styles.listCard]}>
          {isLoading ? (
            <Text style={[typography.secondary, styles.helperText]}>
              {language === "de" ? "Historie wird geladen..." : "Loading history..."}
            </Text>
          ) : errorMessage ? (
            <Text style={[typography.secondary, styles.errorText]}>{errorMessage}</Text>
          ) : history.length === 0 ? (
            <EmptyState
              title={language === "de" ? "Noch keine Historie vorhanden" : "No history yet"}
              description={
                language === "de"
                  ? "Sobald Ereignisse entstehen, erscheinen sie hier chronologisch."
                  : "Events will appear here in chronological order as soon as they exist."
              }
            />
          ) : (
            <View style={styles.historyList}>
              {history.map((event, index) => {
                const entry = formatHistoryEvent(event, { currency, language });
                const row = (
                  <View
                    style={[
                      styles.historyRow,
                      index < history.length - 1 ? styles.historyDivider : null,
                    ]}
                  >
                    <View style={styles.historyCopy}>
                      <Text style={[typography.body, styles.historyTitle]}>{entry.title}</Text>
                      {entry.subtitle ? (
                        <Text style={[typography.secondary, styles.historySubtitle]}>
                          {entry.subtitle}
                        </Text>
                      ) : null}
                      {entry.canEdit ? (
                        <Text style={[typography.meta, styles.historyMeta]}>
                          {language === "de" ? "Zum Bearbeiten öffnen" : "Tap to edit"}
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
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    content: {
      minHeight: "100%",
    },
    summaryCard: {
      gap: spacing.md,
    },
    sectionTitle: {
      color: colors.textPrimary,
    },
    summaryRow: {
      flexDirection: "row",
      gap: spacing.lg,
    },
    summaryItem: {
      flex: 1,
      gap: spacing.xxs,
    },
    summaryLabel: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    summaryValue: {
      color: colors.textPrimary,
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
    historyTitle: {
      color: colors.textPrimary,
    },
    historySubtitle: {
      color: colors.textSecondary,
    },
    historyMeta: {
      color: colors.textMuted,
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
  });
