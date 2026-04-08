import {
  buildSavingsSummary,
  getTotalSavedAmount,
} from "@/domain/subscriptionHistory/statistics";
import {
  buildHomeMonthlySummary,
  getBillingStructure,
  getStartedSubscriptionsForStatistics,
  getTopExpensiveSubscriptions,
} from "@/domain/subscriptions/statistics";
import { Subscription } from "@/types/subscription";
import {
  SubscriptionHistoryEvent,
  SubscriptionHistoryEventType,
} from "@/types/subscriptionHistory";
import { parseLocalDateInput } from "@/utils/date";

type AppLanguage = "de" | "en";
type TranslateFn = (key: string, params?: Record<string, string>) => string;

export type MonthlyAmountSummary = {
  totalAmount: number;
  date: Date;
};

export type YearlyActualProjection = {
  currentYear: number;
  currentYearTotal: number;
  previousYearTotal: number;
};

export type StatsSubscriptionsProjection = {
  statisticsSubscriptions: Subscription[];
  billingStructure: ReturnType<typeof getBillingStructure>;
  topSubscriptions: Subscription[];
};

export type DevelopmentSummaryProjection = {
  currentMonthProjected: number;
  averageMonthlyActual: number;
  highestActualMonth: MonthlyAmountSummary | null;
  highestActualMonthLabel: string | null;
};

export type SavingsSummaryLabels = {
  currentYear: string;
  previousYear: string;
  currentMonth: string;
  previousMonth: string;
  currentMonthProjection: string;
  currentYearProjection: string;
};

export type MonthlySavingsItem = {
  subscriptionId: string;
  subscriptionName: string;
  amount: number;
};

export type MonthlySavingsGroup = {
  key: string;
  label: string;
  totalAmount: number;
  items: MonthlySavingsItem[];
};

const getLocale = (language: AppLanguage) => (language === "de" ? "de-DE" : "en-US");

const getRelevantEventDate = (
  event: SubscriptionHistoryEvent,
  eventType: "payment_booked" | "payment_skipped_inactive",
) =>
  parseLocalDateInput(
    eventType === "payment_booked"
      ? event.dueDate ?? event.bookedAt ?? ""
      : event.dueDate ?? "",
  );

export const buildHomeMonthlyCardProjection = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  language: AppLanguage,
  now = new Date(),
) => {
  const monthLabel = new Intl.DateTimeFormat(getLocale(language), {
    month: "long",
  }).format(now);
  const homeDateLabel = `${String(now.getDate()).padStart(2, "0")}.${monthLabel}`;

  return {
    ...buildHomeMonthlySummary(subscriptions, history, now),
    monthLabel,
    homeDateLabel,
  };
};

export const getSkippedHistoryEvents = (history: SubscriptionHistoryEvent[]) =>
  history
    .filter((event) => event.type === "payment_skipped_inactive" && !event.deletedAt)
    .sort((left, right) =>
      (right.updatedAt ?? right.createdAt).localeCompare(left.updatedAt ?? left.createdAt),
    );

export const buildSavingsSummaryLabels = (
  language: AppLanguage,
  t: TranslateFn,
  now = new Date(),
): SavingsSummaryLabels => {
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthFormatter = new Intl.DateTimeFormat(getLocale(language), {
    month: "long",
  });

  return {
    currentYear: String(now.getFullYear()),
    previousYear: String(now.getFullYear() - 1),
    currentMonth: monthFormatter.format(now),
    previousMonth: monthFormatter.format(previousMonth),
    currentMonthProjection: t("stats.currentMonthProjectedShort", {
      month: monthFormatter.format(now),
    }),
    currentYearProjection: t("stats.currentYearProjectedShort", {
      year: String(now.getFullYear()),
    }),
  };
};

export const buildSavingsOverviewProjection = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  language: AppLanguage,
  t: TranslateFn,
  now = new Date(),
) => {
  const skippedEvents = getSkippedHistoryEvents(history);

  return {
    skippedEvents,
    savingsSummary: buildSavingsSummary(subscriptions, skippedEvents, now),
    totalSavedAmount: getTotalSavedAmount(skippedEvents),
    summaryLabels: buildSavingsSummaryLabels(language, t, now),
  };
};

export const buildStatsSubscriptionsProjection = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  now = new Date(),
): StatsSubscriptionsProjection => {
  const statisticsSubscriptions = getStartedSubscriptionsForStatistics(subscriptions, history, now);

  return {
    statisticsSubscriptions,
    billingStructure: getBillingStructure(statisticsSubscriptions),
    topSubscriptions: getTopExpensiveSubscriptions(statisticsSubscriptions, 5),
  };
};

