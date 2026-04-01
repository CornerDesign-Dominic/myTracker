import type { Subscription } from "../../types/subscription.ts";
import type { SubscriptionHistoryEvent } from "../../types/subscriptionHistory.ts";
import { formatLocalDateInput, parseLocalDateInput } from "../../utils/date.ts";
import { getRecurringAnchorDay, shiftRecurringDate } from "../../utils/recurringDates.ts";

import { getMonthlyEquivalent } from "./metrics.ts";

export type DevelopmentRange = 6 | 12 | 24 | 36 | 60 | "all";

export type DevelopmentPoint = {
  key: string;
  date: Date;
  totalAmount: number;
};

export type DevelopmentSeries = {
  points: DevelopmentPoint[];
  mode: "bar" | "line";
  hasHistory: boolean;
};

export type MonthlyCostPreviewItem = {
  key: string;
  date: Date;
  totalAmount: number;
};

export type HomeMonthlySummary = {
  paidAmount: number;
  dueAmount: number;
  totalAmount: number;
};

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const parseDate = (value?: string) => {
  if (!value) {
    return null;
  }

  return parseLocalDateInput(value);
};

const isSameMonth = (date: Date, reference: Date) =>
  date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();

const isBookedPaymentEvent = (event: SubscriptionHistoryEvent) =>
  event.type === "payment_booked" && !event.deletedAt;

const getPaymentEventMonthDate = (event: SubscriptionHistoryEvent) =>
  parseDate(event.dueDate) ?? parseDate(event.bookedAt);

const isWithinCurrentYear = (date: Date, now: Date) => date.getFullYear() === now.getFullYear();

const getMonthDifference = (startMonth: Date, endMonth: Date) =>
  (endMonth.getFullYear() - startMonth.getFullYear()) * 12 +
  (endMonth.getMonth() - startMonth.getMonth());

const buildMonthBuckets = (startMonth: Date, endMonth: Date) => {
  const monthCount = getMonthDifference(startMonth, endMonth) + 1;

  return Array.from({ length: monthCount }, (_, index) => {
    const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);

    return {
      key: toMonthKey(monthDate),
      date: monthDate,
      totalAmount: 0,
    };
  });
};

const isSameOrBeforeMonth = (left: Date, right: Date) =>
  left.getFullYear() < right.getFullYear() ||
  (left.getFullYear() === right.getFullYear() && left.getMonth() <= right.getMonth());

const getAllRangeStartMonth = (
  history: SubscriptionHistoryEvent[],
  fallbackMonth: Date,
) => {
  const bookedMonths = history
    .filter(isBookedPaymentEvent)
    .map((event) => parseDate(event.dueDate))
    .filter((value): value is Date => value instanceof Date)
    .map(startOfMonth);
  const candidates = [...bookedMonths];

  if (candidates.length === 0) {
    return fallbackMonth;
  }

  return candidates.reduce((earliest, current) => (current < earliest ? current : earliest));
};

const getVisibleRange = (
  history: SubscriptionHistoryEvent[],
  range: DevelopmentRange,
  now: Date,
) => {
  const endMonth = startOfMonth(now);
  const startMonth =
    range === "all"
      ? getAllRangeStartMonth(history, endMonth)
      : new Date(endMonth.getFullYear(), endMonth.getMonth() - (range - 1), 1);

  return {
    startMonth,
    endMonth,
  };
};

const buildHistoryAmountMap = (
  history: SubscriptionHistoryEvent[],
  startMonth: Date,
  endMonth: Date,
) => {
  const amountMap = new Map<string, number>();

  history.forEach((event) => {
    if (!isBookedPaymentEvent(event)) {
      return;
    }

    const dueDate = parseDate(event.dueDate);
    if (!dueDate) {
      return;
    }

    const monthDate = startOfMonth(dueDate);
    if (monthDate < startMonth || monthDate > endMonth) {
      return;
    }

    const key = toMonthKey(monthDate);
    amountMap.set(key, (amountMap.get(key) ?? 0) + (event.amount ?? 0));
  });

  return amountMap;
};

export const getProjectedYearlyCost = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  now = new Date(),
) =>
  subscriptions.reduce(
    (sum, subscription) =>
      sum + getProjectedSubscriptionYearlyCost(subscription, history, now),
    0,
  );

export const buildHomeMonthlySummary = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  now = new Date(),
): HomeMonthlySummary => {
  const todayKey = formatLocalDateInput(now);
  const paidAmount = history
    .filter(isBookedPaymentEvent)
    .filter((event) => {
      const eventDate = getPaymentEventMonthDate(event);
      return eventDate instanceof Date && isSameMonth(eventDate, now);
    })
    .reduce((sum, event) => sum + (event.amount ?? 0), 0);

  const dueAmount = subscriptions
    .filter((subscription) => subscription.status === "active" && !subscription.archivedAt)
    .filter((subscription) => {
      const nextPaymentDate = parseDate(subscription.nextPaymentDate);

      return (
        nextPaymentDate instanceof Date &&
        isSameMonth(nextPaymentDate, now) &&
        subscription.nextPaymentDate > todayKey
      );
    })
    .reduce((sum, subscription) => sum + subscription.amount, 0);

  return {
    paidAmount,
    dueAmount,
    totalAmount: paidAmount + dueAmount,
  };
};

