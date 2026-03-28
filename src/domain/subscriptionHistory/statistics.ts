import { DevelopmentRange } from "@/domain/subscriptions/statistics";
import { SubscriptionHistoryEvent } from "@/types/subscriptionHistory";
import { parseLocalDateInput } from "@/utils/date";

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const parseDueDate = (value?: string) => {
  if (!value) {
    return null;
  }

  return parseLocalDateInput(value);
};

const getAllRangeStart = (history: SubscriptionHistoryEvent[], fallback: Date) => {
  const dates = history
    .map((event) => parseDueDate(event.dueDate))
    .filter((value): value is Date => value instanceof Date);

  if (dates.length === 0) {
    return startOfMonth(fallback);
  }

  return startOfMonth(
    dates.reduce((earliest, current) => (current < earliest ? current : earliest)),
  );
};

export const getHistoryRangeStart = (
  range: DevelopmentRange,
  history: SubscriptionHistoryEvent[],
  now = new Date(),
) => {
  const currentMonth = startOfMonth(now);

  if (range === "all") {
    return getAllRangeStart(history, currentMonth);
  }

  return new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (range - 1), 1);
};

export const filterSkippedHistoryEventsByRange = (
  history: SubscriptionHistoryEvent[],
  range: DevelopmentRange,
  now = new Date(),
) => {
  const rangeStart = getHistoryRangeStart(range, history, now);
  const rangeEnd = now;

  return history.filter((event) => {
    if (event.type !== "payment_skipped_inactive") {
      return false;
    }

    const dueDate = parseDueDate(event.dueDate);
    if (!dueDate) {
      return false;
    }

    return dueDate >= rangeStart && dueDate <= rangeEnd;
  });
};

export const getTotalSavedAmount = (history: SubscriptionHistoryEvent[]) =>
  history.reduce((sum, event) => sum + (event.amount ?? 0), 0);

export const getTotalSkippedPayments = (history: SubscriptionHistoryEvent[]) => history.length;
