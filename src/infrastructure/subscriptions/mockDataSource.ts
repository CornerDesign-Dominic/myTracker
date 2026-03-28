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
};
