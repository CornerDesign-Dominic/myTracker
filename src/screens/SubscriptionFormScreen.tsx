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
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { EditorSheet } from "@/components/forms/EditorSheet";
import { FormRow } from "@/components/forms/FormRow";
import { billingCycleOptions, defaultCurrency, statusOptions } from "@/constants/options";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useStoredCategories } from "@/hooks/useStoredCategories";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RootStackParamList } from "@/navigation/types";
import {
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  radius,
  spacing,
} from "@/theme";
import { BillingCycle, SubscriptionInput, SubscriptionStatus } from "@/types/subscription";
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

const formatPriceInput = (value: string) => value.replace(",", ".");

const DEFAULT_CATEGORIES = {
  de: [
    "Streaming",
    "Unterhaltung",
    "Musik",
    "Produktivität",
    "Cloud",
    "Fitness",
    "Gaming",
    "Software",
  ],
  en: [
    "Streaming",
    "Entertainment",
    "Music",
    "Productivity",
    "Cloud",
    "Fitness",
    "Gaming",
    "Software",
  ],
} as const;

export const SubscriptionFormScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
  const { currency, language } = useAppSettings();
  const { t } = useI18n();
  const styles = getStyles(colors);
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const defaultCategories = useMemo(() => DEFAULT_CATEGORIES[language], [language]);
  const { subscriptions, createSubscription, updateSubscription } = useSubscriptions();
  const { addCategory, getSuggestions } = useStoredCategories(defaultCategories);
  const isEditing = Boolean(route.params?.subscriptionId);
  const existingSubscription = useMemo(
    () => subscriptions.find((subscription) => subscription.id === route.params?.subscriptionId),
    [route.params?.subscriptionId, subscriptions],
  );

  const [formState, setFormState] = useState<SubscriptionInput>(buildInitialState());
  const [activeField, setActiveField] = useState<EditableField>(null);
  const [draftText, setDraftText] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [draftDate, setDraftDate] = useState(new Date());

  const categorySuggestion = useMemo(() => {
    if (activeField !== "category") {
      return null;
    }

    const query = draftText.trim();
    if (!query) {
      return null;
    }

    const match = getSuggestions(query).find(
      (category) => category.trim().toLocaleLowerCase() !== query.toLocaleLowerCase(),
    );

    return match ?? null;
  }, [activeField, draftText, getSuggestions]);

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

  const openTextSheet = (field: "name" | "category" | "notes") => {
    setDraftText(String(formState[field] ?? ""));
    setActiveField(field);
  };

  const openPriceSheet = () => {
    setDraftPrice(formState.price ? String(formState.price) : "");
    setActiveField("price");
  };

  const openDateSheet = () => {
    setDraftDate(toDateValue(formState.nextPaymentDate));
    setActiveField("nextPaymentDate");
  };

  const closeSheet = () => {
    setActiveField(null);
    setDraftText("");
    setDraftPrice("");
  };

  const saveActiveField = () => {
    if (activeField === "name" || activeField === "category" || activeField === "notes") {
      updateField(activeField, draftText);
      closeSheet();
      return;
    }

    if (activeField === "price") {
      const nextPrice = Number(formatPriceInput(draftPrice));
      updateField("price", Number.isFinite(nextPrice) ? nextPrice : 0);
      closeSheet();
      return;
    }

    if (activeField === "nextPaymentDate") {
      updateField("nextPaymentDate", draftDate.toISOString().slice(0, 10));
      closeSheet();
    }
  };

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      return;
    }

    setDraftDate(selectedDate);
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

    await addCategory(payload.category);

    navigation.goBack();
  };

  const formatPriceLabel = () =>
    formState.price
      ? `${formState.price.toFixed(2)} ${currency === "EUR" ? "EUR" : "USD"}`
      : "";

  const openBillingCycleSheet = () => setActiveField("billingCycle");
  const openStatusSheet = () => setActiveField("status");

  const selectBillingCycle = (value: BillingCycle) => {
    updateField("billingCycle", value);
    closeSheet();
  };

  const selectStatus = (value: SubscriptionStatus) => {
    updateField("status", value);
    closeSheet();
  };

  const renderTextSheet = (title: string, multiline = false) => (
    <EditorSheet
      visible={activeField === "name" || activeField === "category" || activeField === "notes"}
      title={title}
      onClose={closeSheet}
      onConfirm={saveActiveField}
      confirmLabel={t("common.save")}
      cancelLabel={t("common.cancel")}
    >
      <TextInput
        value={draftText}
        onChangeText={setDraftText}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        autoFocus
        style={[inputs.input, multiline ? styles.notesInput : styles.sheetInput]}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </EditorSheet>
  );

  const renderCategorySheet = () => (
    <EditorSheet
      visible={activeField === "category"}
      title={t("subscription.category")}
      onClose={closeSheet}
      onConfirm={saveActiveField}
      confirmLabel={t("common.save")}
      cancelLabel={t("common.cancel")}
      contentStyle={styles.categorySheetContent}
    >
      <TextInput
        value={draftText}
        onChangeText={setDraftText}
        placeholderTextColor={colors.textMuted}
        autoFocus
        style={[inputs.input, styles.sheetInput]}
      />
      {categorySuggestion ? (
        <Pressable
          style={[surfaces.subtlePanel, styles.singleSuggestionRow]}
          onPress={() => setDraftText(categorySuggestion)}
        >
          <Text style={[typography.secondary, styles.singleSuggestionLabel]}>
            {t("subscription.suggestion")}
          </Text>
          <Text style={[typography.body, styles.singleSuggestionValue]}>{categorySuggestion}</Text>
        </Pressable>
      ) : null}
    </EditorSheet>
  );

  const renderSelectOption = ({
    label,
    active,
    onPress,
    isLast = false,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
    isLast?: boolean;
  }) => (
    <Pressable style={[styles.selectRow, isLast ? styles.selectRowLast : null]} onPress={onPress}>
      <Text style={[typography.body, styles.selectLabel, active ? styles.selectLabelActive : null]}>
        {label}
      </Text>
      <View style={[styles.selectIndicator, active ? styles.selectIndicatorActive : null]} />
    </Pressable>
  );

  return (
    <SafeAreaView style={layout.screen} edges={["bottom"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.content]}>
        <Text style={[typography.pageTitle, styles.title]}>
          {isEditing ? t("subscription.formEditTitle") : t("subscription.formCreateTitle")}
        </Text>

        <View style={[surfaces.panel, styles.cardGroup]}>
          <FormRow
            label={t("subscription.name")}
            value={formState.name}
            onPress={() => openTextSheet("name")}
            isFirst
          />
          <FormRow
            label={t("subscription.category")}
            value={formState.category}
            onPress={() => openTextSheet("category")}
          />
          <FormRow
            label={t("subscription.price")}
            value={formatPriceLabel()}
            onPress={openPriceSheet}
          />
          <FormRow
            label={t("subscription.formBillingCycle")}
            value={t(`subscription.billing_${formState.billingCycle}`)}
            onPress={openBillingCycleSheet}
          />
          <FormRow
            label={t("subscription.formNextPaymentDate")}
            value={formatDate(formState.nextPaymentDate)}
            onPress={openDateSheet}
          />
          <FormRow
            label={t("subscription.status")}
            value={t(`subscription.status_${formState.status}`)}
            onPress={openStatusSheet}
            isLast
          />
        </View>

        <View style={[surfaces.subtlePanel, styles.notesCard]}>
          <FormRow
            label={t("subscription.notes")}
            value={formState.notes?.trim() ?? ""}
            onPress={() => openTextSheet("notes")}
            isFirst
            isLast
            multilineValue
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
              {isEditing ? t("common.save") : t("subscription.formCreateAction")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {activeField === "name" ? renderTextSheet(t("subscription.name")) : null}
      {activeField === "category" ? renderCategorySheet() : null}
      {activeField === "notes" ? renderTextSheet(t("subscription.notes"), true) : null}

      <EditorSheet
        visible={activeField === "price"}
        title={t("subscription.price")}
        onClose={closeSheet}
        onConfirm={saveActiveField}
        confirmLabel={t("common.save")}
        cancelLabel={t("common.cancel")}
      >
        <TextInput
          value={draftPrice}
          onChangeText={setDraftPrice}
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          autoFocus
          style={[inputs.input, styles.sheetInput]}
        />
      </EditorSheet>

      <EditorSheet
        visible={activeField === "billingCycle"}
        title={t("subscription.formBillingCycle")}
        onClose={closeSheet}
        confirmLabel={t("common.save")}
        cancelLabel={t("common.cancel")}
        showConfirm={false}
      >
        <View style={[surfaces.subtlePanel, styles.sheetList]}>
          {billingCycleOptions.map((option, index) => (
            <View key={option.value}>
              {renderSelectOption({
                label: t(option.labelKey),
                active: formState.billingCycle === option.value,
                onPress: () => selectBillingCycle(option.value),
                isLast: index === billingCycleOptions.length - 1,
              })}
            </View>
          ))}
        </View>
      </EditorSheet>

      <EditorSheet
        visible={activeField === "status"}
        title={t("subscription.status")}
        onClose={closeSheet}
        confirmLabel={t("common.save")}
        cancelLabel={t("common.cancel")}
        showConfirm={false}
      >
        <View style={[surfaces.subtlePanel, styles.sheetList]}>
          {statusOptions.map((option, index) => (
            <View key={option.value}>
              {renderSelectOption({
                label: t(option.labelKey),
                active: formState.status === option.value,
                onPress: () => selectStatus(option.value),
                isLast: index === statusOptions.length - 1,
              })}
            </View>
          ))}
        </View>
      </EditorSheet>

      <EditorSheet
        visible={activeField === "nextPaymentDate"}
        title={t("subscription.formNextPaymentDate")}
        onClose={closeSheet}
        onConfirm={saveActiveField}
        confirmLabel={t("common.save")}
        cancelLabel={t("common.cancel")}
      >
        <View style={[surfaces.subtlePanel, styles.datePreview]}>
          <Text style={[typography.meta, styles.datePreviewLabel]}>
            {t("subscription.formNextPaymentDate")}
          </Text>
          <Text style={[typography.sectionTitle, styles.datePreviewValue]}>
            {formatDate(draftDate.toISOString().slice(0, 10))}
          </Text>
        </View>
        <View style={styles.datePickerWrap}>
          <DateTimePicker
            value={draftDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "calendar"}
            onChange={handleDateChange}
            accentColor={colors.accent}
          />
        </View>
      </EditorSheet>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    title: {
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    content: {
      paddingTop: 0,
    },
    cardGroup: {
      paddingVertical: spacing.xs,
      paddingHorizontal: 0,
      overflow: "hidden",
    },
    notesCard: {
      paddingVertical: spacing.xs,
      paddingHorizontal: 0,
      overflow: "hidden",
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
    sheetInput: {
      color: colors.textPrimary,
      borderRadius: radius.md,
    },
    categorySheetContent: {
      gap: spacing.sm,
    },
    notesInput: {
      minHeight: 140,
      color: colors.textPrimary,
      borderRadius: radius.md,
    },
    sheetList: {
      padding: 0,
      overflow: "hidden",
    },
    selectRow: {
      minHeight: 56,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectRowLast: {
      borderBottomWidth: 0,
    },
    selectLabel: {
      color: colors.textPrimary,
    },
    selectLabelActive: {
      color: colors.accent,
    },
    selectIndicator: {
      width: 18,
      height: 18,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surface,
    },
    selectIndicatorActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    datePreview: {
      gap: spacing.xs,
    },
    datePreviewLabel: {
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    datePreviewValue: {
      color: colors.textPrimary,
    },
    datePickerWrap: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
    },
    singleSuggestionRow: {
      minHeight: 56,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.xxs,
    },
    singleSuggestionLabel: {
      color: colors.textMuted,
    },
    singleSuggestionValue: {
      color: colors.textPrimary,
    },
  });
