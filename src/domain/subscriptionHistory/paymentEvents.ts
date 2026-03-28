import type {
  SubscriptionHistoryEvent,
  SubscriptionHistoryEventType,
} from "../../types/subscriptionHistory.ts";

export type EditablePaymentEventType = "payment_booked" | "payment_skipped_inactive";

export type EditablePaymentHistoryInput = {
  type: EditablePaymentEventType;
  amount: number;
  dueDate: string;
  notes?: string;
  bookedAt?: string;
  source?: SubscriptionHistoryEvent["source"];
};

export const isEditablePaymentEventType = (
  eventType: SubscriptionHistoryEventType,
): eventType is EditablePaymentEventType =>
  eventType === "payment_booked" || eventType === "payment_skipped_inactive";

export const buildEditablePaymentEventFields = ({
  type,
  amount,
  dueDate,
  notes,
  bookedAt = new Date().toISOString(),
  source,
}: EditablePaymentHistoryInput) => {
  const sharedFields = {
    type,
    amount,
    dueDate,
    notes,
    occurredAt: dueDate,
    effectiveDate: dueDate,
  };

  if (type === "payment_skipped_inactive") {
    return {
      ...sharedFields,
      reason: "inactive" as const,
    };
  }

  return {
    ...sharedFields,
    bookedAt,
    source: source ?? "manual",
  };
};
