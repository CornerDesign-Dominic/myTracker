import { Subscription, SubscriptionInput } from "@/types/subscription";
import { HistoryEventInput, SubscriptionHistoryEvent } from "@/types/subscriptionHistory";

export type SubscriptionListListener = (subscriptions: Subscription[]) => void;
export type SubscriptionErrorListener = (error: Error) => void;
export type SubscriptionUnsubscribe = () => void;
export type SubscriptionHistoryListener = (history: SubscriptionHistoryEvent[]) => void;

export interface SubscriptionDataSource {
  subscribe: (
    userId: string,
    listener: SubscriptionListListener,
    onError?: SubscriptionErrorListener,
  ) => SubscriptionUnsubscribe;
  create: (userId: string, input: SubscriptionInput) => Promise<void>;
  update: (userId: string, id: string, input: Partial<SubscriptionInput>) => Promise<void>;
  archive: (userId: string, id: string) => Promise<void>;
  subscribeHistory: (
    userId: string,
    subscriptionId: string,
    listener: SubscriptionHistoryListener,
    onError?: SubscriptionErrorListener,
  ) => SubscriptionUnsubscribe;
  syncHistory: (userId: string, subscriptions: Subscription[]) => Promise<void>;
  createHistoryEvent: (
    userId: string,
    subscriptionId: string,
    event: HistoryEventInput,
  ) => Promise<void>;
  createManualPayment: (
    userId: string,
    subscriptionId: string,
    input: {
      amount: number;
      dueDate: string;
      notes?: string;
    },
  ) => Promise<void>;
  updateHistoryEvent: (
    userId: string,
    subscriptionId: string,
    eventId: string,
    input: {
      amount: number;
      dueDate: string;
      notes?: string;
    },
  ) => Promise<void>;
  deleteHistoryEvent: (
    userId: string,
    subscriptionId: string,
    eventId: string,
  ) => Promise<void>;
}
