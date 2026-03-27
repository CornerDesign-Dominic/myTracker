import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { createScreenLayout, createSurfaceStyles, radius, spacing } from "@/theme";

const WEEKDAY_LABELS = {
  de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
} as const;

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
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const days = Array.from({ length: leadingEmptyDays }, () => null as number | null);
  days.push(...Array.from({ length: daysInMonth }, (_, index) => index + 1));

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

export const CalendarScreen = () => {
  const { colors, typography } = useAppTheme();
  const { language, t } = useI18n();
  const layout = createScreenLayout(colors);
  const surfaces = createSurfaceStyles(colors);
  const styles = getStyles(colors);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthLabel = useMemo(() => getMonthLabel(visibleMonth, language), [language, visibleMonth]);
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === visibleMonth.getFullYear() &&
    today.getMonth() === visibleMonth.getMonth();

  const changeMonth = (direction: -1 | 1) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  return (
    <SafeAreaView style={layout.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={[layout.content, styles.contentWithTabBar]}>
        <Text style={[typography.pageTitle, styles.pageTitle]}>{t("calendar.title")}</Text>

        <View style={[surfaces.panel, styles.calendarCard]}>
          <View style={styles.headerRow}>
            <Pressable
              style={[surfaces.subtlePanel, styles.monthAction]}
              onPress={() => changeMonth(-1)}
            >
              <Ionicons name="chevron-back-outline" size={18} color={colors.textPrimary} />
            </Pressable>

            <Text style={[typography.cardTitle, styles.monthLabel]}>{monthLabel}</Text>

            <Pressable
              style={[surfaces.subtlePanel, styles.monthAction]}
              onPress={() => changeMonth(1)}
            >
              <Ionicons name="chevron-forward-outline" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS[language].map((label) => (
              <View key={label} style={styles.weekdayCell}>
                <Text style={[typography.meta, styles.weekdayText]}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((day, index) => {
              const isToday = isCurrentMonth && day === today.getDate();

              return (
                <View key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${index}`} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayInner,
                      day ? styles.dayInnerFilled : null,
                      isToday ? styles.todayCell : null,
                    ]}
                  >
                    <Text
                      style={[
                        typography.body,
                        styles.dayText,
                        !day ? styles.dayTextEmpty : null,
                        isToday ? styles.todayText : null,
                      ]}
                    >
                      {day ?? ""}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    contentWithTabBar: {
      minHeight: "100%",
    },
    pageTitle: {
      color: colors.textPrimary,
    },
    calendarCard: {
      gap: spacing.lg,
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
    monthLabel: {
      flex: 1,
      color: colors.textPrimary,
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
      paddingVertical: spacing.xxs,
    },
    weekdayText: {
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      rowGap: spacing.xxs,
    },
    dayCell: {
      width: "14.2857%",
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    dayInner: {
      minHeight: 62,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    dayInnerFilled: {
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    todayCell: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    dayText: {
      color: colors.textPrimary,
    },
    todayText: {
      color: colors.accent,
    },
    dayTextEmpty: {
      color: "transparent",
    },
  });
