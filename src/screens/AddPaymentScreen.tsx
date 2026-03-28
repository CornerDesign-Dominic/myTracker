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
import { createSubscriptionService } from "@/application/subscriptions/service";
import { EditablePaymentEventType } from "@/domain/subscriptionHistory/paymentEvents";
import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { RootStackParamList } from "@/navigation/types";
import { subscriptionRepository } from "@/services/subscriptionRepository";
import {
  createButtonStyles,
  createInputStyles,
  createScreenLayout,
  createSurfaceStyles,
  radius,
  spacing,
} from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { formatDate, formatLocalDateInput, isDateInputValid, parseLocalDateInput } from "@/utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "AddPayment">;
type EditableField = "status" | "amount" | "date" | "notes" | null;
type WheelOption<T extends string | number> = { label: string; value: T };

const subscriptionService = createSubscriptionService(subscriptionRepository);
const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS;
const YEAR_RANGE_START = 2000;
const YEAR_RANGE_END = 2045;

const daysInMonth = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate();
const clampDay = (year: number, monthIndex: number, day: number) =>
  Math.min(day, daysInMonth(year, monthIndex));

const DateWheel = <T extends string | number>({
  label,
  options,
  selectedValue,
  onChange,
  colors,
}: {
  label: string;
  options: WheelOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) => {
  const { typography } = useAppTheme();
  const styles = getStyles(colors);
  const listRef = useRef<FlatList<WheelOption<T>>>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === selectedValue));

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

