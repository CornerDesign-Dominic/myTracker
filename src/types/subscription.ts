export type BillingCycle = "monthly" | "yearly" | "custom";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

export interface Subscription {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  nextPaymentDate: string;
  cancellationDeadline?: string;
  status: SubscriptionStatus;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface SubscriptionInput {
  name: string;
  category: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  nextPaymentDate: string;
  cancellationDeadline?: string;
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
