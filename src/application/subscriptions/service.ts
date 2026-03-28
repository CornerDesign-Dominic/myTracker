import { Subscription, SubscriptionInput } from "@/types/subscription";
import { HistoryEventInput } from "@/types/subscriptionHistory";

import {
  SubscriptionDataSource,
  SubscriptionErrorListener,
  SubscriptionHistoryListener,
  SubscriptionListListener,
  SubscriptionUnsubscribe,
} from "@/infrastructure/subscriptions/types";

export interface SubscriptionService {
  observeUserSubscriptions: (
    userId: string,
    listener: SubscriptionListListener,
    onError?: SubscriptionErrorListener,
  ) => SubscriptionUnsubscribe;
  observeSubscriptionHistory: (
    userId: string,
    subscriptionId: string,
    listener: SubscriptionHistoryListener,
    onError?: SubscriptionErrorListener,
  ) => SubscriptionUnsubscribe;
  createForUser: (userId: string, input: SubscriptionInput) => Promise<void>;
  updateForUser: (userId: string, id: string, input: Partial<SubscriptionInput>) => Promise<void>;
  archiveForUser: (userId: string, id: string) => Promise<void>;
  syncHistoryForUser: (userId: string, subscriptions: Subscription[]) => Promise<void>;
  createHistoryEventForUser: (
    userId: string,
    subscriptionId: string,
    event: HistoryEventInput,
  ) => Promise<void>;
}

export const createSubscriptionService = (
  repository: SubscriptionDataSource,
): SubscriptionService => ({
  observeUserSubscriptions(userId, listener, onError) {
    return repository.subscribe(userId, listener, onError);
  },
  observeSubscriptionHistory(userId, subscriptionId, listener, onError) {
    return repository.subscribeHistory(userId, subscriptionId, listener, onError);
  },
  createForUser(userId, input) {
    return repository.create(userId, input);
  },
  updateForUser(userId, id, input) {
    return repository.update(userId, id, input);
  },
  archiveForUser(userId, id) {
    return repository.archive(userId, id);
  },
  syncHistoryForUser(userId, subscriptions) {
    return repository.syncHistory(userId, subscriptions);
  },
  createHistoryEventForUser(userId, subscriptionId, event) {
    return repository.createHistoryEvent(userId, subscriptionId, event);
  },
});
