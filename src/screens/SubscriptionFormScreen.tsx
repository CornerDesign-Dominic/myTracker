import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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
import { Ionicons } from "@expo/vector-icons";

import { EditorSheet } from "@/components/forms/EditorSheet";
import { FormRow } from "@/components/forms/FormRow";
import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { NOTES_MAX_LENGTH, clampNotesLength } from "@/constants/formLimits";
import { billingCycleOptions, statusOptions } from "@/constants/options";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useStoredCategories } from "@/hooks/useStoredCategories";
import { useStoredSubscriptionTemplates } from "@/hooks/useStoredSubscriptionTemplates";
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
import { shouldRequireNextPaymentConfirmation } from "@/domain/subscriptions/formValidation";
import { SubscriptionError } from "@/application/subscriptions/errors";
import { BillingCycle, SubscriptionInput, SubscriptionStatus } from "@/types/subscription";
import { localizeCategory } from "@/utils/categories";
import { formatAmountInputValue, formatCurrency, parseAmountInput, sanitizeAmountInput } from "@/utils/currency";
import { formatDate, formatLocalDateInput, isDateInputValid, parseLocalDateInput } from "@/utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "SubscriptionForm">;

type EditableField =
  | "name"
  | "category"
  | "amount"
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
type ValidationField = "name" | "category" | "amount" | null;

const buildInitialState = (): SubscriptionInput => ({
  name: "",
  category: "",
  amount: 0,
  billingCycle: "monthly",
  nextPaymentDate: formatLocalDateInput(new Date()),
  status: "active",
  endDate: "",
  notes: "",
});

const toDateValue = (value: string) => {
  return parseLocalDateInput(value) ?? new Date();
};

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
    "Shopping",
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
    "Shopping",
  ],
} as const;

