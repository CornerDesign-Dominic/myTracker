import type { Subscription } from "../../types/subscription.ts";
import type { SubscriptionHistoryEvent } from "../../types/subscriptionHistory.ts";
import { formatLocalDateInput, parseLocalDateInput } from "../../utils/date.ts";
import { getRecurringAnchorDay, shiftRecurringDate } from "../../utils/recurringDates.ts";

import { getMonthlyEquivalent } from "./metrics.ts";

export type DevelopmentRange = 6 | 12 | 24 | 36 | 60 | "all";

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const isBookedPaymentEvent = (event: SubscriptionHistoryEvent) =>
  event.type === "payment_booked" && !event.deletedAt;

const isWithinCurrentYear = (date: Date, now: Date) => date.getFullYear() === now.getFullYear();

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
    (event) =>
      event.subscriptionId === subscription.id &&
      isBookedPaymentEvent(event) &&
      !!event.dueDate &&
      isWithinCurrentYear(parseDate(event.dueDate), now),
  );

  const bookedAmount = bookedEvents.reduce((sum, event) => sum + (event.amount ?? 0), 0);

  if (subscription.status !== "active") {
    return bookedAmount;
  }

  const bookedDueDates = new Set(bookedEvents.map((event) => event.dueDate));
  const anchorDay = getRecurringAnchorDay(subscription.nextPaymentDate);
  let cursor = parseLocalDateInput(subscription.nextPaymentDate);
  let forecastAmount = 0;

  if (!cursor) {
    return bookedAmount;
  }

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
  range: DevelopmentRange = 6,
  now = new Date(),
) => {
  const endMonth = startOfMonth(now);
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status !== "cancelled",
  );
  const startMonth =
    range === "all"
      ? getAllRangeStartMonth(activeSubscriptions, endMonth)
      : new Date(endMonth.getFullYear(), endMonth.getMonth() - (range - 1), 1);
  const monthCount = getMonthDifference(startMonth, endMonth) + 1;

  const buckets = Array.from({ length: monthCount }, (_, index) => {
    const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);
    return {
      key: toMonthKey(monthDate),
      date: monthDate,
      totalAmount: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  activeSubscriptions.forEach((subscription) => {
      let cursor = parseDate(subscription.nextPaymentDate);
      const anchorDay = getRecurringAnchorDay(cursor);

      while (cursor >= startMonth) {
        const bucket = bucketMap.get(toMonthKey(cursor));
        if (bucket) {
          bucket.totalAmount += subscription.amount;
        }

        cursor = shiftRecurringDate(cursor, subscription.billingCycle, -1, anchorDay);
      }
    });

  return buckets;
};

const getMonthDifference = (startMonth: Date, endMonth: Date) =>
  (endMonth.getFullYear() - startMonth.getFullYear()) * 12 +
  (endMonth.getMonth() - startMonth.getMonth());

const getAllRangeStartMonth = (
  subscriptions: Subscription[],
  fallbackMonth: Date,
) => {
  if (subscriptions.length === 0) {
    return fallbackMonth;
  }

  const earliestMonth = subscriptions.reduce<Date>((earliest, subscription) => {
    const paymentMonth = startOfMonth(parseDate(subscription.nextPaymentDate));
    return paymentMonth < earliest ? paymentMonth : earliest;
  }, startOfMonth(parseDate(subscriptions[0].nextPaymentDate)));

  return earliestMonth > fallbackMonth ? fallbackMonth : earliestMonth;
};
