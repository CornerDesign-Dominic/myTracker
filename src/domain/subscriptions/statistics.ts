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
  label: string | null;
  source: "history" | "projection" | "mixed";
};

export type DevelopmentSeries = {
  points: DevelopmentPoint[];
  mode: "bar" | "line";
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

const isBookedPaymentEvent = (event: SubscriptionHistoryEvent) =>
  event.type === "payment_booked" && !event.deletedAt;

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
      historyAmount: 0,
      projectionAmount: 0,
    };
  });
};

const getAllRangeStartMonth = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  fallbackMonth: Date,
) => {
  const bookedMonths = history
    .filter(isBookedPaymentEvent)
    .map((event) => parseDate(event.dueDate))
    .filter((value): value is Date => value instanceof Date)
    .map(startOfMonth);
  const projectedMonths = subscriptions
    .map((subscription) => parseDate(subscription.nextPaymentDate))
    .filter((value): value is Date => value instanceof Date)
    .map(startOfMonth);
  const candidates = [...bookedMonths, ...projectedMonths];

  if (candidates.length === 0) {
    return fallbackMonth;
  }

  return candidates.reduce((earliest, current) => (current < earliest ? current : earliest));
};

const getVisibleRange = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  range: DevelopmentRange,
  now: Date,
) => {
  const endMonth = startOfMonth(now);
  const startMonth =
    range === "all"
      ? getAllRangeStartMonth(subscriptions, history, endMonth)
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

const buildProjectedAmountMap = (
  subscription: Subscription,
  startMonth: Date,
  endMonth: Date,
  now: Date,
) => {
  const amountMap = new Map<string, number>();
  const nextPaymentDate = parseDate(subscription.nextPaymentDate);

  if (!nextPaymentDate) {
    return amountMap;
  }

  const anchorDay = getRecurringAnchorDay(nextPaymentDate);
  let backwardCursor = new Date(nextPaymentDate);

  while (backwardCursor >= startMonth) {
    amountMap.set(toMonthKey(backwardCursor), subscription.amount);
    backwardCursor = shiftRecurringDate(backwardCursor, subscription.billingCycle, -1, anchorDay);
  }

  if (subscription.status === "active") {
    let forwardCursor = shiftRecurringDate(nextPaymentDate, subscription.billingCycle, 1, anchorDay);

    while (forwardCursor <= endMonth) {
      if (forwardCursor >= startOfMonth(now)) {
        amountMap.set(toMonthKey(forwardCursor), subscription.amount);
      }

      forwardCursor = shiftRecurringDate(forwardCursor, subscription.billingCycle, 1, anchorDay);
    }
  }

  return amountMap;
};

const getMonthLabel = (
  date: Date,
  language: "de" | "en",
  includeYear = false,
) => {
  const locale = language === "de" ? "de-DE" : "en-US";
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);

  if (!includeYear) {
    return month;
  }

  return `${month} ${String(date.getFullYear()).slice(-2)}`;
};

const getYearLabel = (date: Date) => String(date.getFullYear()).slice(-2);

const buildAxisLabels = (
  points: Array<{ date: Date }>,
  range: DevelopmentRange,
  language: "de" | "en",
) => {
  return points.map((point, index) => {
    const previousPoint = points[index - 1];
    const isYearBoundary = !previousPoint || previousPoint.date.getFullYear() !== point.date.getFullYear();
    const isLast = index === points.length - 1;

    if (range === 6) {
      return getMonthLabel(point.date, language, isYearBoundary);
    }

    if (range === 12) {
      if (isYearBoundary || isLast || index % 2 === 0) {
        return getMonthLabel(point.date, language, isYearBoundary);
      }

      return null;
    }

    if (range === 24) {
      if (isYearBoundary || isLast || index % 3 === 0) {
        return getMonthLabel(point.date, language, isYearBoundary);
      }

      return null;
    }

    if (range === 36) {
      if (point.date.getMonth() === 0 || index === 0 || isLast) {
        return getYearLabel(point.date);
      }

      return null;
    }

    if (range === 60 || range === "all") {
      if (point.date.getMonth() === 0 || index === 0 || isLast) {
        return getYearLabel(point.date);
      }

      return null;
    }

    return null;
  });
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

export const buildCostDevelopmentSeries = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  range: DevelopmentRange = 6,
  language: "de" | "en" = "de",
  now = new Date(),
): DevelopmentSeries => {
  const { startMonth, endMonth } = getVisibleRange(subscriptions, history, range, now);
  const buckets = buildMonthBuckets(startMonth, endMonth);
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  subscriptions.forEach((subscription) => {
    const subscriptionHistory = history.filter((event) => event.subscriptionId === subscription.id);
    const historyAmountMap = buildHistoryAmountMap(subscriptionHistory, startMonth, endMonth);
    const projectedAmountMap = buildProjectedAmountMap(subscription, startMonth, endMonth, now);

    bucketMap.forEach((bucket, key) => {
      const historyAmount = historyAmountMap.get(key) ?? 0;
      const projectionAmount = historyAmount > 0 ? 0 : projectedAmountMap.get(key) ?? 0;

      bucket.historyAmount += historyAmount;
      bucket.projectionAmount += projectionAmount;
      bucket.totalAmount += historyAmount + projectionAmount;
    });
  });

  const labels = buildAxisLabels(buckets, range, language);

  return {
    mode: range === 6 || range === 12 ? "bar" : "line",
    points: buckets.map((bucket, index) => ({
      key: bucket.key,
      date: bucket.date,
      totalAmount: bucket.totalAmount,
      label: labels[index] ?? null,
      source:
        bucket.historyAmount > 0 && bucket.projectionAmount > 0
          ? "mixed"
          : bucket.historyAmount > 0
            ? "history"
            : "projection",
    })),
  };
};
