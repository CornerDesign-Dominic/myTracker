import { DevelopmentRange } from "@/domain/subscriptions/statistics";
import { Subscription } from "@/types/subscription";
import { SubscriptionHistoryEvent } from "@/types/subscriptionHistory";
import { parseLocalDateInput } from "@/utils/date";
import { getRecurringDueDateForMonth } from "@/utils/recurringDates";

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

export const filterSkippedHistoryEventsForYear = (
  history: SubscriptionHistoryEvent[],
  year: number,
) =>
  history.filter((event) => {
    if (event.type !== "payment_skipped_inactive") {
      return false;
    }

    const dueDate = parseDueDate(event.dueDate);
    return dueDate ? dueDate.getFullYear() === year : false;
  });

export const filterSkippedHistoryEventsForMonth = (
  history: SubscriptionHistoryEvent[],
  year: number,
  monthIndex: number,
) =>
  history.filter((event) => {
    if (event.type !== "payment_skipped_inactive") {
      return false;
    }

    const dueDate = parseDueDate(event.dueDate);
    return dueDate
      ? dueDate.getFullYear() === year && dueDate.getMonth() === monthIndex
      : false;
  });

export const getSavedAmountForYear = (
  history: SubscriptionHistoryEvent[],
  year: number,
) => getTotalSavedAmount(filterSkippedHistoryEventsForYear(history, year));

export const getSavedAmountForMonth = (
  history: SubscriptionHistoryEvent[],
  year: number,
  monthIndex: number,
) => getTotalSavedAmount(filterSkippedHistoryEventsForMonth(history, year, monthIndex));

export const getSavedAmountForPreviousMonth = (
  history: SubscriptionHistoryEvent[],
  now = new Date(),
) => {
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return getTotalSavedAmount(
    filterSkippedHistoryEventsForMonth(
      history,
      previousMonth.getFullYear(),
      previousMonth.getMonth(),
    ),
  );
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

const endOfYear = (date: Date) =>
  new Date(date.getFullYear(), 11, 31);

const getMonthStartsInRange = (start: Date, end: Date) => {
  const months: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
};

const createSkippedLookup = (history: SubscriptionHistoryEvent[]) => {
  const lookup = new Set<string>();

  history.forEach((event) => {
    if (event.type !== "payment_skipped_inactive" || event.deletedAt || !event.dueDate) {
      return;
    }

    lookup.add(`${event.subscriptionId}:${event.dueDate}`);
  });

  return lookup;
};

const getProjectedSkippedAmountForRange = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  start: Date,
  end: Date,
) => {
  const skippedLookup = createSkippedLookup(history);
  const rangeMonths = getMonthStartsInRange(start, end);
  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(end);

  return subscriptions
    .filter((subscription) => subscription.status === "paused" && !subscription.archivedAt)
    .reduce((sum, subscription) => {
      return (
        sum +
        rangeMonths.reduce((subscriptionSum, monthDate) => {
          const dueDate = getRecurringDueDateForMonth({
            anchorDate: subscription.nextPaymentDate,
            billingCycle: subscription.billingCycle,
            targetMonth: monthDate,
            startsOn: subscription.createdAt,
            endsOn: subscription.endDate ?? null,
          });

          if (!dueDate) {
            return subscriptionSum;
          }

          const dueDay = startOfDay(dueDate);
          if (dueDay < rangeStart || dueDay > rangeEnd) {
            return subscriptionSum;
          }

          const dueDateKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}-${String(dueDate.getDate()).padStart(2, "0")}`;
          if (skippedLookup.has(`${subscription.id}:${dueDateKey}`)) {
            return subscriptionSum;
          }

          return subscriptionSum + subscription.amount;
        }, 0)
      );
    }, 0);
};

export const buildSavingsSummary = (
  subscriptions: Subscription[],
  history: SubscriptionHistoryEvent[],
  now = new Date(),
) => {
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;
  const currentMonthIndex = now.getMonth();
  const previousMonth = new Date(currentYear, currentMonthIndex - 1, 1);

  const currentYearActual = getSavedAmountForYear(history, currentYear);
  const previousYearActual = getSavedAmountForYear(history, previousYear);
  const currentMonthActual = getSavedAmountForMonth(history, currentYear, currentMonthIndex);
  const previousMonthActual = getSavedAmountForMonth(
    history,
    previousMonth.getFullYear(),
    previousMonth.getMonth(),
  );

  const currentMonthProjected =
    currentMonthActual +
    getProjectedSkippedAmountForRange(subscriptions, history, now, endOfMonth(now));
  const currentYearProjected =
    currentYearActual +
    getProjectedSkippedAmountForRange(subscriptions, history, now, endOfYear(now));

  return {
    currentYearActual,
    previousYearActual,
    currentMonthActual,
    previousMonthActual,
    currentMonthProjected,
    currentYearProjected,
  };
};
