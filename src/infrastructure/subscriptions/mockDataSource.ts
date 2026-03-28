import { mockSubscriptionStore } from "@/services/storage/mockSubscriptionStore";

import { SubscriptionDataSource } from "./types";

export const mockSubscriptionDataSource: SubscriptionDataSource = {
  subscribe(_userId, listener) {
    return mockSubscriptionStore.subscribe(listener);
  },
  async create(_userId, input) {
    await mockSubscriptionStore.create(input);
  },
  async update(_userId, id, input) {
    await mockSubscriptionStore.update(id, input);
  },
  async archive(_userId, id) {
    await mockSubscriptionStore.archive(id);
  },
  subscribeHistory(_userId, subscriptionId, listener) {
    return mockSubscriptionStore.subscribeHistory(subscriptionId, listener);
  },
  async syncHistory(_userId, subscriptions) {
    for (const subscription of subscriptions) {
      await mockSubscriptionStore.syncHistory(subscription);
    }
  },
  async createHistoryEvent(_userId, subscriptionId, event) {
    await mockSubscriptionStore.createHistoryEvent(subscriptionId, event);
  },
  async createManualPayment(_userId, subscriptionId, input) {
    await mockSubscriptionStore.createManualPayment(subscriptionId, input);
  },
  async updateHistoryEvent(_userId, subscriptionId, eventId, input) {
    await mockSubscriptionStore.updateHistoryEvent(subscriptionId, eventId, input);
  },
  async deleteHistoryEvent(_userId, subscriptionId, eventId) {
    await mockSubscriptionStore.deleteHistoryEvent(subscriptionId, eventId);
  },
};
