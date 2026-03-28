import { Subscription, SubscriptionInput } from "@/types/subscription";

export type SubscriptionListListener = (subscriptions: Subscription[]) => void;
export type SubscriptionErrorListener = (error: Error) => void;
export type SubscriptionUnsubscribe = () => void;

export interface SubscriptionDataSource {
  subscribe: (
    userId: string,
    listener: SubscriptionListListener,
    onError?: SubscriptionErrorListener,
  ) => SubscriptionUnsubscribe;
  create: (userId: string, input: SubscriptionInput) => Promise<void>;
  update: (userId: string, id: string, input: Partial<SubscriptionInput>) => Promise<void>;
  archive: (userId: string, id: string) => Promise<void>;
}