const DEFAULT_SUBSCRIPTION_TEMPLATES = {
  de: [
    { name: "Netflix", category: "Unterhaltung" },
    { name: "Disney+", category: "Unterhaltung" },
    { name: "Amazon Prime Video", category: "Unterhaltung" },
    { name: "Apple TV+", category: "Unterhaltung" },
    { name: "WOW (Sky)", category: "Unterhaltung" },
    { name: "Paramount+", category: "Unterhaltung" },
    { name: "YouTube Premium", category: "Unterhaltung" },
    { name: "DAZN", category: "Fitness" },
    { name: "Sky", category: "Unterhaltung" },
    { name: "Spotify", category: "Musik" },
    { name: "Apple Music", category: "Musik" },
    { name: "YouTube Music", category: "Musik" },
    { name: "Deezer", category: "Musik" },
    { name: "SoundCloud Go", category: "Musik" },
    { name: "Microsoft 365", category: "Produktivität" },
    { name: "Google One", category: "Cloud" },
    { name: "iCloud", category: "Cloud" },
    { name: "Google Drive", category: "Cloud" },
    { name: "OneDrive", category: "Cloud" },
    { name: "Amazon Prime", category: "Shopping" },
    { name: "Adobe Creative Cloud", category: "Software" },
    { name: "Dropbox", category: "Cloud" },
    { name: "Notion", category: "Produktivität" },
    { name: "Evernote", category: "Produktivität" },
    { name: "Slack", category: "Produktivität" },
    { name: "Zoom", category: "Produktivität" },
    { name: "Canva", category: "Produktivität" },
    { name: "Figma", category: "Produktivität" },
    { name: "ChatGPT", category: "Produktivität" },
    { name: "Xbox Game Pass", category: "Gaming" },
    { name: "PlayStation Plus", category: "Gaming" },
    { name: "Nintendo Switch Online", category: "Gaming" },
    { name: "Urban Sports Club", category: "Fitness" },
    { name: "Gym Membership", category: "Fitness" },
    { name: "Freeletics", category: "Fitness" },
    { name: "Apple Fitness+", category: "Fitness" },
    { name: "Revolut", category: "Software" },
    { name: "PayPal", category: "Software" },
    { name: "N26", category: "Software" },
    { name: "eBay Plus", category: "Shopping" },
    { name: "Otto Up", category: "Shopping" },
    { name: "Zalando Plus", category: "Shopping" },
    { name: "Udemy", category: "Software" },
    { name: "MasterClass", category: "Software" },
    { name: "Skillshare", category: "Software" },
    { name: "Blinkist", category: "Software" },
    { name: "Midjourney", category: "Produktivität" },
    { name: "Claude", category: "Produktivität" },
    { name: "Perplexity", category: "Produktivität" },
    { name: "Domain Hosting", category: "Software" },
    { name: "Web Hosting", category: "Software" },
    { name: "VPN Service", category: "Software" },
  ],
  en: [
    { name: "Netflix", category: "Entertainment" },
    { name: "Disney+", category: "Entertainment" },
    { name: "Amazon Prime Video", category: "Entertainment" },
    { name: "Apple TV+", category: "Entertainment" },
    { name: "WOW (Sky)", category: "Entertainment" },
    { name: "Paramount+", category: "Entertainment" },
    { name: "YouTube Premium", category: "Entertainment" },
    { name: "DAZN", category: "Fitness" },
    { name: "Sky", category: "Entertainment" },
    { name: "Spotify", category: "Music" },
    { name: "Apple Music", category: "Music" },
    { name: "YouTube Music", category: "Music" },
    { name: "Deezer", category: "Music" },
    { name: "SoundCloud Go", category: "Music" },
    { name: "Microsoft 365", category: "Productivity" },
    { name: "Google One", category: "Cloud" },
    { name: "iCloud", category: "Cloud" },
    { name: "Google Drive", category: "Cloud" },
    { name: "OneDrive", category: "Cloud" },
    { name: "Amazon Prime", category: "Shopping" },
    { name: "Adobe Creative Cloud", category: "Software" },
    { name: "Dropbox", category: "Cloud" },
    { name: "Notion", category: "Productivity" },
    { name: "Evernote", category: "Productivity" },
    { name: "Slack", category: "Productivity" },
    { name: "Zoom", category: "Productivity" },
    { name: "Canva", category: "Productivity" },
    { name: "Figma", category: "Productivity" },
    { name: "ChatGPT", category: "Productivity" },
    { name: "Xbox Game Pass", category: "Gaming" },
    { name: "PlayStation Plus", category: "Gaming" },
    { name: "Nintendo Switch Online", category: "Gaming" },
    { name: "Urban Sports Club", category: "Fitness" },
    { name: "Gym Membership", category: "Fitness" },
    { name: "Freeletics", category: "Fitness" },
    { name: "Apple Fitness+", category: "Fitness" },
    { name: "Revolut", category: "Software" },
    { name: "PayPal", category: "Software" },
    { name: "N26", category: "Software" },
    { name: "eBay Plus", category: "Shopping" },
    { name: "Otto Up", category: "Shopping" },
    { name: "Zalando Plus", category: "Shopping" },
    { name: "Udemy", category: "Software" },
    { name: "MasterClass", category: "Software" },
    { name: "Skillshare", category: "Software" },
    { name: "Blinkist", category: "Software" },
    { name: "Midjourney", category: "Productivity" },
    { name: "Claude", category: "Productivity" },
    { name: "Perplexity", category: "Productivity" },
    { name: "Domain Hosting", category: "Software" },
    { name: "Web Hosting", category: "Software" },
    { name: "VPN Service", category: "Software" },
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
  const defaultSubscriptionTemplates = useMemo(
    () => DEFAULT_SUBSCRIPTION_TEMPLATES[language],
    [language],
  );
  const { subscriptions, createSubscription, updateSubscription } = useSubscriptions();
  const { addCategory, getSuggestions } = useStoredCategories(defaultCategories, language);
  const { addTemplate, getSuggestions: getSubscriptionSuggestions } =
    useStoredSubscriptionTemplates(defaultSubscriptionTemplates);
  const isEditing = Boolean(route.params?.subscriptionId);
  const existingSubscription = useMemo(
    () => subscriptions.find((subscription) => subscription.id === route.params?.subscriptionId),
    [route.params?.subscriptionId, subscriptions],
  );

  const [formState, setFormState] = useState<SubscriptionInput>(buildInitialState());
  const [activeField, setActiveField] = useState<EditableField>(null);
  const [draftText, setDraftText] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [draftDate, setDraftDate] = useState(new Date());
  const [requiresNextPaymentConfirmation, setRequiresNextPaymentConfirmation] = useState(false);
  const [confirmedBillingCycle, setConfirmedBillingCycle] = useState<BillingCycle>("monthly");
  const [validationNotice, setValidationNotice] = useState<string | null>(null);
  const [highlightedField, setHighlightedField] = useState<ValidationField>(null);
  const [isLimitModalVisible, setIsLimitModalVisible] = useState(false);

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

  const subscriptionSuggestion = useMemo(() => {
    if (activeField !== "name") {
      return null;
    }

    const query = draftText.trim();
    if (!query) {
      return null;
    }

    const match = getSubscriptionSuggestions(query).find(
      (template) => template.name.trim().toLocaleLowerCase() !== query.toLocaleLowerCase(),
    );

    return match ?? null;
  }, [activeField, draftText, getSubscriptionSuggestions]);

  useEffect(() => {
    if (!existingSubscription) {
      return;
    }

    setFormState({
      name: existingSubscription.name,
      category: localizeCategory(existingSubscription.category, language),
      amount: existingSubscription.amount,
      billingCycle: existingSubscription.billingCycle,
      nextPaymentDate: existingSubscription.nextPaymentDate,
      status: existingSubscription.status,
      endDate: existingSubscription.endDate ?? "",
      notes: clampNotesLength(existingSubscription.notes ?? ""),
    });
    setConfirmedBillingCycle(existingSubscription.billingCycle);
    setRequiresNextPaymentConfirmation(false);
  }, [existingSubscription, language]);

  useEffect(() => {
    if (highlightedField === "name" && validationNotice && formState.name.trim()) {
      setValidationNotice(null);
      setHighlightedField(null);
    }
  }, [formState.name, highlightedField, validationNotice]);

  useEffect(() => {
    if (highlightedField === "category" && validationNotice && formState.category.trim()) {
      setValidationNotice(null);
      setHighlightedField(null);
    }
  }, [formState.category, highlightedField, validationNotice]);

  useEffect(() => {
    if (
      highlightedField === "amount" &&
      validationNotice &&
      Number.isFinite(formState.amount) &&
      formState.amount > 0
    ) {
      setValidationNotice(null);
      setHighlightedField(null);
    }
  }, [formState.amount, highlightedField, validationNotice]);

  const updateField = <K extends keyof SubscriptionInput>(key: K, value: SubscriptionInput[K]) =>
    setFormState((current) => ({ ...current, [key]: value }));

  const validateForm = () => {
    if (!formState.name.trim() || !formState.category.trim()) {
      return t("subscription.validationRequired");
    }

    if (!Number.isFinite(formState.amount) || formState.amount <= 0) {
      return t("subscription.validationAmount");
    }

    if (!isDateInputValid(formState.nextPaymentDate)) {
      return t("subscription.validationNextPayment");
    }

    if (requiresNextPaymentConfirmation) {
      return t("subscription.confirmBillingCycleChange");
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
    const value = String(formState[field] ?? "");
    setDraftText(field === "notes" ? clampNotesLength(value) : value);
    setActiveField(field);
  };

  const openAmountSheet = () => {
    setDraftAmount(formState.amount ? formatAmountInputValue(formState.amount, currency) : "");
    setActiveField("amount");
  };

  const openDateSheet = () => {
    setDraftDate(toDateValue(formState.nextPaymentDate));
    setActiveField("nextPaymentDate");
  };

  const closeSheet = () => {
    setActiveField(null);
    setDraftText("");
    setDraftAmount("");
  };

  const saveActiveField = () => {
    if (activeField === "name" || activeField === "category" || activeField === "notes") {
      if (activeField === "name" && subscriptionSuggestion) {
        // keep explicit user text; template application only happens on tap
      }
      updateField(activeField, draftText);
      closeSheet();
      return;
    }

    if (activeField === "amount") {
      const nextAmount = parseAmountInput(draftAmount, currency);
      updateField("amount", Number.isFinite(nextAmount) ? nextAmount : 0);
      closeSheet();
      return;
    }

    if (activeField === "nextPaymentDate") {
      updateField("nextPaymentDate", formatLocalDateInput(draftDate));
      setConfirmedBillingCycle(formState.billingCycle);
      setRequiresNextPaymentConfirmation(false);
      closeSheet();
    }
  };

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      setHighlightedField("name");
      setValidationNotice(t("subscription.validationFieldInline", {
        field: t("subscription.name"),
      }));
      return;
    }

    if (!formState.category.trim()) {
      setHighlightedField("category");
      setValidationNotice(t("subscription.validationFieldInline", {
        field: t("subscription.category"),
      }));
      return;
    }

    if (!Number.isFinite(formState.amount) || formState.amount <= 0) {
      setHighlightedField("amount");
      setValidationNotice(t("subscription.validationAmountInline", {
        field: t("subscription.amount"),
      }));
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      Alert.alert(t("subscription.formAlertTitle"), validationError);
      return;
    }

    const payload: SubscriptionInput = {
      ...formState,
      name: formState.name.trim(),
      category: formState.category.trim(),
      endDate: formState.status === "cancelled" ? formState.endDate || undefined : undefined,
      notes: formState.notes?.trim() || undefined,
    };

    try {
      if (isEditing && route.params?.subscriptionId) {
        await updateSubscription(route.params.subscriptionId, payload);
      } else {
        await createSubscription(payload);
      }

      await addCategory(payload.category);
      await addTemplate({
        name: payload.name,
        category: payload.category,
      });

      navigation.goBack();
    } catch (error) {
      if (error instanceof SubscriptionError && error.code === "subscription_limit_reached") {
        setIsLimitModalVisible(true);
        return;
      }

      Alert.alert(t("common.actionFailed"), t("common.actionFailed"));
    }
  };

  const formatAmountLabel = () =>
    formState.amount
      ? formatCurrency(formState.amount, currency)
      : "";

  const openBillingCycleSheet = () => setActiveField("billingCycle");
  const openStatusSheet = () => setActiveField("status");

  const selectBillingCycle = (value: BillingCycle) => {
    const requiresConfirmation = shouldRequireNextPaymentConfirmation(
      value,
      confirmedBillingCycle,
    );

    setRequiresNextPaymentConfirmation(requiresConfirmation);
    updateField("billingCycle", value);

    if (requiresConfirmation) {
      setDraftDate(toDateValue(formState.nextPaymentDate));
      setActiveField("nextPaymentDate");
      return;
    }

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
        onChangeText={multiline ? (value) => setDraftText(clampNotesLength(value)) : setDraftText}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        maxLength={multiline ? NOTES_MAX_LENGTH : undefined}
        autoFocus
        style={[inputs.input, multiline ? styles.notesInput : styles.sheetInput]}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {multiline ? (
        <Text style={[typography.meta, styles.characterCount]}>
          {draftText.length}/{NOTES_MAX_LENGTH}
        </Text>
      ) : null}
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

  const renderNameSheet = () => (
    <EditorSheet
      visible={activeField === "name"}
      title={t("subscription.name")}
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
      {subscriptionSuggestion ? (
        <Pressable
          style={[surfaces.subtlePanel, styles.singleSuggestionRow]}
          onPress={() => {
            setDraftText(subscriptionSuggestion.name);
            if (!formState.category.trim()) {
              updateField("category", localizeCategory(subscriptionSuggestion.category, language));
            }
          }}
        >
          <View style={styles.templateSuggestionMain}>
            <SubscriptionAvatar
              name={subscriptionSuggestion.name}
              category={subscriptionSuggestion.category}
              size={38}
            />
            <View style={styles.templateSuggestionCopy}>
              <Text style={[typography.secondary, styles.singleSuggestionLabel]}>
                {t("subscription.template")}
              </Text>
              <Text style={[typography.body, styles.singleSuggestionValue]}>
                {subscriptionSuggestion.name}
              </Text>
              <Text style={[typography.meta, styles.templateSuggestionMeta]}>
                {localizeCategory(subscriptionSuggestion.category, language)}
              </Text>
            </View>
          </View>
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

        {validationNotice ? (
          <View style={[surfaces.subtlePanel, styles.validationNotice]}>
            <Text style={[typography.secondary, styles.validationNoticeText]}>
              {validationNotice}
            </Text>
          </View>
        ) : null}

        <View style={[surfaces.panel, styles.cardGroup]}>
          <FormRow
            label={t("subscription.name")}
            value={formState.name}
            onPress={() => openTextSheet("name")}
            isFirst
            highlighted={highlightedField === "name"}
          />
          <FormRow
            label={t("subscription.category")}
            value={formState.category}
            onPress={() => openTextSheet("category")}
            highlighted={highlightedField === "category"}
          />
          <FormRow
            label={t("subscription.amount")}
            value={formatAmountLabel()}
            onPress={openAmountSheet}
            highlighted={highlightedField === "amount"}
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

      {activeField === "name" ? renderNameSheet() : null}
      {activeField === "category" ? renderCategorySheet() : null}
      {activeField === "notes" ? renderTextSheet(t("subscription.notes"), true) : null}

      <EditorSheet
        visible={activeField === "amount"}
        title={t("subscription.amount")}
        onClose={closeSheet}
        onConfirm={saveActiveField}
        confirmLabel={t("common.save")}
      >
        <TextInput
          value={draftAmount}
          onChangeText={(value) => setDraftAmount(sanitizeAmountInput(value, currency))}
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
        scrollContent={false}
        contentStyle={styles.dateSheetContent}
      >
        <View style={styles.datePickerWrap}>
          <View style={styles.dateSelectors}>
            <DateWheel
              label={t("common.day")}
              options={dayOptions}
              selectedValue={draftDate.getDate()}
              onChange={updateDraftDay}
              colors={colors}
            />
            <DateWheel
              label={t("common.month")}
              options={monthOptions}
              selectedValue={draftDate.getMonth()}
              onChange={updateDraftMonth}
              colors={colors}
            />
            <DateWheel
              label={t("common.year")}
              options={yearOptions}
              selectedValue={draftDate.getFullYear()}
              onChange={updateDraftYear}
              colors={colors}
            />
          </View>
        </View>

        {requiresNextPaymentConfirmation ? (
          <Text style={[typography.secondary, styles.inlineHint]}>
            {t("subscription.confirmNextDueDate")}
          </Text>
        ) : null}
      </EditorSheet>

      <Modal
        animationType="fade"
        transparent
        visible={isLimitModalVisible}
        onRequestClose={() => setIsLimitModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsLimitModalVisible(false)}
          />
          <View style={[surfaces.panel, styles.limitModal]}>
            <View style={styles.limitModalHeader}>
              <Text style={[typography.cardTitle, styles.limitModalTitle]}>
                {t("subscription.limitReachedTitle")}
              </Text>
              <Pressable onPress={() => setIsLimitModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[typography.secondary, styles.limitModalDescription]}>
              {t("subscription.limitReachedMessage")}
            </Text>
            <Pressable
              style={[buttons.buttonBase, buttons.primaryButton, styles.limitModalSingleAction]}
              onPress={() => {
                setIsLimitModalVisible(false);
                navigation.navigate("Settings");
              }}
            >
              <Text style={[typography.button, styles.primaryButtonText]}>
                {t("subscription.limitReachedUpgrade")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    title: {
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    validationNotice: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    validationNoticeText: {
      color: colors.textPrimary,
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
    inlineHint: {
      color: colors.textSecondary,
      marginTop: spacing.sm,
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
    characterCount: {
      color: colors.textSecondary,
      textAlign: "right",
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
    templateSuggestionMain: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    templateSuggestionCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    singleSuggestionLabel: {
      color: colors.textMuted,
    },
    singleSuggestionValue: {
      color: colors.textPrimary,
    },
    templateSuggestionMeta: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.overlay,
      padding: spacing.lg,
    },
    limitModal: {
      gap: spacing.md,
      paddingBottom: spacing.lg,
    },
    limitModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    limitModalTitle: {
      color: colors.textPrimary,
    },
    limitModalDescription: {
      color: colors.textSecondary,
      lineHeight: 22,
    },
    limitModalActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    limitModalButton: {
      flex: 1,
    },
    limitModalSingleAction: {
      width: "100%",
    },
  });
