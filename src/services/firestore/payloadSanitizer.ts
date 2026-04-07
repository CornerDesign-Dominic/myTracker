import { Subscription, SubscriptionInput } from "@/types/subscription";
import { HistoryEventInput, SubscriptionHistoryEvent } from "@/types/subscriptionHistory";

const removeUndefinedDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => removeUndefinedDeep(entry))
      .filter((entry) => entry !== undefined);
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key, entryValue]) => key !== "syncState" && entryValue !== undefined)
        .map(([key, entryValue]) => [key, removeUndefinedDeep(entryValue)])
        .filter(([, entryValue]) => entryValue !== undefined),
    );
  }

  return value;
};

export const sanitizeHistoryEventForFirestore = (
  event: HistoryEventInput | SubscriptionHistoryEvent,
) => removeUndefinedDeep(event) as HistoryEventInput;

export const sanitizeSubscriptionInputForFirestore = (
  input: Partial<SubscriptionInput> | SubscriptionInput | Subscription,
) => removeUndefinedDeep(input) as Partial<SubscriptionInput>;