export const AddPaymentScreen = ({ navigation, route }: Props) => {
  const { colors, typography } = useAppTheme();
  const { currency, language } = useAppSettings();
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const buttons = createButtonStyles(colors);
  const inputs = createInputStyles(colors);
  const styles = getStyles(colors);
  const { subscriptions } = useSubscriptions();
  const { history } = useSubscriptionHistory(route.params.subscriptionId);
  const subscription = subscriptions.find((item) => item.id === route.params.subscriptionId);
  const existingPayment = history.find((event) => event.id === route.params.eventId);
  const isEditing = Boolean(route.params.eventId);

  const [activeField, setActiveField] = useState<EditableField>(null);
  const [paymentType, setPaymentType] = useState<EditablePaymentEventType>("payment_booked");
  const [amountInput, setAmountInput] = useState(subscription ? String(subscription.amount.toFixed(2)) : "");
  const [notesInput, setNotesInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!subscription) {
      return;
    }

    setAmountInput(String(subscription.amount.toFixed(2)));
  }, [subscription]);

  useEffect(() => {
    if (
      !existingPayment ||
      (existingPayment.type !== "payment_booked" &&
        existingPayment.type !== "payment_skipped_inactive")
    ) {
      return;
    }

    setPaymentType(existingPayment.type);

    if (typeof existingPayment.amount === "number") {
      setAmountInput(String(existingPayment.amount.toFixed(2)));
    }

    if (existingPayment.dueDate) {
      setSelectedDate(parseLocalDateInput(existingPayment.dueDate) ?? new Date());
    }

    setNotesInput(existingPayment.notes ?? "");
  }, [existingPayment]);

  const dayOptions = useMemo(
    () =>
      Array.from({ length: daysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, (_, index) => ({
        label: String(index + 1).padStart(2, "0"),
        value: index + 1,
      })),
    [selectedDate],
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

  const selectedDateValue = formatLocalDateInput(selectedDate);
  const paymentTypeLabel =
    paymentType === "payment_skipped_inactive"
      ? language === "de"
        ? "Während inaktiv"
        : "While inactive"
      : language === "de"
        ? "Gebucht"
        : "Booked";

  const updateDraftDay = (day: number) => {
    setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), day));
  };
  const updateDraftMonth = (month: number) => {
    setSelectedDate((current) => {
      const year = current.getFullYear();
      const day = clampDay(year, month, current.getDate());
      return new Date(year, month, day);
    });
  };
  const updateDraftYear = (year: number) => {
    setSelectedDate((current) => {
      const month = current.getMonth();
      const day = clampDay(year, month, current.getDate());
      return new Date(year, month, day);
    });
  };

  if (!subscription) {
    return (
      <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
        <View style={styles.emptyState}>
          <Text style={[typography.secondary, styles.helperText]}>{t("subscription.detailsNotFound")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const amount = Number(amountInput.replace(",", "."));

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert(
        language === "de" ? "Zahlung prüfen" : "Check payment",
        language === "de" ? "Bitte einen gültigen Betrag angeben." : "Please enter a valid amount.",
      );
      return;
    }

    if (!isDateInputValid(selectedDateValue)) {
      Alert.alert(
        language === "de" ? "Zahlung prüfen" : "Check payment",
        language === "de" ? "Bitte ein gültiges Datum wählen." : "Please select a valid date.",
      );
      return;
    }

    if (!currentUser?.uid) {
      Alert.alert(
        language === "de" ? "Nicht verfügbar" : "Unavailable",
        language === "de" ? "Es ist kein Nutzer angemeldet." : "No user is signed in.",
      );
      return;
    }

    try {
      if (isEditing && route.params.eventId) {
        await subscriptionService.updateHistoryEventForUser(
          currentUser.uid,
          subscription.id,
          route.params.eventId,
          {
            type: paymentType,
            amount,
            dueDate: selectedDateValue,
            notes: notesInput.trim() || undefined,
          },
        );
      } else {
        await subscriptionService.createManualPaymentForUser(currentUser.uid, subscription.id, {
          type: paymentType,
          amount,
          dueDate: selectedDateValue,
          notes: notesInput.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : language === "de"
            ? "Die Zahlung konnte nicht gespeichert werden."
            : "The payment could not be saved.";

      Alert.alert(language === "de" ? "Zahlung prüfen" : "Check payment", message);
    }
  };

  const handleDelete = () => {
    if (!isEditing || !route.params.eventId || !currentUser?.uid) {
      return;
    }

    Alert.alert(
      language === "de" ? "Zahlung löschen?" : "Delete payment?",
      language === "de"
        ? "Zahlung wirklich löschen?"
        : "Do you really want to delete this payment?",
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: language === "de" ? "Löschen" : "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await subscriptionService.deleteHistoryEventForUser(
                currentUser.uid,
                subscription.id,
                route.params.eventId!,
              );
              navigation.goBack();
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : language === "de"
                    ? "Die Zahlung konnte nicht gelöscht werden."
                    : "The payment could not be deleted.";

              Alert.alert(
                language === "de" ? "Zahlung löschen" : "Delete payment",
                message,
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={layout.screen} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.content]}>
        <View style={[surfaces.panel, styles.infoCard]}>
          <Text style={[typography.cardTitle, styles.cardTitle]}>{subscription.name}</Text>
          <Text style={[typography.secondary, styles.helperText]}>
            {isEditing
              ? language === "de"
                ? "Bestehende Zahlung korrigieren."
                : "Adjust an existing payment."
              : language === "de"
                ? "Zahlung schnell manuell erfassen."
                : "Add a payment quickly and manually."}
          </Text>
        </View>

        <View style={[surfaces.panel, styles.cardGroup]}>
          <FormRow
            label={language === "de" ? "Status" : "Status"}
            value={paymentTypeLabel}
            onPress={() => setActiveField("status")}
            isFirst
          />
          <FormRow
            label={t("subscription.amount")}
            value={amountInput ? formatCurrency(Number(amountInput.replace(",", ".")) || 0, currency) : ""}
            onPress={() => setActiveField("amount")}
          />
          <FormRow
            label={language === "de" ? "Zahlungsdatum" : "Payment date"}
            value={formatDate(selectedDateValue)}
            onPress={() => setActiveField("date")}
          />
          <FormRow
            label={t("subscription.notes")}
            value={notesInput}
            onPress={() => setActiveField("notes")}
            isLast
            multilineValue
          />
        </View>

        <Pressable
          style={[buttons.buttonBase, buttons.primaryButton, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={[typography.button, styles.saveButtonText]}>
            {language === "de" ? "Zahlung speichern" : "Save payment"}
          </Text>
        </Pressable>

        {isEditing ? (
          <Pressable
            style={[buttons.buttonBase, buttons.secondaryButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={[typography.button, styles.deleteButtonText]}>
              {language === "de" ? "Zahlung löschen" : "Delete payment"}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <EditorSheet
        visible={activeField === "status"}
        title={language === "de" ? "Status" : "Status"}
        onClose={() => setActiveField(null)}
        confirmLabel={t("common.save")}
      >
        <View style={styles.statusOptions}>
          <Pressable
            style={[
              surfaces.subtlePanel,
              styles.statusOption,
              paymentType === "payment_booked" ? styles.statusOptionActive : null,
            ]}
            onPress={() => {
              setPaymentType("payment_booked");
              setActiveField(null);
            }}
          >
            <Text
              style={[
                typography.body,
                styles.statusOptionLabel,
                paymentType === "payment_booked" ? styles.statusOptionLabelActive : null,
              ]}
            >
              {language === "de" ? "Gebucht" : "Booked"}
            </Text>
          </Pressable>
          <Pressable
            style={[
              surfaces.subtlePanel,
              styles.statusOption,
              paymentType === "payment_skipped_inactive" ? styles.statusOptionActive : null,
            ]}
            onPress={() => {
              setPaymentType("payment_skipped_inactive");
              setActiveField(null);
            }}
          >
            <Text
              style={[
                typography.body,
                styles.statusOptionLabel,
                paymentType === "payment_skipped_inactive"
                  ? styles.statusOptionLabelActive
                  : null,
              ]}
            >
              {language === "de" ? "Während inaktiv" : "While inactive"}
            </Text>
          </Pressable>
        </View>
      </EditorSheet>

      <EditorSheet
        visible={activeField === "amount"}
        title={t("subscription.amount")}
        onClose={() => setActiveField(null)}
        onConfirm={() => setActiveField(null)}
        confirmLabel={t("common.save")}
      >
        <TextInput
          value={amountInput}
          onChangeText={setAmountInput}
          keyboardType="numeric"
          autoFocus
          style={[inputs.input, styles.sheetInput]}
        />
      </EditorSheet>

      <EditorSheet
        visible={activeField === "notes"}
        title={t("subscription.notes")}
        onClose={() => setActiveField(null)}
        onConfirm={() => setActiveField(null)}
        confirmLabel={t("common.save")}
      >
        <TextInput
          value={notesInput}
          onChangeText={setNotesInput}
          multiline
          autoFocus
          textAlignVertical="top"
          style={[inputs.input, styles.notesInput]}
        />
      </EditorSheet>

      <EditorSheet
        visible={activeField === "date"}
        title={language === "de" ? "Zahlungsdatum" : "Payment date"}
        onClose={() => setActiveField(null)}
        onConfirm={() => setActiveField(null)}
        confirmLabel={t("common.save")}
        contentStyle={styles.dateSheetContent}
      >
        <View style={styles.datePickerWrap}>
          <View style={styles.dateSelectors}>
            <DateWheel
              label={language === "de" ? "Tag" : "Day"}
              options={dayOptions}
              selectedValue={selectedDate.getDate()}
              onChange={updateDraftDay}
              colors={colors}
            />
            <DateWheel
              label={language === "de" ? "Monat" : "Month"}
              options={monthOptions}
              selectedValue={selectedDate.getMonth()}
              onChange={updateDraftMonth}
              colors={colors}
            />
            <DateWheel
              label={language === "de" ? "Jahr" : "Year"}
              options={yearOptions}
              selectedValue={selectedDate.getFullYear()}
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
    content: {
      gap: spacing.lg,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
    },
    infoCard: {
      gap: spacing.xs,
    },
    cardTitle: {
      color: colors.textPrimary,
    },
    helperText: {
      color: colors.textSecondary,
    },
    cardGroup: {
      paddingVertical: spacing.xs,
      paddingHorizontal: 0,
      overflow: "hidden",
    },
    statusOptions: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    statusOption: {
      minHeight: 52,
      justifyContent: "center",
      borderRadius: radius.md,
    },
    statusOptionActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    statusOptionLabel: {
      color: colors.textPrimary,
    },
    statusOptionLabelActive: {
      color: colors.accent,
    },
    saveButton: {
      width: "100%",
    },
    saveButtonText: {
      color: colors.accent,
    },
    deleteButton: {
      width: "100%",
      borderColor: colors.danger,
      backgroundColor: colors.surface,
    },
    deleteButtonText: {
      color: colors.danger,
    },
    sheetInput: {
      color: colors.textPrimary,
      borderRadius: radius.md,
    },
    notesInput: {
      minHeight: 140,
      color: colors.textPrimary,
      borderRadius: radius.md,
    },
    dateSheetContent: {
      gap: 0,
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
    },
    wheelRowTextActive: {
      color: colors.textPrimary,
    },
    wheelRowTextInactive: {
      color: colors.textMuted,
    },
  });
