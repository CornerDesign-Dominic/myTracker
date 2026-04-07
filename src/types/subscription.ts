export type BillingCycle = "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";
export type EntitySyncStatus =
  | "synced"
  | "pending"
  | "syncing"
  | "syncFailed"
  | "retryPending"
  | "localOnly";

export interface EntitySyncState {
  status: EntitySyncStatus;
  isPending: boolean;
  isSyncing: boolean;
  hasError: boolean;
  localOnly: boolean;
  retryPending: boolean;
  lastError?: string;
}

export interface Subscription {
  id: string;
  name: string;
  category: string;
  amount: number;
  billingCycle: BillingCycle;
  nextPaymentDate: string;
  status: SubscriptionStatus;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  syncState?: EntitySyncState;
}

export interface SubscriptionInput {
  name: string;
  category: string;
  amount: number;
  billingCycle: BillingCycle;
  nextPaymentDate: string;
  status: SubscriptionStatus;
  endDate?: string;
  notes?: string;
}

export interface SubscriptionMetrics {
  monthlyTotal: number;
  yearlyTotal: number;
  activeCount: number;
  byCategory: Array<{
    category: string;
    monthlyTotal: number;
    yearlyTotal: number;
  }>;
  nextPayments: Subscription[];
  mostExpensive?: Subscription;
}
