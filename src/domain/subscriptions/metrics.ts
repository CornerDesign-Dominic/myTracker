import type { Subscription, SubscriptionMetrics } from "../../types/subscription.ts";
import type { CategoryLanguage } from "../../utils/categories.ts";
import { getCategoryGroupKey, localizeCategory } from "../../utils/categories.ts";

export const getMonthlyEquivalent = (subscription: Subscription) => {
  switch (subscription.billingCycle) {
    case "monthly":
      return subscription.amount;
    case "quarterly":
      return subscription.amount / 3;
    case "yearly":
      return subscription.amount / 12;
    default:
      return subscription.amount;
  }
};

export const getYearlyEquivalent = (subscription: Subscription) => {
  switch (subscription.billingCycle) {
    case "monthly":
      return subscription.amount * 12;
    case "quarterly":
      return subscription.amount * 4;
    case "yearly":
      return subscription.amount;
    default:
      return subscription.amount * 12;
  }
};

export const buildSubscriptionMetrics = (
  subscriptions: Subscription[],
  language: CategoryLanguage = "de",
): SubscriptionMetrics => {
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status !== "cancelled",
  );

  const monthlyTotal = activeSubscriptions.reduce(
    (sum, subscription) => sum + getMonthlyEquivalent(subscription),
    0,
  );

  const yearlyTotal = activeSubscriptions.reduce(
    (sum, subscription) => sum + getYearlyEquivalent(subscription),
    0,
  );

  const groupedCategoryMap = new Map<
    string,
    {
      category: string;
      monthlyTotal: number;
      yearlyTotal: number;
    }
  >();

  activeSubscriptions.forEach((subscription) => {
    const categoryKey = getCategoryGroupKey(subscription.category);
    const localizedCategory = localizeCategory(subscription.category, language);
    const current = groupedCategoryMap.get(categoryKey) ?? {
      category: localizedCategory,
      monthlyTotal: 0,
      yearlyTotal: 0,
    };

    groupedCategoryMap.set(categoryKey, {
      category: localizedCategory,
      monthlyTotal: current.monthlyTotal + getMonthlyEquivalent(subscription),
      yearlyTotal: current.yearlyTotal + getYearlyEquivalent(subscription),
    });
  });

  const mostExpensive = [...activeSubscriptions].sort((left, right) => {
    return getMonthlyEquivalent(right) - getMonthlyEquivalent(left);
  })[0];

  const nextPayments = [...activeSubscriptions]
    .sort((left, right) => left.nextPaymentDate.localeCompare(right.nextPaymentDate))
    .slice(0, 5);

  return {
    monthlyTotal,
    yearlyTotal,
    activeCount: activeSubscriptions.length,
    byCategory: [...groupedCategoryMap.values()].sort(
      (left, right) => right.monthlyTotal - left.monthlyTotal,
    ),
    nextPayments,
    mostExpensive,
  };
};
