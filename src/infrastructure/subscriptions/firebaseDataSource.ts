import {
  archiveFirestoreSubscription,
  createFirestoreSubscription,
  subscribeToFirestoreSubscriptions,
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
};
