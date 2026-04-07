import { hasRequiredFirebaseConfig } from "@/firebase/config";

import { firebaseSubscriptionDataSource } from "./firebaseDataSource";
import { localFirstSubscriptionDataSource } from "./localFirstDataSource";
import { mockSubscriptionDataSource } from "./mockDataSource";
import { SubscriptionDataSource } from "./types";

export const isUsingFirebaseSubscriptions = hasRequiredFirebaseConfig;

const activeSubscriptionDataSource: SubscriptionDataSource = isUsingFirebaseSubscriptions
  ? localFirstSubscriptionDataSource
  : mockSubscriptionDataSource;

export const subscriptionRepository: SubscriptionDataSource = activeSubscriptionDataSource;

export { retryPendingSubscriptionSync } from "./localFirstDataSource";
export { subscribePendingHistoryProjection } from "./localFirstDataSource";
export { subscribeUserStatsProjection } from "./localFirstDataSource";
export { firebaseSubscriptionDataSource };
