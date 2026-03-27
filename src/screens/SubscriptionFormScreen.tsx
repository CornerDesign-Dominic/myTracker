import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

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
  createSurfaceStyles,
  spacing,
} from "@/theme";
import { SubscriptionInput } from "@/types/subscription";
import { formatDate, isDateInputValid } from "@/utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "SubscriptionForm">;

type EditableField =
  | "name"
  | "category"
  | "price"
  | "billingCycle"
  | "nextPaymentDate"
  | "status"
  | "notes"
  | null;

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
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const { subscriptions, createSubscription, updateSubscription } = useSubscriptions();
  const isEditing = Boolean(route.params?.subscriptionId);
  const existingSubscription = useMemo(
    () => subscriptions.find((subscription) => subscription.id === route.params?.subscriptionId),
    [route.params?.subscriptionId, subscriptions],
  );

  const [formState, setFormState] = useState<SubscriptionInput>(buildInitialState());
  const [activeField, setActiveField] = useState<EditableField>(null);

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

    if (
      formState.status === "cancelled" &&
      formState.endDate &&
      !isDateInputValid(formState.endDate)
    ) {
      return t("subscription.validationEndDate");
    }

    return null;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setActiveField(null);
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

  const renderTextEditor = (
    field: "name" | "category" | "price",
    keyboardType: "default" | "numeric" = "default",
  ) => (
    <TextInput
      value={field === "price" ? String(formState.price || "") : String(formState[field] ?? "")}
      onChangeText={(value) =>
        field === "price"
          ? updateField("price", Number(value.replace(",", ".")) || 0)
          : updateField(field, value)
      }
      keyboardType={keyboardType}
      placeholderTextColor={colors.textSecondary}
      style={[inputs.input, styles.inlineInput]}
      autoFocus
    />
  );

  const renderRow = ({
    field,
    label,
    value,
    editor,
  }: {
    field: Exclude<EditableField, "notes" | null>;
    label: string;
    value: string;
    editor: React.ReactNode;
  }) => {
    const isOpen = activeField === field;

    return (
      <View style={[styles.rowShell, isOpen ? styles.rowShellOpen : null]}>
        <Pressable style={styles.row} onPress={() => setActiveField(isOpen ? null : field)}>
          <Text style={[typography.body, styles.rowLabel]}>{label}</Text>
          <View style={styles.rowRight}>
            <Text style={[typography.secondary, styles.rowValue]} numberOfLines={1}>
              {value}
            </Text>
            <Ionicons
              name={isOpen ? "chevron-up-outline" : "chevron-forward-outline"}
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>
        {isOpen ? <View style={styles.rowEditor}>{editor}</View> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={layout.content}>
        <Text style={[typography.pageTitle, styles.title]}>
          {isEditing ? t("subscription.formEditTitle") : t("subscription.formCreateTitle")}
        </Text>

        <View style={[surfaces.panel, styles.groupCard]}>
          {renderRow({
            field: "name",
            label: t("subscription.name"),
            value: formState.name || t("subscription.optional"),
            editor: renderTextEditor("name"),
          })}

          {renderRow({
            field: "category",
            label: t("subscription.category"),
            value: formState.category || t("subscription.optional"),
            editor: renderTextEditor("category"),
          })}

          {renderRow({
            field: "price",
            label: t("subscription.price"),
            value: formState.price ? String(formState.price) : "0",
            editor: renderTextEditor("price", "numeric"),
          })}

          {renderRow({
            field: "billingCycle",
            label: t("subscription.formBillingCycle"),
            value: t(`subscription.billing_${formState.billingCycle}`),
            editor: (
              <View style={styles.optionEditor}>
                {billingCycleOptions.map((option) => {
                  const isActive = formState.billingCycle === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        buttons.buttonBase,
                        styles.optionButton,
                        isActive ? styles.optionButtonActive : buttons.secondaryButton,
                      ]}
                      onPress={() => {
                        updateField("billingCycle", option.value);
                        setActiveField(null);
                      }}
                    >
                      <Text
                        style={[
                          typography.button,
                          isActive ? styles.optionButtonTextActive : styles.optionButtonText,
                        ]}
                      >
                        {t(option.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ),
          })}

          {renderRow({
            field: "nextPaymentDate",
            label: t("subscription.formNextPaymentDate"),
            value: formatDate(formState.nextPaymentDate),
            editor: (
              <DateTimePicker
                value={toDateValue(formState.nextPaymentDate)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateChange}
              />
            ),
          })}

          {renderRow({
            field: "status",
            label: t("subscription.status"),
            value: t(`subscription.status_${formState.status}`),
            editor: (
              <View style={styles.optionEditor}>
                {statusOptions.map((option) => {
                  const isActive = formState.status === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        buttons.buttonBase,
                        styles.optionButton,
                        isActive ? styles.optionButtonActive : buttons.secondaryButton,
                      ]}
                      onPress={() => {
                        updateField("status", option.value);
                        setActiveField(null);
                      }}
                    >
                      <Text
                        style={[
                          typography.button,
                          isActive ? styles.optionButtonTextActive : styles.optionButtonText,
                        ]}
                      >
                        {t(option.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ),
          })}
        </View>

        <View style={[surfaces.subtlePanel, styles.notesCard]}>
          <Pressable style={styles.row} onPress={() => setActiveField(activeField === "notes" ? null : "notes")}>
            <Text style={[typography.body, styles.rowLabel]}>{t("subscription.notes")}</Text>
            <View style={styles.rowRight}>
              <Text style={[typography.secondary, styles.rowValue]} numberOfLines={1}>
                {formState.notes?.trim() || t("subscription.optional")}
              </Text>
              <Ionicons
                name={activeField === "notes" ? "chevron-up-outline" : "chevron-forward-outline"}
                size={18}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>
          {activeField === "notes" ? (
            <TextInput
              value={formState.notes ?? ""}
              onChangeText={(value) => updateField("notes", value)}
              placeholder={t("subscription.optional")}
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[inputs.input, styles.notesInput]}
              autoFocus
            />
          ) : null}
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
              {isEditing ? t("common.save") : t("subscription.formCreateAction")}
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
    groupCard: {
      paddingVertical: spacing.sm,
      gap: 0,
    },
    rowShell: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowShellOpen: {
      backgroundColor: colors.surfaceSoft,
    },
    row: {
      minHeight: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    rowLabel: {
      color: colors.textPrimary,
      flex: 1,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexShrink: 1,
    },
    rowValue: {
      color: colors.textSecondary,
      maxWidth: 170,
      textAlign: "right",
    },
    rowEditor: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    inlineInput: {
      color: colors.textPrimary,
    },
    optionEditor: {
      gap: spacing.sm,
    },
    optionButton: {
      justifyContent: "center",
    },
    optionButtonActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    optionButtonText: {
      color: colors.textPrimary,
    },
    optionButtonTextActive: {
      color: colors.accent,
    },
    notesCard: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    notesInput: {
      minHeight: 120,
      color: colors.textPrimary,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      textAlignVertical: "top",
    },
    actions: {
      flexDirection: "row",
      gap: spacing.md,
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
