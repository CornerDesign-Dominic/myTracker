import { BillingCycle, Subscription } from "@/types/subscription";

import { getMonthlyEquivalent } from "./metrics";

const BILLING_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, amount: number) =>
  new Date(date.getFullYear(), date.getMonth() + amount, date.getDate());

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
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
    .filter((subscription) => subscription.status !== "cancelled")
    .sort((left, right) => getMonthlyEquivalent(right) - getMonthlyEquivalent(left))
    .slice(0, limit);

export const buildCostDevelopmentSeries = (
  subscriptions: Subscription[],
  months = 6,
  now = new Date(),
) => {
  const endMonth = startOfMonth(now);
  const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - (months - 1), 1);

  const buckets = Array.from({ length: months }, (_, index) => {
    const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);
    return {
      key: toMonthKey(monthDate),
      date: monthDate,
      totalAmount: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  subscriptions
    .filter((subscription) => subscription.status !== "cancelled")
    .forEach((subscription) => {
      const step = BILLING_MONTHS[subscription.billingCycle] ?? 1;
      let cursor = parseDate(subscription.nextPaymentDate);

      while (cursor >= startMonth) {
        const bucket = bucketMap.get(toMonthKey(cursor));
        if (bucket) {
          bucket.totalAmount += subscription.amount;
        }

        cursor = addMonths(cursor, -step);
      }
    });

  return buckets;
};
