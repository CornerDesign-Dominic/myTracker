import type { BillingCycle } from "../types/subscription.ts";
import { formatLocalDateInput, parseLocalDateInput } from "./date.ts";

const BILLING_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const getLastDayOfMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

const parseFlexibleDate = (value?: Date | string | null) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const localDate = parseLocalDateInput(value);
  if (localDate) {
    return localDate;
  }

  const fallbackDate = new Date(value);
  if (Number.isNaN(fallbackDate.getTime())) {
    return null;
  }

  return new Date(
    fallbackDate.getFullYear(),
    fallbackDate.getMonth(),
    fallbackDate.getDate(),
  );
};

const getMonthDifference = (from: Date, to: Date) =>
  (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

export const getRecurringAnchorDay = (value: Date | string) => {
  if (value instanceof Date) {
    return value.getDate();
  }

  return parseLocalDateInput(value)?.getDate() ?? 1;
};

export const shiftRecurringDate = (
  value: Date | string,
  billingCycle: BillingCycle,
  stepCount = 1,
  anchorDay = getRecurringAnchorDay(value),
) => {
  const baseDate =
    value instanceof Date ? value : parseLocalDateInput(value) ?? new Date(value);

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error("Invalid recurring date.");
  }

  const monthsToShift = BILLING_MONTHS[billingCycle] * stepCount;
  const targetYear = baseDate.getFullYear();
  const targetMonthIndex = baseDate.getMonth() + monthsToShift;
  const targetDate = new Date(targetYear, targetMonthIndex, 1);
  const resolvedDay = Math.min(
    anchorDay,
    getLastDayOfMonth(targetDate.getFullYear(), targetDate.getMonth()),
  );

  return new Date(targetDate.getFullYear(), targetDate.getMonth(), resolvedDay);
};

export const shiftRecurringDateInput = (
  value: string,
  billingCycle: BillingCycle,
  stepCount = 1,
  anchorDay = getRecurringAnchorDay(value),
) => formatLocalDateInput(shiftRecurringDate(value, billingCycle, stepCount, anchorDay));

export const getRecurringDueDateForMonth = ({
  anchorDate,
  billingCycle,
  targetMonth,
  startsOn,
  endsOn,
  anchorDay = getRecurringAnchorDay(anchorDate),
}: {
  anchorDate: Date | string;
  billingCycle: BillingCycle;
  targetMonth: Date | string;
  startsOn?: Date | string | null;
  endsOn?: Date | string | null;
  anchorDay?: number;
}) => {
  const parsedAnchorDate = parseFlexibleDate(anchorDate);
  const parsedTargetMonth = parseFlexibleDate(targetMonth);
  const parsedStartsOn = parseFlexibleDate(startsOn);
  const parsedEndsOn = parseFlexibleDate(endsOn);

  if (!parsedAnchorDate || !parsedTargetMonth) {
    return null;
  }

  const monthDifference = getMonthDifference(parsedAnchorDate, parsedTargetMonth);
  const billingMonths = BILLING_MONTHS[billingCycle];

  if (monthDifference % billingMonths !== 0) {
    return null;
  }

  const resolvedDay = Math.min(
    anchorDay,
    getLastDayOfMonth(parsedTargetMonth.getFullYear(), parsedTargetMonth.getMonth()),
  );
  const dueDate = new Date(
    parsedTargetMonth.getFullYear(),
    parsedTargetMonth.getMonth(),
    resolvedDay,
  );

  if (parsedStartsOn && dueDate < parsedStartsOn) {
    return null;
  }

  if (parsedEndsOn && dueDate > parsedEndsOn) {
    return null;
  }

  return dueDate;
};

export const getRecurringDueDateInputForMonth = (params: {
  anchorDate: Date | string;
  billingCycle: BillingCycle;
  targetMonth: Date | string;
  startsOn?: Date | string | null;
  endsOn?: Date | string | null;
  anchorDay?: number;
}) => {
  const recurringDueDate = getRecurringDueDateForMonth(params);
  return recurringDueDate ? formatLocalDateInput(recurringDueDate) : null;
};
