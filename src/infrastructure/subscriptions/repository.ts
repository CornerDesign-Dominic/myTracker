import { hasRequiredFirebaseConfig } from "@/firebase/config";

import { firebaseSubscriptionDataSource } from "./firebaseDataSource";
import { mockSubscriptionDataSource } from "./mockDataSource";
import { SubscriptionDataSource } from "./types";

export const isUsingFirebaseSubscriptions = hasRequiredFirebaseConfig;

const activeSubscriptionDataSource: SubscriptionDataSource = isUsingFirebaseSubscriptions
  ? firebaseSubscriptionDataSource
  : mockSubscriptionDataSource;

export const subscriptionRepository: SubscriptionDataSource = activeSubscriptionDataSource;
