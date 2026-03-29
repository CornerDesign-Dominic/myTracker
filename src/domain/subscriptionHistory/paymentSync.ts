import type {
  HistoryEventInput,
  SubscriptionHistoryAware,
  SubscriptionHistoryEvent,
} from "../../types/subscriptionHistory.ts";
import { getRecurringAnchorDay, shiftRecurringDate } from "../../utils/recurringDates.ts";
import { createPaymentEventId, hasActivePaymentEventForDueDate } from "./paymentEvents.ts";
import { parseCalendarDate } from "./schedule.ts";

type SyncAnchor = {
  dueDate: string;
  billingCycle: SubscriptionHistoryAware["billingCycle"];
};

const isDevEnvironment =
  typeof globalThis !== "undefined" &&
  "__DEV__" in globalThis &&
  Boolean((globalThis as { __DEV__?: boolean }).__DEV__);

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

const getEventCalendarDate = (
  event: Pick<SubscriptionHistoryEvent, "effectiveDate" | "occurredAt" | "createdAt">,
) => event.effectiveDate ?? event.occurredAt ?? toCalendarDay(event.createdAt) ?? "";

const getSubscriptionStatusOnDate = (
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
      const leftKey = getEventCalendarDate(left);
      const rightKey = getEventCalendarDate(right);
      return leftKey.localeCompare(rightKey);
    });

  let currentStatus =
    statusEvents.find((event) => event.type === "subscription_created")?.initialStatus ??
    subscription.status;

  statusEvents.forEach((event) => {
    const eventDate = getEventCalendarDate(event);
    if (eventDate > targetDate) {
      return;
    }

    if (event.type === "subscription_deactivated") {
      currentStatus = event.snapshot?.status ?? "paused";
    }

    if (event.type === "subscription_reactivated") {
      currentStatus = "active";
    }
  });

  const updatedAtDay = toCalendarDay(subscription.updatedAt);
  if (updatedAtDay && targetDate >= updatedAtDay) {
    return subscription.status;
  }

  return currentStatus;
};

const getBillingCycleOnDate = (
  subscription: SubscriptionHistoryAware,
  history: SubscriptionHistoryEvent[],
  targetDate: string,
) => {
  const cycleEvents = [...history]
    .filter(
      (event) => event.type === "subscription_created" || event.type === "billing_cycle_changed",
    )
    .sort((left, right) => {
      const leftKey = getEventCalendarDate(left);
      const rightKey = getEventCalendarDate(right);
      return leftKey.localeCompare(rightKey);
    });

  let currentCycle =
    cycleEvents.find((event) => event.type === "subscription_created")?.initialBillingCycle ??
    subscription.billingCycle;

  cycleEvents.forEach((event) => {
    const eventDate = getEventCalendarDate(event);
    if (eventDate > targetDate) {
      return;
    }

    if (event.type === "billing_cycle_changed") {
      currentCycle = event.nextBillingCycle ?? currentCycle;
    }
  });

  return currentCycle;
};

const getLatestActivePaymentAnchor = (
  subscription: SubscriptionHistoryAware,
  history: SubscriptionHistoryEvent[],
): SyncAnchor | null => {
  const latestPaymentEvent = [...history]
    .filter(
      (event) =>
        !event.deletedAt &&
        (event.type === "payment_booked" || event.type === "payment_skipped_inactive") &&
        !!event.dueDate,
    )
    .sort((left, right) => (right.dueDate ?? "").localeCompare(left.dueDate ?? ""))[0];

  if (!latestPaymentEvent?.dueDate) {
    return null;
  }

  return {
    dueDate: latestPaymentEvent.dueDate,
    billingCycle:
      latestPaymentEvent.billingCycleSnapshot ??
      getBillingCycleOnDate(subscription, history, latestPaymentEvent.dueDate),
  };
};

const getLatestExplicitDueDateBasis = (
  subscription: SubscriptionHistoryAware,
  history: SubscriptionHistoryEvent[],
): { anchor: SyncAnchor; anchorDate: string } | null => {
  const latestDueDateChange = [...history]
    .filter((event) => event.type === "due_date_changed" && !!event.nextNextPaymentDate)
    .sort((left, right) => getEventCalendarDate(right).localeCompare(getEventCalendarDate(left)))[0];

  if (!latestDueDateChange?.nextNextPaymentDate) {
    return null;
  }

  const anchorDate = getEventCalendarDate(latestDueDateChange);
  return {
    anchor: {
      dueDate: latestDueDateChange.nextNextPaymentDate,
      billingCycle: getBillingCycleOnDate(subscription, history, anchorDate),
    },
    anchorDate,
  };
};

