import type {
  SubscriptionHistoryAware,
  SubscriptionHistoryEvent,
  HistoryEventInput,
} from "../../types/subscriptionHistory.ts";
import {
  getPaymentEventId,
  hasActivePaymentEventForDueDate,
  isDueDateSuppressedForAutoSync,
} from "./paymentEvents.ts";
import { getRecurringAnchorDay, shiftRecurringDate } from "../../utils/recurringDates.ts";
import { parseCalendarDate } from "./schedule.ts";

const toCalendarDateString = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const toCalendarDay = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toCalendarDateString(parsed);
};

const isDevEnvironment =
  typeof globalThis !== "undefined" &&
  "__DEV__" in globalThis &&
  Boolean((globalThis as { __DEV__?: boolean }).__DEV__);

const isSubscriptionActiveOnDate = (
  subscription: SubscriptionHistoryAware,
  history: SubscriptionHistoryEvent[],
  targetDate: string,
) => {
  const statusEvents = [...history]
    .filter(
      (event) =>
        event.type === "subscription_created" ||
        event.type === "subscription_deactivated" ||
        event.type === "subscription_reactivated",
    )
    .sort((left, right) => {
      const leftKey = left.effectiveDate ?? left.occurredAt ?? left.createdAt;
      const rightKey = right.effectiveDate ?? right.occurredAt ?? right.createdAt;
      return leftKey.localeCompare(rightKey);
    });

  let currentStatus =
    statusEvents.find((event) => event.type === "subscription_created")?.initialStatus ?? "active";

  statusEvents.forEach((event) => {
    const eventDate = event.effectiveDate ?? event.occurredAt ?? event.createdAt;
    if (eventDate > targetDate) {
      return;
    }

    if (event.type === "subscription_deactivated") {
      currentStatus = "paused";
    }

    if (event.type === "subscription_reactivated") {
      currentStatus = "active";
    }
  });

  return currentStatus === "active";
};

export const getMissingPaymentHistoryEvents = (
  subscription: SubscriptionHistoryAware,
  history: SubscriptionHistoryEvent[],
  today = new Date(),
) => {
  const todayKey = toCalendarDateString(today);
  const createdAtDay = toCalendarDay(subscription.createdAt);
  const anchorDate = parseCalendarDate(subscription.nextPaymentDate);

  if (!createdAtDay || !anchorDate) {
    return [] satisfies HistoryEventInput[];
  }

  const dueDates: string[] = [];
  const anchorDay = getRecurringAnchorDay(anchorDate);
  let cursor = anchorDate;

  while (toCalendarDateString(cursor) < createdAtDay) {
    cursor = shiftRecurringDate(cursor, subscription.billingCycle, 1, anchorDay);
  }

  while (toCalendarDateString(cursor) <= todayKey) {
    dueDates.push(toCalendarDateString(cursor));
    cursor = shiftRecurringDate(cursor, subscription.billingCycle, 1, anchorDay);
  }

  return dueDates.flatMap((dueDate) => {
    if (isDueDateSuppressedForAutoSync(history, dueDate)) {
      return [] satisfies HistoryEventInput[];
    }

    if (hasActivePaymentEventForDueDate(history, dueDate)) {
      return [] satisfies HistoryEventInput[];
    }

    const eventType = isSubscriptionActiveOnDate(subscription, history, dueDate)
      ? "payment_booked"
      : "payment_skipped_inactive";
    const eventId = getPaymentEventId(eventType, dueDate);

    if (isDevEnvironment && dueDate > todayKey) {
      console.log("[History] skipped future dueDate", {
        subscriptionId: subscription.id,
        dueDate,
        today: todayKey,
      });
      return [] satisfies HistoryEventInput[];
    }

    return [
      {
        id: eventId,
        subscriptionId: subscription.id,
        type: eventType,
        occurredAt: dueDate,
        effectiveDate: dueDate,
        amount: subscription.amount,
        dueDate,
        bookedAt: eventType === "payment_booked" ? dueDate : undefined,
        source: "sync",
        reason: eventType === "payment_skipped_inactive" ? "inactive" : undefined,
        billingCycleSnapshot: subscription.billingCycle,
        snapshot: {
          amount: subscription.amount,
          billingCycle: subscription.billingCycle,
          nextPaymentDate: subscription.nextPaymentDate,
          status: subscription.status,
        },
      } satisfies HistoryEventInput,
    ];
  });
};
