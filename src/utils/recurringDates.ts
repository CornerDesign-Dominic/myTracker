import type { BillingCycle } from "../types/subscription.ts";
import { formatLocalDateInput, parseLocalDateInput } from "./date.ts";

const BILLING_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const getLastDayOfMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

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
