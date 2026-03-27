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
  subscribe(
    userId: string,
    listener: (subscriptions: Subscription[]) => void,
    onError?: (error: Error) => void,
  ) {
    if (usingFirebase) {
      return subscribeToFirestoreSubscriptions(userId, listener, onError);
    }

    return mockSubscriptionStore.subscribe(listener);
  },
  async create(userId: string, input: SubscriptionInput) {
    if (usingFirebase) {
      await createFirestoreSubscription(userId, input);
      return;
    }

    await mockSubscriptionStore.create(input);
  },
  async update(userId: string, id: string, input: Partial<SubscriptionInput>) {
    if (usingFirebase) {
      await updateFirestoreSubscription(userId, id, input);
      return;
    }

    await mockSubscriptionStore.update(id, input);
  },
  async archive(userId: string, id: string) {
    if (usingFirebase) {
      await archiveFirestoreSubscription(userId, id);
      return;
    }

    await mockSubscriptionStore.archive(id);
  },
};