export const getProjectedSubscriptionYearlyCost = (
  subscription: Subscription,
  history: SubscriptionHistoryEvent[],
  now = new Date(),
) => {
  const todayKey = formatLocalDateInput(now);
  const yearEnd = new Date(now.getFullYear(), 11, 31);
  const bookedEvents = history.filter(
    (event) => {
      if (
        event.subscriptionId !== subscription.id ||
        !isBookedPaymentEvent(event)
      ) {
        return false;
      }

      const dueDate = parseDate(event.dueDate);

      return dueDate instanceof Date && isWithinCurrentYear(dueDate, now);
    },
  );

  const bookedAmount = bookedEvents.reduce((sum, event) => sum + (event.amount ?? 0), 0);

  if (subscription.status !== "active") {
    return bookedAmount;
  }

  const bookedDueDates = new Set(bookedEvents.map((event) => event.dueDate));
  const nextPaymentDate = parseLocalDateInput(subscription.nextPaymentDate);

  if (!nextPaymentDate) {
    return bookedAmount;
  }

  const anchorDay = getRecurringAnchorDay(subscription.nextPaymentDate);
  let cursor = nextPaymentDate;
  let forecastAmount = 0;

  while (cursor <= yearEnd) {
    const dueDate = formatLocalDateInput(cursor);

    if (
      dueDate >= todayKey &&
      cursor.getFullYear() === now.getFullYear() &&
      !bookedDueDates.has(dueDate)
    ) {
      forecastAmount += subscription.amount;
    }

    cursor = shiftRecurringDate(cursor, subscription.billingCycle, 1, anchorDay);
  }

  return bookedAmount + forecastAmount;
};

export const getCurrentMonthCost = (subscriptions: Subscription[], now = new Date()) => {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return subscriptions
    .filter((subscription) => subscription.status !== "cancelled")
    .filter((subscription) => {
      const paymentDate = parseDate(subscription.nextPaymentDate);

      return (
        paymentDate instanceof Date &&
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, subscription) => sum + subscription.amount, 0);
};

export const getAverageMonthlyCost = (subscriptions: Subscription[]) =>
  subscriptions
    .filter((subscription) => subscription.status !== "cancelled")
    .reduce((sum, subscription) => sum + getMonthlyEquivalent(subscription), 0);

export const getBillingStructure = (subscriptions: Subscription[]) => {
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status !== "cancelled",
  );

  return (["monthly", "quarterly", "yearly"] as const).map((cycle) => {
    const items = activeSubscriptions.filter((subscription) => subscription.billingCycle === cycle);

    return {
      cycle,
      count: items.length,
      totalAmount: items.reduce((sum, subscription) => sum + subscription.amount, 0),
    };
  });
};

export const getTopExpensiveSubscriptions = (
  subscriptions: Subscription[],
  limit = 3,
) =>
  [...subscriptions]
    .filter((subscription) => subscription.status === "active")
    .sort((left, right) => getMonthlyEquivalent(right) - getMonthlyEquivalent(left))
    .slice(0, limit);

export const buildUpcomingMonthlyCostPreview = (
  subscriptions: Subscription[],
  monthCount = 12,
  now = new Date(),
): MonthlyCostPreviewItem[] => {
  const startMonth = startOfMonth(now);
  const endMonth = new Date(startMonth.getFullYear(), startMonth.getMonth() + monthCount - 1, 1);
  const buckets = buildMonthBuckets(startMonth, endMonth);
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  subscriptions
    .filter((subscription) => subscription.status === "active")
    .forEach((subscription) => {
      const nextPaymentDate = parseDate(subscription.nextPaymentDate);

      if (!nextPaymentDate) {
        return;
      }

      const anchorDay = getRecurringAnchorDay(subscription.nextPaymentDate);
      let cursor = nextPaymentDate;

      while (startOfMonth(cursor) < startMonth) {
        cursor = shiftRecurringDate(cursor, subscription.billingCycle, 1, anchorDay);
      }

      while (isSameOrBeforeMonth(startOfMonth(cursor), endMonth)) {
        const bucket = bucketMap.get(toMonthKey(startOfMonth(cursor)));

        if (bucket) {
          bucket.totalAmount += subscription.amount;
        }

        cursor = shiftRecurringDate(cursor, subscription.billingCycle, 1, anchorDay);
      }
    });

  return buckets.map((bucket) => ({
    key: bucket.key,
    date: bucket.date,
    totalAmount: bucket.totalAmount,
  }));
};

export const buildCostDevelopmentSeries = (
  history: SubscriptionHistoryEvent[],
  range: DevelopmentRange = 6,
  _language: "de" | "en" = "de",
  now = new Date(),
): DevelopmentSeries => {
  const { startMonth, endMonth } = getVisibleRange(history, range, now);
  const buckets = buildMonthBuckets(startMonth, endMonth);
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const historyAmountMap = buildHistoryAmountMap(history, startMonth, endMonth);
  bucketMap.forEach((bucket, key) => {
    bucket.totalAmount = historyAmountMap.get(key) ?? 0;
  });

  const hasHistory = buckets.some((bucket) => bucket.totalAmount > 0);

  return {
    mode: range === 6 || range === 12 ? "bar" : "line",
    hasHistory,
    points: buckets.map((bucket) => ({
      key: bucket.key,
      date: bucket.date,
      totalAmount: bucket.totalAmount,
    })),
  };
};
