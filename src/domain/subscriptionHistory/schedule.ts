import { BillingCycle } from "@/types/subscription";
import { SubscriptionHistoryAware, SubscriptionHistoryEvent } from "@/types/subscriptionHistory";
import { formatLocalDateInput, parseLocalDateInput } from "@/utils/date";
import { getRecurringAnchorDay, shiftRecurringDate } from "@/utils/recurringDates";

export const addBillingMonths = (
  value: Date,
  billingCycle: BillingCycle,
  amount = 1,
  anchorDay = value.getDate(),
) => shiftRecurringDate(value, billingCycle, amount, anchorDay);

export const parseCalendarDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const localDate = parseLocalDateInput(value);
  if (localDate) {
    return localDate;
  }

  const isoDate = new Date(value);
  if (Number.isNaN(isoDate.getTime())) {
    return null;
  }

  return new Date(isoDate.getFullYear(), isoDate.getMonth(), isoDate.getDate());
};

export const toCalendarDateString = (value: Date) => formatLocalDateInput(value);

export const isSameCalendarDay = (left: string, right: string) => left === right;

export const getScheduledDueDatesUntil = (
  subscription: SubscriptionHistoryAware,
  untilDate: Date,
) => {
  const dueDates: string[] = [];
  const anchor = parseCalendarDate(subscription.nextPaymentDate);
  const createdAtDate = parseCalendarDate(subscription.createdAt);
  const untilDay = toCalendarDateString(untilDate);

  if (!anchor || !createdAtDate) {
    return dueDates;
  }

  let cursor = anchor;
  const anchorDay = getRecurringAnchorDay(anchor);
  const earliestAllowed = createdAtDate;

  while (cursor >= earliestAllowed) {
    const dueDate = toCalendarDateString(cursor);
    if (dueDate <= untilDay) {
      dueDates.push(dueDate);
    }

    cursor = addBillingMonths(cursor, subscription.billingCycle, -1, anchorDay);
  }

  return dueDates.reverse();
};

export const isSubscriptionActiveOnDate = (
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

  let currentStatus = statusEvents.find((event) => event.type === "subscription_created")?.initialStatus ?? "active";

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

  const updatedAtDate = toCalendarDateString(parseCalendarDate(subscription.updatedAt) ?? new Date());

  if (targetDate >= updatedAtDate) {
    return subscription.status === "active";
  }

  return currentStatus === "active";
};

export const getScheduledHistoryEventId = (
  type: "payment_booked" | "payment_skipped_inactive",
  dueDate: string,
) => `${type}_${dueDate}`;
