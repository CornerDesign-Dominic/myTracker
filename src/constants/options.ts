import { TranslationKey } from "@/i18n/translations";
import { BillingCycle, SubscriptionStatus } from "@/types/subscription";

export const billingCycleOptions: Array<{ labelKey: TranslationKey; value: BillingCycle }> = [
  { labelKey: "subscription.billing_monthly", value: "monthly" },
  { labelKey: "subscription.billing_quarterly", value: "quarterly" },
  { labelKey: "subscription.billing_yearly", value: "yearly" },
];

export const statusOptions: Array<{ labelKey: TranslationKey; value: SubscriptionStatus }> = [
  { labelKey: "subscription.status_active", value: "active" },
  { labelKey: "subscription.status_paused", value: "paused" },
  { labelKey: "subscription.status_cancelled", value: "cancelled" },
];

export const defaultCurrency = "EUR";
