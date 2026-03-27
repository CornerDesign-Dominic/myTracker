import { hasRequiredFirebaseConfig } from "@/firebase/config";
import { Subscription, SubscriptionInput } from "@/types/subscription";

import {
  archiveFirestoreSubscription,
  createFirestoreSubscription,
  subscribeToFirestoreSubscriptions,
  updateFirestoreSubscription,
} from "./firestore/subscriptionFirestore";
import { mockSubscriptionStore } from "./storage/mockSubscriptionStore";

export const usingFirebase = hasRequiredFirebaseConfig;

export const subscriptionRepository = {
  subscribe(listener: (subscriptions: Subscription[]) => void) {
    if (usingFirebase) {
      return subscribeToFirestoreSubscriptions(listener);
    }

    return mockSubscriptionStore.subscribe(listener);
  },
  async create(input: SubscriptionInput) {
    if (usingFirebase) {
      await createFirestoreSubscription(input);
      return;
    }

    await mockSubscriptionStore.create(input);
  },
  async update(id: string, input: Partial<SubscriptionInput>) {
    if (usingFirebase) {
      await updateFirestoreSubscription(id, input);
      return;
    }

    await mockSubscriptionStore.update(id, input);
  },
  async archive(id: string) {
    if (usingFirebase) {
      await archiveFirestoreSubscription(id);
      return;
    }

    await mockSubscriptionStore.archive(id);
  },
};
