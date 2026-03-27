import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { FormField } from "@/components/forms/FormField";
import { SegmentedField } from "@/components/forms/SegmentedField";
import { billingCycleOptions, defaultCurrency, statusOptions } from "@/constants/options";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RootStackParamList } from "@/navigation/types";
import {
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  spacing,
} from "@/theme";
import { SubscriptionInput } from "@/types/subscription";
import { formatDate, isDateInputValid } from "@/utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "SubscriptionForm">;


const buildInitialState = (): SubscriptionInput => ({
  name: "",
  category: "",
  price: 0,
  currency: defaultCurrency,
  billingCycle: "monthly",
  nextPaymentDate: new Date().toISOString().slice(0, 10),
  status: "active",
  endDate: "",
  notes: "",
});

const toCurrencyCode = (currency: "EUR" | "Dollar") => (currency === "EUR" ? "EUR" : "USD");

const toDateValue = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export const SubscriptionFormScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
  const { currency } = useAppSettings();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const { subscriptions, createSubscription, updateSubscription } = useSubscriptions();
  const isEditing = Boolean(route.params?.subscriptionId);
  const existingSubscription = useMemo(
    () => subscriptions.find((subscription) => subscription.id === route.params?.subscriptionId),
    [route.params?.subscriptionId, subscriptions],
  );

  const [formState, setFormState] = useState<SubscriptionInput>(buildInitialState());
  const [showNextPaymentPicker, setShowNextPaymentPicker] = useState(false);

  useEffect(() => {
    if (!existingSubscription) {
      return;
    }

    setFormState({
      name: existingSubscription.name,
      category: existingSubscription.category,
      price: existingSubscription.price,
      currency: toCurrencyCode(currency),
      billingCycle: existingSubscription.billingCycle,
      nextPaymentDate: existingSubscription.nextPaymentDate,
      status: existingSubscription.status,
      endDate: existingSubscription.endDate ?? "",
      notes: existingSubscription.notes ?? "",
    });
  }, [currency, existingSubscription]);

  const updateField = <K extends keyof SubscriptionInput>(key: K, value: SubscriptionInput[K]) =>
    setFormState((current) => ({ ...current, [key]: value }));

  const validateForm = () => {
    if (!formState.name.trim() || !formState.category.trim()) {
      return t("subscription.validationRequired");
    }

    if (!Number.isFinite(formState.price) || formState.price <= 0) {
      return t("subscription.validationPrice");
    }

    if (!isDateInputValid(formState.nextPaymentDate)) {
      return t("subscription.validationNextPayment");
    }

    if (formState.status === "cancelled" && formState.endDate && !isDateInputValid(formState.endDate)) {
      return t("subscription.validationEndDate");
    }

    return null;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setShowNextPaymentPicker(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    updateField("nextPaymentDate", selectedDate.toISOString().slice(0, 10));
  };

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      Alert.alert(t("subscription.formAlertTitle"), validationError);
      return;
    }

    const payload: SubscriptionInput = {
      ...formState,
      name: formState.name.trim(),
      category: formState.category.trim(),
      currency: toCurrencyCode(currency),
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
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={layout.content}>
        <Text style={[typography.pageTitle, styles.title]}>
          {isEditing ? t("subscription.formEditTitle") : t("subscription.formCreateTitle")}
        </Text>
        <Text style={[typography.secondary, styles.subtitle]}>{t("subscription.formSubtitle")}</Text>

        <View style={styles.form}>
          <FormField
            label={t("subscription.name")}
            value={formState.name}
            onChangeText={(value) => updateField("name", value)}
            placeholder="z. B. Netflix"
          />
          <FormField
            label={t("subscription.category")}
            value={formState.category}
            onChangeText={(value) => updateField("category", value)}
            placeholder="z. B. Entertainment"
          />
          <FormField
            label={t("subscription.price")}
            value={String(formState.price || "")}
            onChangeText={(value) => updateField("price", Number(value.replace(",", ".")) || 0)}
            keyboardType="numeric"
            placeholder="9.99"
          />
          <SegmentedField
            label={t("subscription.billingCycle")}
            value={formState.billingCycle}
            onChange={(value) => updateField("billingCycle", value)}
            options={billingCycleOptions.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
          />

          <View style={styles.dateField}>
            <Text style={[typography.secondary, styles.dateLabel]}>
              {t("subscription.nextPaymentDate")}
            </Text>
            <Pressable
              style={[inputs.input, styles.dateTrigger]}
              onPress={() => setShowNextPaymentPicker(true)}
            >
              <Text style={[typography.body, styles.dateValue]}>
                {formatDate(formState.nextPaymentDate)}
              </Text>
            </Pressable>
            {showNextPaymentPicker ? (
              <DateTimePicker
                value={toDateValue(formState.nextPaymentDate)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateChange}
              />
            ) : null}
          </View>

          <SegmentedField
            label={t("subscription.status")}
            value={formState.status}
            onChange={(value) => updateField("status", value)}
            options={statusOptions.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            }))}
          />
          {formState.status === "cancelled" ? (
            <FormField
              label={t("subscription.endDate")}
              value={formState.endDate ?? ""}
              onChangeText={(value) => updateField("endDate", value)}
              placeholder={t("subscription.optional")}
            />
          ) : null}
          <FormField
            label={t("subscription.notes")}
            value={formState.notes ?? ""}
            onChangeText={(value) => updateField("notes", value)}
            placeholder={t("subscription.optional")}
            multiline
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[buttons.buttonBase, buttons.secondaryButton, styles.button]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[typography.button, styles.secondaryButtonText]}>{t("common.cancel")}</Text>
          </Pressable>
          <Pressable
            style={[buttons.buttonBase, buttons.primaryButton, styles.button]}
            onPress={handleSubmit}
          >
            <Text style={[typography.button, styles.primaryButtonText]}>
              {isEditing ? t("common.save") : t("subscription.create")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    title: {
      color: colors.textPrimary,
    },
    subtitle: {
      color: colors.textSecondary,
    },
    form: {
      gap: spacing.md,
    },
    dateField: {
      gap: spacing.xs,
    },
    dateLabel: {
      color: colors.textPrimary,
    },
    dateTrigger: {
      justifyContent: "center",
    },
    dateValue: {
      color: colors.textPrimary,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    button: {
      flex: 1,
    },
    primaryButtonText: {
      color: colors.accent,
    },
    secondaryButtonText: {
      color: colors.textPrimary,
    },
  });