const getInitialSyncAnchor = (
  subscription: SubscriptionHistoryAware,
  history: SubscriptionHistoryEvent[],
): SyncAnchor | null => {
  if (subscription.nextPaymentDate) {
    return {
      dueDate: subscription.nextPaymentDate,
      billingCycle: subscription.billingCycle,
    };
  }

  const createdEvent = history.find(
    (event) => event.type === "subscription_created" && !!event.initialNextPaymentDate,
  );

  if (createdEvent?.initialNextPaymentDate) {
    return {
      dueDate: createdEvent.initialNextPaymentDate,
      billingCycle: createdEvent.initialBillingCycle ?? subscription.billingCycle,
    };
  }

  return null;
};

const getSyncAnchor = (
  subscription: SubscriptionHistoryAware,
  history: SubscriptionHistoryEvent[],
) => {
  const latestPaymentAnchor = getLatestActivePaymentAnchor(subscription, history);
  const latestDueDateBasis = getLatestExplicitDueDateBasis(subscription, history);

  if (!latestPaymentAnchor) {
    return latestDueDateBasis?.anchor ?? getInitialSyncAnchor(subscription, history);
  }

  if (
    latestDueDateBasis &&
    latestDueDateBasis.anchorDate > latestPaymentAnchor.dueDate
  ) {
    return latestDueDateBasis.anchor;
  }

  return latestPaymentAnchor;
};

const buildScheduledDueDates = (
  createdAtDay: string,
  todayKey: string,
  syncAnchor: SyncAnchor,
) => {
  const anchorDate = parseCalendarDate(syncAnchor.dueDate);
  if (!anchorDate) {
    return [] as string[];
  }

  const dueDates: string[] = [];
  const anchorDay = getRecurringAnchorDay(anchorDate);
  let cursor = anchorDate;

  while (toCalendarDateString(cursor) < createdAtDay) {
    cursor = shiftRecurringDate(cursor, syncAnchor.billingCycle, 1, anchorDay);
  }

  while (toCalendarDateString(cursor) <= todayKey) {
    dueDates.push(toCalendarDateString(cursor));
    cursor = shiftRecurringDate(cursor, syncAnchor.billingCycle, 1, anchorDay);
  }

  return dueDates;
};

export const getMissingPaymentHistoryEvents = (
  subscription: SubscriptionHistoryAware,
  history: SubscriptionHistoryEvent[],
  today = new Date(),
) => {
  const todayKey = toCalendarDateString(today);
  const createdAtDay = toCalendarDay(subscription.createdAt);
  const latestPaymentAnchor = getLatestActivePaymentAnchor(subscription, history);
  const syncAnchor = getSyncAnchor(subscription, history);

  if (!createdAtDay || !syncAnchor) {
    return [] satisfies HistoryEventInput[];
  }

  const dueDates = buildScheduledDueDates(createdAtDay, todayKey, syncAnchor).filter(
    (dueDate) => !latestPaymentAnchor || dueDate > latestPaymentAnchor.dueDate,
  );

  return dueDates.flatMap((dueDate) => {
    if (hasActivePaymentEventForDueDate(history, dueDate)) {
      return [] satisfies HistoryEventInput[];
    }

    const statusOnDueDate = getSubscriptionStatusOnDate(subscription, history, dueDate);

    if (statusOnDueDate === "cancelled") {
      return [] satisfies HistoryEventInput[];
    }

    const eventType =
      statusOnDueDate === "active" ? "payment_booked" : "payment_skipped_inactive";

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
        id: createPaymentEventId("sync_payment"),
        subscriptionId: subscription.id,
        type: eventType,
        occurredAt: dueDate,
        effectiveDate: dueDate,
        amount: subscription.amount,
        dueDate,
        bookedAt: eventType === "payment_booked" ? dueDate : undefined,
        source: "sync",
        reason: eventType === "payment_skipped_inactive" ? "inactive" : undefined,
        billingCycleSnapshot: syncAnchor.billingCycle,
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
