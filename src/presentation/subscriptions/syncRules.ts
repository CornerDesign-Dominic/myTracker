import { hasUserScope } from "../../application/subscriptions/errors.ts";

export const shouldSyncSubscriptionHistory = ({
  authIsReady,
  userId,
  subscriptionCount,
}: {
  authIsReady: boolean;
  userId?: string | null;
  subscriptionCount: number;
}) => authIsReady && hasUserScope(userId) && subscriptionCount > 0;
