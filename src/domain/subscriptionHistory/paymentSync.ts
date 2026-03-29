import type {
  SubscriptionHistoryAware,
  SubscriptionHistoryEvent,
  HistoryEventInput,
} from "../../types/subscriptionHistory.ts";

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

const getScheduledHistoryEventId = (
  type: "payment_booked" | "payment_skipped_inactive",
  dueDate: string,
) => `${type}_${dueDate}`;

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
  const dueDate = subscription.nextPaymentDate;
  const createdAtDay = toCalendarDay(subscription.createdAt);
  const suppressedDueDates = new Set(
    history.flatMap((event) => event.syncSuppressedDueDates ?? []),
  );

  if (!dueDate || !createdAtDay || dueDate > todayKey || dueDate < createdAtDay) {
    if (isDevEnvironment && dueDate) {
      console.log("[History] skipped out-of-range dueDate", {
        subscriptionId: subscription.id,
        dueDate,
        createdAtDay,
        today: todayKey,
      });
    }

    return [] satisfies HistoryEventInput[];
  }

  const eventType = isSubscriptionActiveOnDate(subscription, history, dueDate)
    ? "payment_booked"
    : "payment_skipped_inactive";
  const eventId = getScheduledHistoryEventId(eventType, dueDate);
  const alreadyExists = history.some(
    (event) => event.id === eventId && !event.deletedAt,
  );

  if (alreadyExists || suppressedDueDates.has(dueDate)) {
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
};
