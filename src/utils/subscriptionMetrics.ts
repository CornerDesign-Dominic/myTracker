import { Subscription, SubscriptionMetrics } from "@/types/subscription";

const getMonthlyEquivalent = (subscription: Subscription) => {
  switch (subscription.billingCycle) {
    case "monthly":
      return subscription.price;
    case "yearly":
      return subscription.price / 12;
    case "custom":
      return subscription.price;
    default:
      return subscription.price;
  }
};

const getYearlyEquivalent = (subscription: Subscription) => {
  switch (subscription.billingCycle) {
    case "monthly":
      return subscription.price * 12;
    case "yearly":
      return subscription.price;
    case "custom":
      return subscription.price * 12;
    default:
      return subscription.price * 12;
  }
};

export const buildSubscriptionMetrics = (
  subscriptions: Subscription[],
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
    const current = groupedCategoryMap.get(subscription.category) ?? {
      category: subscription.category,
      monthlyTotal: 0,
      yearlyTotal: 0,
    };

    groupedCategoryMap.set(subscription.category, {
      category: subscription.category,
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
