import { TranslationKey } from "@/i18n/translations";
import { BillingCycle, SubscriptionStatus } from "@/types/subscription";

export const billingCycleOptions: Array<{ labelKey: TranslationKey; value: BillingCycle }> = [
  { labelKey: "subscription.billing_monthly", value: "monthly" },
  { labelKey: "subscription.billing_yearly", value: "yearly" },
  { labelKey: "subscription.billing_custom", value: "custom" },
];

export const statusOptions: Array<{ labelKey: TranslationKey; value: SubscriptionStatus }> = [
  { labelKey: "subscription.status_active", value: "active" },
  { labelKey: "subscription.status_paused", value: "paused" },
  { labelKey: "subscription.status_cancelled", value: "cancelled" },
];

export const defaultCurrency = "EUR";
