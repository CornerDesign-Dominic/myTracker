import type { Subscription } from "@/types/subscription";

export const FREE_SUBSCRIPTION_LIMIT = 10;

export const getSubscriptionCount = (subscriptions: Subscription[]) => subscriptions.length;

export const canCreateSubscription = ({
  subscriptionCount,
  isPremium,
}: {
  subscriptionCount: number;
  isPremium: boolean;
}) => isPremium || subscriptionCount < FREE_SUBSCRIPTION_LIMIT;
