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

export const isPaymentHistoryEvent = (
  event: Pick<SubscriptionHistoryEvent, "type">,
): event is SubscriptionHistoryEvent & { type: EditablePaymentEventType } =>
  isEditablePaymentEventType(event.type);

export const createPaymentEventId = (prefix = "payment") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const hasActivePaymentEventForDueDate = (
  history: SubscriptionHistoryEvent[],
  dueDate: string,
  excludeEventId?: string,
) =>
  history.some(
    (event) =>
      event.id !== excludeEventId &&
      !event.deletedAt &&
      isPaymentHistoryEvent(event) &&
      event.dueDate === dueDate,
  );

export const isDueDateSuppressedForAutoSync = (
  history: SubscriptionHistoryEvent[],
  dueDate: string,
) =>
  history.some(
    (event) =>
      (isPaymentHistoryEvent(event) && !!event.deletedAt && event.dueDate === dueDate) ||
      (event.syncSuppressedDueDates?.includes(dueDate) ?? false),
  );

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

export const buildUpdatedPaymentEvent = ({
  currentEvent,
  input,
  now,
}: {
  currentEvent: SubscriptionHistoryEvent & { type: EditablePaymentEventType };
  input: EditablePaymentHistoryInput;
  now: string;
}) => ({
  ...buildEditablePaymentEventFields({
    ...input,
    bookedAt: input.type === "payment_booked" ? input.bookedAt ?? now : undefined,
    source: currentEvent.source ?? "manual",
  }),
  updatedAt: now,
  deletedAt: undefined,
});
