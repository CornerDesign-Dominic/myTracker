import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { radius, spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RootStackParamList } from "@/navigation/types";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "SubscriptionDetails">;

export const SubscriptionDetailsScreen = ({ navigation, route }: Props) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { subscriptions } = useSubscriptions();
  const subscription = subscriptions.find((item) => item.id === route.params.subscriptionId);

  if (!subscription) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Abo nicht gefunden.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.name}>{subscription.name}</Text>
        <Text style={styles.category}>{subscription.category}</Text>
        <Text style={styles.price}>{formatCurrency(subscription.price, subscription.currency)}</Text>
        <Text style={styles.cycle}>/{subscription.billingCycle}</Text>
      </View>

      <View style={styles.card}>
        <InfoRow label="Status" value={subscription.status} colors={colors} />
        <InfoRow
          label="Naechste Zahlung"
          value={formatDate(subscription.nextPaymentDate)}
          colors={colors}
        />
        <InfoRow
          label="Kuendigungsfrist"
          value={formatDate(subscription.cancellationDeadline)}
          colors={colors}
        />
        <InfoRow label="Laeuft ab am" value={formatDate(subscription.endDate)} colors={colors} />
        <InfoRow label="Erstellt" value={formatDate(subscription.createdAt)} colors={colors} />
        <InfoRow
          label="Aktualisiert"
          value={formatDate(subscription.updatedAt)}
          colors={colors}
        />
      </View>

      {subscription.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notizen</Text>
          <Text style={styles.notes}>{subscription.notes}</Text>
        </View>
      ) : null}

      <Pressable
        style={styles.editButton}
        onPress={() =>
          navigation.navigate("SubscriptionForm", {
            subscriptionId: subscription.id,
          })
        }
      >
        <Text style={styles.editButtonText}>Abo bearbeiten</Text>
      </Pressable>
    </ScrollView>
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
  const styles = getStyles(colors);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroCard: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.accentText,
  },
  category: {
    fontSize: 15,
    color: colors.accentSoft,
  },
  price: {
    marginTop: spacing.md,
    fontSize: 26,
    fontWeight: "700",
    color: colors.accentText,
  },
  cycle: {
    fontSize: 14,
    color: colors.accentSoft,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  notes: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  editButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  });
