import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { EmptyState } from "@/components/EmptyState";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { getSubscriptionsByBillingCycle } from "@/domain/subscriptions/statistics";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RootStackParamList } from "@/navigation/types";
import { createScreenLayout, createSurfaceStyles, spacing } from "@/theme";
import { formatCurrency } from "@/utils/currency";

type Props = NativeStackScreenProps<RootStackParamList, "BillingFrequency">;

export const BillingFrequencyScreen = ({ navigation }: Props) => {
  const { colors, typography } = useAppTheme();
  const { t } = useI18n();
  const { currency } = useAppSettings();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { subscriptions } = useSubscriptions();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = useMemo(
    () => [
      {
        title: t("billingFrequency.monthlyTitle"),
        subscriptions: getSubscriptionsByBillingCycle(subscriptions, "monthly"),
      },
      {
        title: t("billingFrequency.quarterlyTitle"),
        subscriptions: getSubscriptionsByBillingCycle(subscriptions, "quarterly"),
      },
      {
        title: t("billingFrequency.yearlyTitle"),
        subscriptions: getSubscriptionsByBillingCycle(subscriptions, "yearly"),
      },
    ].map((section) => ({
      ...section,
      totalAmount: section.subscriptions.reduce(
        (sum, subscription) => sum + subscription.amount,
        0,
      ),
    })),
    [subscriptions, t],
  );

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={layout.content}>
        {sections.map((section) => (
          <Pressable
            key={section.title}
            style={[surfaces.panel, styles.sectionCard]}
            onPress={() =>
              setExpandedSection((current) =>
                current === section.title ? null : section.title,
              )
            }
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={[typography.cardTitle, styles.sectionTitle]}>{section.title}</Text>
                <Text style={[typography.secondary, styles.sectionAmount]}>
                  {formatCurrency(section.totalAmount, currency)}
                </Text>
              </View>
              <Ionicons
                name={
                  expandedSection === section.title
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={18}
                color={colors.textSecondary}
              />
            </View>
            {expandedSection === section.title ? (
              section.subscriptions.length === 0 ? (
                <EmptyState
                  title={t("billingFrequency.emptyTitle")}
                  description={t("billingFrequency.emptyDescription")}
                />
              ) : (
                <View style={styles.list}>
                  {section.subscriptions.map((subscription) => (
                    <SubscriptionCard
                      key={subscription.id}
                      subscription={subscription}
                      neutralInactiveStatus
                      onPress={() =>
                        navigation.navigate("SubscriptionDetails", {
                          subscriptionId: subscription.id,
                        })
                      }
                    />
                  ))}
                </View>
              )
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    sectionCard: {
      gap: spacing.md,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    sectionHeaderCopy: {
      flex: 1,
      gap: spacing.xxs,
      minWidth: 0,
    },
    sectionTitle: {
      color: colors.textPrimary,
    },
    sectionAmount: {
      color: colors.textSecondary,
    },
    list: {
      gap: spacing.sm,
    },
  });
