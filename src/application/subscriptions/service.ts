import { SubscriptionInput } from "@/types/subscription";

import {
  SubscriptionDataSource,
  SubscriptionErrorListener,
  SubscriptionListListener,
  SubscriptionUnsubscribe,
} from "@/infrastructure/subscriptions/types";

export interface SubscriptionService {
  observeUserSubscriptions: (
    userId: string,
    listener: SubscriptionListListener,
    onError?: SubscriptionErrorListener,
  ) => SubscriptionUnsubscribe;
  createForUser: (userId: string, input: SubscriptionInput) => Promise<void>;
  updateForUser: (userId: string, id: string, input: Partial<SubscriptionInput>) => Promise<void>;
  archiveForUser: (userId: string, id: string) => Promise<void>;
}

export const createSubscriptionService = (
  repository: SubscriptionDataSource,
): SubscriptionService => ({
  observeUserSubscriptions(userId, listener, onError) {
    return repository.subscribe(userId, listener, onError);
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
});
