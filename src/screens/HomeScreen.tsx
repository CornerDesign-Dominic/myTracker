import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { colors, radius, spacing } from "@/constants/theme";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { HomeTabScreenProps } from "@/navigation/types";
import { formatCurrency } from "@/utils/currency";

export const HomeScreen = ({ navigation }: HomeTabScreenProps) => {
  const {
    subscriptions,
    metrics,
    updateSubscription,
    errorMessage,
    isLoading,
    isUsingFirebase,
  } = useSubscriptions();
  const [showCancelled, setShowCancelled] = useState(false);

  const visibleSubscriptions = useMemo(() => {
    if (showCancelled) {
      return subscriptions;
    }

    return subscriptions.filter((subscription) => subscription.status !== "cancelled");
  }, [showCancelled, subscriptions]);

  const handleCancel = async (id: string) => {
    const subscription = subscriptions.find((item) => item.id === id);

    await updateSubscription(id, {
      status: "cancelled",
      endDate: subscription?.endDate ?? subscription?.nextPaymentDate,
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        title="Deine Abos"
        subtitle={
          isUsingFirebase
            ? "Live-Daten aus Firestore."
            : "Seed-Daten aktiv. Firebase kann spaeter per Env aktiviert werden."
        }
        action={
          <Pressable
            style={styles.addButton}
            onPress={() => navigation.navigate("SubscriptionForm")}
          >
            <Text style={styles.addButtonText}>+ Neu</Text>
          </Pressable>
        }
      />

      <View style={styles.statsRow}>
        <StatCard
          label="Monatlich"
          value={formatCurrency(metrics.monthlyTotal)}
          tone="accent"
        />
        <StatCard label="Jaehrlich" value={formatCurrency(metrics.yearlyTotal)} />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Aktive Abos" value={String(metrics.activeCount)} />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>Gekuendigte anzeigen</Text>
          <Text style={styles.toggleText}>Blende auslaufende oder beendete Abos ein.</Text>
        </View>
        <Switch value={showCancelled} onValueChange={setShowCancelled} />
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {isLoading ? <Text style={styles.helperText}>Lade Abos...</Text> : null}

      {!isLoading && visibleSubscriptions.length === 0 ? (
        <EmptyState
          title="Noch keine Abos sichtbar"
          description="Lege dein erstes Abo an oder blende gekuendigte Eintraege wieder ein."
        />
      ) : null}

      <View style={styles.list}>
        {visibleSubscriptions.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            onPress={() =>
              navigation.navigate("SubscriptionDetails", {
                subscriptionId: subscription.id,
              })
            }
            onEdit={() =>
              navigation.navigate("SubscriptionForm", {
                subscriptionId: subscription.id,
              })
            }
            onCancel={
              subscription.status === "cancelled"
                ? undefined
                : () => handleCancel(subscription.id)
            }
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  toggleText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  helperText: {
    color: colors.textMuted,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
});
