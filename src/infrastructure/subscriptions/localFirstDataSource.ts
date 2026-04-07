import { SubscriptionDataSource } from "./types";
import { localFirstSubscriptionStore, UserStatsProjection } from "./localFirstStore";

export const localFirstSubscriptionDataSource: SubscriptionDataSource = {
  subscribe(userId, listener, onError) {
    let unsubscribe: () => void = () => {};

    void localFirstSubscriptionStore
      .connectSubscriptionFeed(userId, listener, onError)
      .then((nextUnsubscribe) => {
        unsubscribe = nextUnsubscribe;
      })
      .catch((error) => {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      });

    return () => unsubscribe();
  },
  async create(userId, input) {
    await localFirstSubscriptionStore.enqueueCreateSubscription(userId, input);
    void localFirstSubscriptionStore.flush(userId);
  },
  async update(userId, id, input) {
    await localFirstSubscriptionStore.enqueueUpdateSubscription(userId, id, input);
    void localFirstSubscriptionStore.flush(userId);
  },
  async archive(userId, id) {
    await localFirstSubscriptionStore.enqueueArchiveSubscription(userId, id);
    void localFirstSubscriptionStore.flush(userId);
  },
  subscribeHistory(userId, subscriptionId, listener, onError) {
    let unsubscribe: () => void = () => {};

    void localFirstSubscriptionStore
      .connectHistoryFeed(userId, subscriptionId, listener, onError)
      .then((nextUnsubscribe) => {
        unsubscribe = nextUnsubscribe;
      })
      .catch((error) => {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      });

    return () => unsubscribe();
  },
  async syncHistory(userId, subscriptions) {
    await localFirstSubscriptionStore.enqueueDerivedHistorySync(userId, subscriptions);
    void localFirstSubscriptionStore.flush(userId);
  },
  async createHistoryEvent(userId, subscriptionId, event) {
    await localFirstSubscriptionStore.enqueueCreateHistoryEvent(userId, subscriptionId, event);
    void localFirstSubscriptionStore.flush(userId);
  },
  async createManualPayment(userId, subscriptionId, input) {
    await localFirstSubscriptionStore.enqueueCreateManualPayment(userId, subscriptionId, input);
    void localFirstSubscriptionStore.flush(userId);
  },
  async updateHistoryEvent(userId, subscriptionId, eventId, input) {
    await localFirstSubscriptionStore.enqueueUpdateHistoryEvent(userId, subscriptionId, eventId, input);
    void localFirstSubscriptionStore.flush(userId);
  },
  async deleteHistoryEvent(userId, subscriptionId, eventId) {
    await localFirstSubscriptionStore.enqueueDeleteHistoryEvent(userId, subscriptionId, eventId);
    void localFirstSubscriptionStore.flush(userId);
  },
};

export const retryPendingSubscriptionSync = (userId: string) =>
  localFirstSubscriptionStore.retryPending(userId);

export const subscribePendingHistoryProjection = (
  userId: string,
  subscriptionIds: string[],
  listener: (items: import("@/types/subscriptionHistory").SubscriptionHistoryEvent[]) => void,
  onError?: (error: Error) => void,
) => localFirstSubscriptionStore.connectHistoryProjection(userId, subscriptionIds, listener, onError);

export const subscribeUserStatsProjection = (
  userId: string,
  listener: (stats: UserStatsProjection) => void,
  onError?: (error: Error) => void,
) => localFirstSubscriptionStore.connectUserStatsProjection(userId, listener, onError);

export type { UserStatsProjection } from "./localFirstStore";
