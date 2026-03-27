import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { formatDate, formatLocalDateInput, isDateInputValid, parseLocalDateInput } from "@/utils/date";

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

type WheelOption<T extends string | number> = {
  label: string;
  value: T;
};

type DateWheelProps<T extends string | number> = {
  label: string;
  options: WheelOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
};

const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS;
const YEAR_RANGE_START = 2000;
const YEAR_RANGE_END = 2045;

const buildInitialState = (): SubscriptionInput => ({
  name: "",
  category: "",
  price: 0,
  currency: defaultCurrency,
  billingCycle: "monthly",
  nextPaymentDate: formatLocalDateInput(new Date()),
  status: "active",
  endDate: "",
  notes: "",
});

const toCurrencyCode = (currency: "EUR" | "Dollar") => (currency === "EUR" ? "EUR" : "USD");

const toDateValue = (value: string) => {
  return parseLocalDateInput(value) ?? new Date();
};

const formatPriceInput = (value: string) => value.replace(",", ".");
const daysInMonth = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate();
const clampDay = (year: number, monthIndex: number, day: number) =>
  Math.min(day, daysInMonth(year, monthIndex));

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

const DateWheel = <T extends string | number>({
  label,
  options,
  selectedValue,
  onChange,
  colors,
}: DateWheelProps<T>) => {
  const { typography } = useAppTheme();
  const styles = getStyles(colors);
  const listRef = useRef<FlatList<WheelOption<T>>>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  );

  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: selectedIndex * WHEEL_ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT);
    const boundedIndex = Math.max(0, Math.min(options.length - 1, rawIndex));
    const nextValue = options[boundedIndex]?.value;

    if (nextValue !== undefined && nextValue !== selectedValue) {
      onChange(nextValue);
    }
  };

  return (
    <View style={styles.wheelCard}>
      <Text style={[typography.meta, styles.dateSelectorLabel]}>{label}</Text>
      <View style={styles.wheelViewport}>
        <View pointerEvents="none" style={styles.wheelSelectionFrame} />
        <FlatList
          ref={listRef}
          data={options}
          keyExtractor={(item) => String(item.value)}
          showsVerticalScrollIndicator={false}
          snapToInterval={WHEEL_ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={styles.wheelContent}
          getItemLayout={(_, index) => ({
            length: WHEEL_ITEM_HEIGHT,
            offset: WHEEL_ITEM_HEIGHT * index,
            index,
          })}
          initialScrollIndex={selectedIndex}
          onScrollToIndexFailed={() => {
            listRef.current?.scrollToOffset({
              offset: selectedIndex * WHEEL_ITEM_HEIGHT,
              animated: false,
            });
          }}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          renderItem={({ item }) => {
            const isSelected = item.value === selectedValue;

            return (
              <View style={styles.wheelRow}>
                <Text
                  style={[
                    typography.body,
                    styles.wheelRowText,
                    isSelected ? styles.wheelRowTextActive : styles.wheelRowTextInactive,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
};

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
      updateField("nextPaymentDate", formatLocalDateInput(draftDate));
      closeSheet();
    }
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

  const updateDraftDay = (day: number) => {
    setDraftDate((current) => new Date(current.getFullYear(), current.getMonth(), day));
  };

  const updateDraftMonth = (month: number) => {
    setDraftDate((current) => {
      const year = current.getFullYear();
      const day = clampDay(year, month, current.getDate());
      return new Date(year, month, day);
    });
  };

  const updateDraftYear = (year: number) => {
    setDraftDate((current) => {
      const month = current.getMonth();
      const day = clampDay(year, month, current.getDate());
      return new Date(year, month, day);
    });
  };

  const renderTextSheet = (title: string, multiline = false) => (
    <EditorSheet
      visible={activeField === "name" || activeField === "category" || activeField === "notes"}
      title={title}
      onClose={closeSheet}
      onConfirm={saveActiveField}
      confirmLabel={t("common.save")}
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

  const dayOptions = useMemo(
    () =>
      Array.from({ length: daysInMonth(draftDate.getFullYear(), draftDate.getMonth()) }, (_, index) => ({
        label: String(index + 1).padStart(2, "0"),
        value: index + 1,
      })),
    [draftDate],
  );
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        label: String(index + 1).padStart(2, "0"),
        value: index,
      })),
    [],
  );
  const yearOptions = useMemo(
    () =>
      Array.from({ length: YEAR_RANGE_END - YEAR_RANGE_START + 1 }, (_, index) => {
        const value = YEAR_RANGE_START + index;
        return {
          label: String(value),
          value,
        };
      }),
    [],
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
        contentStyle={styles.dateSheetContent}
      >
        <View style={styles.datePickerWrap}>
          <View style={styles.dateSelectors}>
            <DateWheel
              label={language === "de" ? "Tag" : "Day"}
              options={dayOptions}
              selectedValue={draftDate.getDate()}
              onChange={updateDraftDay}
              colors={colors}
            />
            <DateWheel
              label={language === "de" ? "Monat" : "Month"}
              options={monthOptions}
              selectedValue={draftDate.getMonth()}
              onChange={updateDraftMonth}
              colors={colors}
            />
            <DateWheel
              label={language === "de" ? "Jahr" : "Year"}
              options={yearOptions}
              selectedValue={draftDate.getFullYear()}
              onChange={updateDraftYear}
              colors={colors}
            />
          </View>
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
    dateSheetContent: {
      gap: 0,
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
    datePickerWrap: {
      paddingTop: spacing.sm,
    },
    dateSelectors: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    wheelCard: {
      flex: 1,
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surfaceSoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
    },
    dateSelectorLabel: {
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    wheelViewport: {
      height: WHEEL_HEIGHT,
      width: "100%",
      position: "relative",
      overflow: "hidden",
    },
    wheelSelectionFrame: {
      position: "absolute",
      top: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2,
      left: 0,
      right: 0,
      height: WHEEL_ITEM_HEIGHT,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    wheelContent: {
      paddingVertical: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2,
    },
    wheelRow: {
      height: WHEEL_ITEM_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xs,
    },
    wheelRowText: {
      textAlign: "center",
      textTransform: "capitalize",
    },
    wheelRowTextActive: {
      color: colors.textPrimary,
    },
    wheelRowTextInactive: {
      color: colors.textMuted,
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
