import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { FormField } from "@/components/forms/FormField";
import { SegmentedField } from "@/components/forms/SegmentedField";
import { billingCycleOptions, defaultCurrency, statusOptions } from "@/constants/options";
import { colors, radius, spacing } from "@/constants/theme";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RootStackParamList } from "@/navigation/types";
import { SubscriptionInput } from "@/types/subscription";
import { isDateInputValid } from "@/utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "SubscriptionForm">;

const buildInitialState = (): SubscriptionInput => ({
  name: "",
  category: "",
  price: 0,
  currency: defaultCurrency,
  billingCycle: "monthly",
  nextPaymentDate: new Date().toISOString().slice(0, 10),
  cancellationDeadline: "",
  status: "active",
  endDate: "",
  notes: "",
});

export const SubscriptionFormScreen = ({ navigation, route }: Props) => {
  const { subscriptions, createSubscription, updateSubscription } = useSubscriptions();
  const isEditing = Boolean(route.params?.subscriptionId);
  const existingSubscription = useMemo(
    () =>
      subscriptions.find(
        (subscription) => subscription.id === route.params?.subscriptionId,
      ),
    [route.params?.subscriptionId, subscriptions],
  );

  const [formState, setFormState] = useState<SubscriptionInput>(buildInitialState());

  useEffect(() => {
    if (!existingSubscription) {
      return;
    }

    setFormState({
      name: existingSubscription.name,
      category: existingSubscription.category,
      price: existingSubscription.price,
      currency: existingSubscription.currency,
      billingCycle: existingSubscription.billingCycle,
      nextPaymentDate: existingSubscription.nextPaymentDate,
      cancellationDeadline: existingSubscription.cancellationDeadline ?? "",
      status: existingSubscription.status,
      endDate: existingSubscription.endDate ?? "",
      notes: existingSubscription.notes ?? "",
    });
  }, [existingSubscription]);

  const updateField = <K extends keyof SubscriptionInput>(key: K, value: SubscriptionInput[K]) =>
    setFormState((current) => ({ ...current, [key]: value }));

  const validateForm = () => {
    if (!formState.name.trim() || !formState.category.trim()) {
      return "Name und Kategorie sind Pflichtfelder.";
    }

    if (!Number.isFinite(formState.price) || formState.price <= 0) {
      return "Bitte einen gueltigen Preis angeben.";
    }

    if (!isDateInputValid(formState.nextPaymentDate)) {
      return "Bitte ein gueltiges naechstes Zahlungsdatum im Format JJJJ-MM-TT angeben.";
    }

    if (formState.cancellationDeadline && !isDateInputValid(formState.cancellationDeadline)) {
      return "Die Kuendigungsfrist braucht das Format JJJJ-MM-TT.";
    }

    if (
      formState.status === "cancelled" &&
      formState.endDate &&
      !isDateInputValid(formState.endDate)
    ) {
      return "Das Enddatum braucht das Format JJJJ-MM-TT.";
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      Alert.alert("Formular pruefen", validationError);
      return;
    }

    const payload: SubscriptionInput = {
      ...formState,
      name: formState.name.trim(),
      category: formState.category.trim(),
      currency: formState.currency.trim().toUpperCase() || defaultCurrency,
      cancellationDeadline: formState.cancellationDeadline || undefined,
      endDate: formState.status === "cancelled" ? formState.endDate || undefined : undefined,
      notes: formState.notes?.trim() || undefined,
    };

    if (isEditing && route.params?.subscriptionId) {
      await updateSubscription(route.params.subscriptionId, payload);
    } else {
      await createSubscription(payload);
    }

    navigation.goBack();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEditing ? "Abo bearbeiten" : "Abo hinzufuegen"}</Text>
      <Text style={styles.subtitle}>
        Wenige Felder, klare Struktur und vorbereitet fuer spaetere Erweiterungen.
      </Text>

      <View style={styles.form}>
        <FormField
          label="Name"
          value={formState.name}
          onChangeText={(value) => updateField("name", value)}
          placeholder="z. B. Netflix"
        />
        <FormField
          label="Kategorie"
          value={formState.category}
          onChangeText={(value) => updateField("category", value)}
          placeholder="z. B. Entertainment"
        />
        <FormField
          label="Preis"
          value={String(formState.price || "")}
          onChangeText={(value) => updateField("price", Number(value.replace(",", ".")) || 0)}
          keyboardType="numeric"
          placeholder="9.99"
        />
        <FormField
          label="Waehrung"
          value={formState.currency}
          onChangeText={(value) => updateField("currency", value)}
          placeholder="EUR"
        />
        <SegmentedField
          label="Abrechnungsintervall"
          value={formState.billingCycle}
          onChange={(value) => updateField("billingCycle", value)}
          options={billingCycleOptions}
        />
        <FormField
          label="Naechstes Zahlungsdatum"
          value={formState.nextPaymentDate}
          onChangeText={(value) => updateField("nextPaymentDate", value)}
          placeholder="2026-04-01"
          helpText="Bitte im Format JJJJ-MM-TT eingeben."
        />
        <FormField
          label="Kuendigungsfrist"
          value={formState.cancellationDeadline ?? ""}
          onChangeText={(value) => updateField("cancellationDeadline", value)}
          placeholder="Optional"
        />
        <SegmentedField
          label="Status"
          value={formState.status}
          onChange={(value) => updateField("status", value)}
          options={statusOptions}
        />
        {formState.status === "cancelled" ? (
          <FormField
            label="Laeuft ab am"
            value={formState.endDate ?? ""}
            onChangeText={(value) => updateField("endDate", value)}
            placeholder="Optional"
          />
        ) : null}
        <FormField
          label="Notizen"
          value={formState.notes ?? ""}
          onChangeText={(value) => updateField("notes", value)}
          placeholder="Optional"
          multiline
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Abbrechen</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.primaryButton]} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>
            {isEditing ? "Speichern" : "Abo anlegen"}
          </Text>
        </Pressable>
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
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
  },
  form: {
    gap: spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
});
