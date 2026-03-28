import {
  archiveFirestoreSubscription,
  createFirestoreHistoryEvent,
  createFirestoreSubscription,
  subscribeToFirestoreSubscriptionHistory,
  subscribeToFirestoreSubscriptions,
  syncFirestoreSubscriptionsHistory,
  updateFirestoreSubscription,
} from "@/services/firestore/subscriptionFirestore";

import { SubscriptionDataSource } from "./types";

export const firebaseSubscriptionDataSource: SubscriptionDataSource = {
  subscribe(userId, listener, onError) {
    return subscribeToFirestoreSubscriptions(userId, listener, onError);
  },
  create(userId, input) {
    return createFirestoreSubscription(userId, input);
  },
  update(userId, id, input) {
    return updateFirestoreSubscription(userId, id, input);
  },
  archive(userId, id) {
    return archiveFirestoreSubscription(userId, id);
  },
  subscribeHistory(userId, subscriptionId, listener, onError) {
    return subscribeToFirestoreSubscriptionHistory(userId, subscriptionId, listener, onError);
  },
  syncHistory(userId, subscriptions) {
    return syncFirestoreSubscriptionsHistory(userId, subscriptions);
  },
  createHistoryEvent(userId, subscriptionId, event) {
    return createFirestoreHistoryEvent(userId, subscriptionId, event);
  },
};
