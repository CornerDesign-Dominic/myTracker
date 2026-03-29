import type { BillingCycle, SubscriptionInput } from "../../types/subscription.ts";
import { isDateInputValid } from "../../utils/date.ts";

export type SubscriptionFormErrorCode =
  | "required"
  | "amount"
  | "nextPaymentDate"
  | "billingCycleConfirmation"
  | "endDate";

export const shouldRequireNextPaymentConfirmation = (
  billingCycle: BillingCycle,
  confirmedBillingCycle: BillingCycle,
) => billingCycle !== confirmedBillingCycle;

export const getSubscriptionFormErrorCode = ({
  formState,
  requiresNextPaymentConfirmation,
}: {
  formState: SubscriptionInput;
  requiresNextPaymentConfirmation: boolean;
}): SubscriptionFormErrorCode | null => {
  if (!formState.name.trim() || !formState.category.trim()) {
    return "required";
  }

  if (!Number.isFinite(formState.amount) || formState.amount <= 0) {
    return "amount";
  }

  if (!isDateInputValid(formState.nextPaymentDate)) {
    return "nextPaymentDate";
  }

  if (requiresNextPaymentConfirmation) {
    return "billingCycleConfirmation";
  }

  if (
    formState.status === "cancelled" &&
    formState.endDate &&
    !isDateInputValid(formState.endDate)
  ) {
    return "endDate";
  }

  return null;
};
