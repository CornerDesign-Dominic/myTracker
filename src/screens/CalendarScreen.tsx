import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { SubscriptionAvatar } from "@/components/SubscriptionAvatar";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { createScreenLayout, createSurfaceStyles, radius, spacing } from "@/theme";
import { CalendarTabScreenProps } from "@/navigation/types";
import { localizeCategory } from "@/utils/categories";
import { formatCurrency } from "@/utils/currency";
import { formatLocalDateInput } from "@/utils/date";
import { getRecurringDueDateInputForMonth } from "@/utils/recurringDates";

const DAY_DOT_SIZE = 6;
const DAY_DOT_CONTAINER_SIZE = 10;

type CalendarDay = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
};

const getMonthLabel = (date: Date, language: "de" | "en") =>
  new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(date);

const getCalendarDays = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const previousMonthLastDay = new Date(year, month, 0);
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const trailingDays = (7 - ((leadingEmptyDays + daysInMonth) % 7)) % 7;

  const days: CalendarDay[] = Array.from({ length: leadingEmptyDays }, (_, index) => {
    const day = previousMonthLastDay.getDate() - leadingEmptyDays + index + 1;
    const previousMonthDate = new Date(year, month - 1, day);
    return {
      date: previousMonthDate,
      day,
      isCurrentMonth: false,
    };
  });

  days.push(
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const currentDate = new Date(year, month, index + 1);
      return {
        date: currentDate,
        day: index + 1,
        isCurrentMonth: true,
      };
    }),
  );

  days.push(
    ...Array.from({ length: trailingDays }, (_, index) => {
      const nextMonthDate = new Date(year, month + 1, index + 1);
      return {
        date: nextMonthDate,
        day: index + 1,
        isCurrentMonth: false,
      };
    }),
  );

  return days;
};

const getDisplayDate = (date: Date, language: "de" | "en") =>
  new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
    day: "numeric",
    month: "long",
  }).format(date);

const getShortDisplayDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.`;

const getTodayFabLabel = (date: Date) => `${date.getDate()}.${date.getMonth() + 1}.`;

const getWeekdayLabels = (language: "de" | "en") => {
  const formatter = new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-US", {
    weekday: "short",
  });
  const monday = new Date(Date.UTC(2024, 0, 1));

  return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(monday.getTime() + index * 86400000)));
};

export const CalendarScreen = ({ navigation }: CalendarTabScreenProps) => {
  const { colors, typography, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { language, t } = useI18n();
  const { currency } = useAppSettings();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const { subscriptions } = useSubscriptions();
  const [today, setToday] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));

  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      setToday(now);
      setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
      setSelectedDate(now);
    }, []),
  );

  const monthLabel = useMemo(() => getMonthLabel(visibleMonth, language), [language, visibleMonth]);
  const weekdayLabels = useMemo(() => getWeekdayLabels(language), [language]);
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const visibleCalendarMonths = useMemo(() => {
    const months = new Map<string, Date>();

    calendarDays.forEach((calendarDay) => {
      const monthKey = `${calendarDay.date.getFullYear()}-${calendarDay.date.getMonth()}`;
      if (!months.has(monthKey)) {
        months.set(monthKey, new Date(calendarDay.date.getFullYear(), calendarDay.date.getMonth(), 1));
      }
    });

    return [...months.values()];
  }, [calendarDays]);
  const isCurrentMonth =
    today.getFullYear() === visibleMonth.getFullYear() &&
    today.getMonth() === visibleMonth.getMonth();
  const selectedDateKey = formatLocalDateInput(selectedDate);
  const selectedDayLabel = getDisplayDate(selectedDate, language);
  const selectedShortDayLabel = getShortDisplayDate(selectedDate);
  const todayFabLabel = getTodayFabLabel(today);
  const dueSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (subscription) => {
          if (subscription.status !== "active") {
            return false;
          }

          return (
            getRecurringDueDateInputForMonth({
              anchorDate: subscription.nextPaymentDate,
              billingCycle: subscription.billingCycle,
              targetMonth: selectedDate,
              startsOn: subscription.createdAt,
              endsOn: subscription.endDate,
            }) === selectedDateKey
          );
        },
      ),
    [selectedDate, selectedDateKey, subscriptions],
  );
  const dueDateKeys = useMemo(
    () => {
      const dueDates = new Set<string>();

      subscriptions
        .filter((subscription) => subscription.status !== "cancelled")
        .forEach((subscription) => {
          visibleCalendarMonths.forEach((monthDate) => {
            const dueDate = getRecurringDueDateInputForMonth({
              anchorDate: subscription.nextPaymentDate,
              billingCycle: subscription.billingCycle,
              targetMonth: monthDate,
              startsOn: subscription.createdAt,
              endsOn: subscription.endDate,
            });

            if (dueDate) {
              dueDates.add(dueDate);
            }
          });
        });

      return dueDates;
    },
    [subscriptions, visibleCalendarMonths],
  );

  const changeMonth = (direction: -1 | 1) => {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + direction, 1);
    setVisibleMonth(nextMonth);
  };

  const selectCalendarDate = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          layout.content,
          styles.contentWithTabBar,
          { paddingBottom: insets.bottom + spacing.xxl + 76 },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={[typography.pageTitle, styles.pageTitle]}>{t("calendar.title")}</Text>
        </View>

        <View style={[surfaces.mainPanel, styles.calendarCard]}>
          <View style={styles.headerRow}>
            <Pressable
              style={[surfaces.mainSubtlePanel, styles.monthAction, !isDark ? styles.monthActionLight : null]}
              onPress={() => changeMonth(-1)}
            >
              <Ionicons
                name="chevron-back-outline"
                size={18}
                color={!isDark ? colors.textSecondary : colors.textPrimary}
              />
            </Pressable>

            <Text style={[typography.cardTitle, styles.monthLabel]}>{monthLabel}</Text>

            <Pressable
              style={[surfaces.mainSubtlePanel, styles.monthAction, !isDark ? styles.monthActionLight : null]}
              onPress={() => changeMonth(1)}
            >
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={!isDark ? colors.textSecondary : colors.textPrimary}
              />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayLabels.map((label) => (
              <View key={label} style={styles.weekdayCell}>
                <Text style={[typography.meta, styles.weekdayText]}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((calendarDay, index) => {
              const dayDate = calendarDay.date;
              const dayKey = formatLocalDateInput(dayDate);
              const isToday = formatLocalDateInput(dayDate) === formatLocalDateInput(today);
              const isSelected = dayKey === selectedDateKey;
              const hasDuePayment = dueDateKeys.has(dayKey);

              return (
                <View key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${index}`} style={styles.dayCell}>
                  <Pressable
                    style={styles.dayInner}
                    onPress={() => selectCalendarDate(dayDate)}
                  >
                    <Text
                      style={[
                        typography.body,
                        styles.dayText,
                        !calendarDay.isCurrentMonth ? styles.outsideMonthText : null,
                        isToday ? styles.todayText : null,
                        isSelected ? styles.selectedDayText : null,
                        isToday && isSelected ? styles.todaySelectedText : null,
                        isSelected && !calendarDay.isCurrentMonth ? styles.selectedOutsideMonthText : null,
                      ]}
                    >
                      {calendarDay.day}
                    </Text>
                    <View style={styles.dayDotSlot}>
                      {hasDuePayment ? (
                        <View
                          style={[
                            styles.dayDot,
                            isSelected ? styles.selectedDueDot : styles.dueDot,
                          ]}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {dueSubscriptions.length > 0 ? (
          <View style={[surfaces.panel, styles.dueCard]}>
            <Text style={[typography.cardTitle, styles.dueTitle]}>
              {t("calendar.dueOn", { date: selectedDayLabel })}
            </Text>
            <View style={styles.dueList}>
              <View style={styles.dueListDivider} />
              {dueSubscriptions.map((subscription, index) => (
                <Pressable
                  key={subscription.id}
                  style={[
                    styles.dueRow,
                    index < dueSubscriptions.length - 1 ? styles.dueRowDivider : null,
                  ]}
                  onPress={() =>
                    navigation.navigate("SubscriptionDetails", {
                      subscriptionId: subscription.id,
                    })
                  }
                >
                  <View style={styles.dueRowLeft}>
                    <SubscriptionAvatar
                      name={subscription.name}
                      category={subscription.category}
                      size={40}
                    />
                    <View style={styles.dueRowCopy}>
                      <Text style={[typography.body, styles.dueName]}>{subscription.name}</Text>
                      <Text style={[typography.secondary, styles.dueMeta]}>
                        {localizeCategory(subscription.category, language)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dueRowRight}>
                    <Text style={[typography.body, styles.dueAmount]}>
                      {formatCurrency(subscription.amount, currency)}
                    </Text>
                    <Text style={[typography.secondary, styles.dueMeta]}>
                      {t(`subscription.billing_${subscription.billingCycle}`)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={[surfaces.subtlePanel, styles.emptyDueCard]}>
            <Text style={[typography.secondary, styles.emptyDueText]}>
              {t("calendar.noDueOn", { date: selectedShortDayLabel })}
            </Text>
          </View>
        )}
      </ScrollView>
      <Pressable
        style={[styles.fabButton, { bottom: spacing.lg }]}
        onPress={() => {
          const now = new Date();
          setToday(now);
          setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          selectCalendarDate(now);
        }}
      >
        <Text style={[typography.button, styles.fabButtonText]}>{todayFabLabel}</Text>
      </Pressable>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    contentWithTabBar: {
      minHeight: "100%",
    },
    pageTitle: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: 24,
      lineHeight: 30,
    },
    calendarCard: {
      gap: spacing.md,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 16,
      minHeight: 40,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    monthAction: {
      width: 46,
      height: 46,
      padding: 0,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    monthActionLight: {
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
    },
    monthLabel: {
      flex: 1,
      color: colors.accent,
      textAlign: "center",
      textTransform: "capitalize",
    },
    weekdayRow: {
      flexDirection: "row",
      gap: spacing.xxs,
    },
    weekdayCell: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 2,
    },
    weekdayText: {
      color: colors.textMuted,
      textTransform: "uppercase",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: 2,
    },
    dayCell: {
      width: "14.2857%",
      paddingHorizontal: 1,
      paddingVertical: 1,
    },
    dayInner: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
    },
    dayText: {
      color: colors.textPrimary,
      width: 30,
      height: 30,
      textAlign: "center",
      textAlignVertical: "center",
      lineHeight: 30,
      borderRadius: radius.pill,
    },
    todayText: {
      color: colors.accent,
    },
    outsideMonthText: {
      color: colors.textMuted,
    },
    selectedDayText: {
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      color: colors.accent,
    },
    todaySelectedText: {
      color: colors.accent,
    },
    selectedOutsideMonthText: {
      color: colors.accent,
    },
    dayDotSlot: {
      width: DAY_DOT_CONTAINER_SIZE,
      height: DAY_DOT_CONTAINER_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    dayDot: {
      width: DAY_DOT_SIZE,
      height: DAY_DOT_SIZE,
      borderRadius: DAY_DOT_SIZE / 2,
    },
    dueDot: {
      backgroundColor: colors.accent,
      opacity: 0.95,
    },
    selectedDueDot: {
      backgroundColor: colors.accent,
      opacity: 1,
    },
    dueCard: {
      gap: spacing.md,
    },
    emptyDueCard: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 68,
    },
    emptyDueText: {
      color: colors.textSecondary,
      textAlign: "center",
    },
    dueTitle: {
      color: colors.textPrimary,
    },
    dueList: {
      gap: spacing.xs,
    },
    dueListDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    dueRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    dueRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dueRowLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    dueRowCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    dueRowRight: {
      alignItems: "flex-end",
      gap: spacing.xxs,
    },
    dueName: {
      color: colors.textPrimary,
    },
    dueAmount: {
      color: colors.textPrimary,
    },
    dueMeta: {
      color: colors.textSecondary,
    },
    fabButton: {
      position: "absolute",
      right: spacing.lg,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      elevation: 4,
    },
    fabButtonText: {
      color: colors.accent,
      fontSize: 13,
      lineHeight: 16,
      textAlign: "center",
    },
  });
