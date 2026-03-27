import { BillingCycle, SubscriptionStatus } from "@/types/subscription";

export const billingCycleOptions: Array<{ label: string; value: BillingCycle }> = [
  { label: "Monatlich", value: "monthly" },
  { label: "Jaehrlich", value: "yearly" },
  { label: "Custom", value: "custom" },
];

export const statusOptions: Array<{ label: string; value: SubscriptionStatus }> = [
  { label: "Aktiv", value: "active" },
  { label: "Pausiert", value: "paused" },
  { label: "Gekuendigt", value: "cancelled" },
];

export const defaultCurrency = "EUR";
