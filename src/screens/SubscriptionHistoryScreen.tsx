import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const { currency } = useAppSettings();
  const { language } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { history, isLoading, errorMessage } = useSubscriptionHistory(
    route.params.subscriptionId,
  );

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.content]}>
        <Pressable
          style={[surfaces.panel, styles.actionCard]}
          onPress={() =>
            navigation.navigate("AddPayment", {
              subscriptionId: route.params.subscriptionId,
            })
          }
        >
          <View style={styles.historyCopy}>
            <Text style={[typography.body, styles.historyTitle]}>
              {language === "de" ? "Zahlung hinzufügen" : "Add payment"}
            </Text>
            <Text style={[typography.secondary, styles.historySubtitle]}>
              {language === "de"
                ? "Vergangene Zahlungen der Historie hinzufügen"
                : "Add a past or current payment manually"}
            </Text>
          </View>
          <Text style={[typography.body, styles.historyArrow]}>›</Text>
        </Pressable>

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
                    </View>
                    <View style={styles.historyMetaBlock}>
                      {entry.canEdit ? (
                        <Ionicons
                          name="pencil-outline"
                          size={16}
                          color={colors.textSecondary}
                        />
                      ) : null}
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
    actionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
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
    historyArrow: {
      color: colors.textSecondary,
      fontSize: 22,
      lineHeight: 22,
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
