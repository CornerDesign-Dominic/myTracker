import { BillingCycle, Subscription, SubscriptionStatus } from "./subscription";

export type SubscriptionHistoryEventType =
  | "payment_booked"
  | "payment_skipped_inactive"
  | "subscription_deactivated"
  | "subscription_reactivated"
  | "amount_changed"
  | "billing_cycle_changed"
  | "due_date_changed"
  | "subscription_created";

export type SubscriptionHistorySnapshot = {
  amount?: number;
  billingCycle?: BillingCycle;
  nextPaymentDate?: string;
  status?: SubscriptionStatus;
};

export interface SubscriptionHistoryEvent {
  id: string;
  subscriptionId: string;
  type: SubscriptionHistoryEventType;
  createdAt: string;
  occurredAt?: string;
  effectiveDate?: string;
  notes?: string;
  metadata?: Record<string, string | number | boolean | null>;
  snapshot?: SubscriptionHistorySnapshot;
  amount?: number;
  dueDate?: string;
  bookedAt?: string;
  reason?: "inactive";
  billingCycleSnapshot?: BillingCycle;
  previousAmount?: number;
  nextAmount?: number;
  previousBillingCycle?: BillingCycle;
  nextBillingCycle?: BillingCycle;
  previousNextPaymentDate?: string;
  nextNextPaymentDate?: string;
  initialAmount?: number;
  initialBillingCycle?: BillingCycle;
  initialNextPaymentDate?: string;
  initialStatus?: SubscriptionStatus;
}

export type HistoryEventInput = Omit<SubscriptionHistoryEvent, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

export type HistorySyncSummary = {
  skippedPaymentsCount: number;
  skippedPaymentsAmount: number;
};

export type SubscriptionHistoryPresentation = {
  id: string;
  title: string;
  subtitle?: string;
  amountLabel?: string;
  dateLabel: string;
  canEdit: boolean;
  occurredAt: string;
};

export type SubscriptionHistoryAware = Pick<
  Subscription,
  | "id"
  | "amount"
  | "billingCycle"
  | "nextPaymentDate"
  | "status"
  | "createdAt"
  | "updatedAt"
>;