export const getHistoryEventYearTotal = (
  history: SubscriptionHistoryEvent[],
  eventType: "payment_booked" | "payment_skipped_inactive",
  year: number,
) =>
  history.reduce((sum, event) => {
    if (event.type !== eventType || event.deletedAt) {
      return sum;
    }

    const eventDate = getRelevantEventDate(event, eventType);
    if (!eventDate || eventDate.getFullYear() !== year) {
      return sum;
    }

    return sum + (event.amount ?? 0);
  }, 0);

export const buildYearlyActualProjection = (
  history: SubscriptionHistoryEvent[],
  eventType: "payment_booked" | "payment_skipped_inactive",
  now = new Date(),
): YearlyActualProjection => {
  const currentYear = now.getFullYear();

  return {
    currentYear,
    currentYearTotal: getHistoryEventYearTotal(history, eventType, currentYear),
    previousYearTotal: getHistoryEventYearTotal(history, eventType, currentYear - 1),
  };
};

export const buildMonthlyAmountSummaries = (
  history: SubscriptionHistoryEvent[],
  eventType: "payment_booked" | "payment_skipped_inactive",
): MonthlyAmountSummary[] => {
  const buckets = new Map<string, MonthlyAmountSummary>();

  history.forEach((event) => {
    if (event.type !== eventType || event.deletedAt) {
      return;
    }

    const eventDate = getRelevantEventDate(event, eventType);
    if (!eventDate) {
      return;
    }

    const key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;
    const existing = buckets.get(key);

    if (existing) {
      existing.totalAmount += event.amount ?? 0;
      return;
    }

    buckets.set(key, {
      totalAmount: event.amount ?? 0,
      date: new Date(eventDate.getFullYear(), eventDate.getMonth(), 1),
    });
  });

  return Array.from(buckets.values()).sort((left, right) => left.date.getTime() - right.date.getTime());
};

export const buildMonthlySavingsGroups = (
  subscriptions: Subscription[],
  skippedEvents: SubscriptionHistoryEvent[],
  language: AppLanguage,
  unavailableLabel: string,
): MonthlySavingsGroup[] => {
  const subscriptionNames = new Map(
    subscriptions.map((subscription) => [subscription.id, subscription.name]),
  );
  const groups = new Map<
    string,
    {
      date: Date;
      totalAmount: number;
      items: Map<string, MonthlySavingsItem>;
    }
  >();
  const monthFormatter = new Intl.DateTimeFormat(getLocale(language), {
    month: "long",
    year: "numeric",
  });

  skippedEvents.forEach((event) => {
    const dueDate = parseLocalDateInput(event.dueDate ?? "");
    if (!dueDate) {
      return;
    }

    const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`;
    const existingGroup = groups.get(key) ?? {
      date: new Date(dueDate.getFullYear(), dueDate.getMonth(), 1),
      totalAmount: 0,
      items: new Map<string, MonthlySavingsItem>(),
    };
    const existingItem = existingGroup.items.get(event.subscriptionId);

    existingGroup.totalAmount += event.amount ?? 0;
    if (existingItem) {
      existingItem.amount += event.amount ?? 0;
    } else {
      existingGroup.items.set(event.subscriptionId, {
        subscriptionId: event.subscriptionId,
        subscriptionName: subscriptionNames.get(event.subscriptionId) ?? unavailableLabel,
        amount: event.amount ?? 0,
      });
    }

    groups.set(key, existingGroup);
  });

  return Array.from(groups.entries())
    .map(([key, group]) => ({
      key,
      label: monthFormatter.format(group.date),
      totalAmount: group.totalAmount,
      items: Array.from(group.items.values()).sort((left, right) => right.amount - left.amount),
    }))
    .sort((left, right) => right.key.localeCompare(left.key));
};

export const buildDevelopmentSummaryProjection = (
  history: SubscriptionHistoryEvent[],
  eventType: "payment_booked" | "payment_skipped_inactive",
  language: AppLanguage,
  currentMonthProjected: number,
): DevelopmentSummaryProjection => {
  const monthlySummaries = buildMonthlyAmountSummaries(history, eventType);
  const totalActualAmount = monthlySummaries.reduce((sum, item) => sum + item.totalAmount, 0);
  const averageMonthlyActual =
    monthlySummaries.length > 0 ? totalActualAmount / monthlySummaries.length : 0;
  const highestActualMonth =
    monthlySummaries.reduce<MonthlyAmountSummary | null>((highest, item) => {
      if (!highest || item.totalAmount > highest.totalAmount) {
        return item;
      }

      return highest;
    }, null);

  return {
    currentMonthProjected,
    averageMonthlyActual,
    highestActualMonth,
    highestActualMonthLabel: highestActualMonth
      ? new Intl.DateTimeFormat(getLocale(language), {
          month: "long",
          year: "numeric",
        }).format(highestActualMonth.date)
      : null,
  };
};
