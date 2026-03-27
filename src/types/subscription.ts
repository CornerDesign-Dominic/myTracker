export type BillingCycle = "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

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
