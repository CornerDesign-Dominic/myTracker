import { translations, type AppLanguage } from "../../i18n/translations.ts";
import type {
  HistoryEventInput,
  HistorySyncSummary,
  SubscriptionHistoryAware,
  SubscriptionHistoryEvent,
  SubscriptionHistoryPresentation,
} from "../../types/subscriptionHistory.ts";
import { formatCurrency } from "../../utils/currency.ts";
import { formatDate } from "../../utils/date.ts";

import { parseCalendarDate, toCalendarDateString } from "./schedule.ts";
import { getMissingPaymentHistoryEvents } from "./paymentSync.ts";
import { isEditablePaymentEventType } from "./paymentEvents.ts";
export { getMissingPaymentHistoryEvents } from "./paymentSync.ts";

const getEventDate = (
  event: Pick<SubscriptionHistoryEvent, "effectiveDate" | "occurredAt" | "createdAt">,
) => event.effectiveDate ?? event.occurredAt ?? event.createdAt;

const toSortableTimestamp = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getEventSortTimestamp = (
  event: Pick<
    SubscriptionHistoryEvent,
    "updatedAt" | "createdAt" | "effectiveDate" | "occurredAt"
  >,
) =>
  toSortableTimestamp(event.updatedAt) ??
  toSortableTimestamp(event.createdAt) ??
  toSortableTimestamp(event.occurredAt) ??
  toSortableTimestamp(event.effectiveDate) ??
  Number.NEGATIVE_INFINITY;

export const buildCreatedEvent = (
  subscriptionId: string,
  subscription: SubscriptionHistoryAware,
): HistoryEventInput => ({
  id: `subscription_created_${subscriptionId}`,
  subscriptionId,
  type: "subscription_created",
  occurredAt: toCalendarDateString(parseCalendarDate(subscription.createdAt) ?? new Date()),
  effectiveDate: toCalendarDateString(parseCalendarDate(subscription.createdAt) ?? new Date()),
  initialAmount: subscription.amount,
  initialBillingCycle: subscription.billingCycle,
  initialNextPaymentDate: subscription.nextPaymentDate,
  initialStatus: subscription.status,
  snapshot: {
    amount: subscription.amount,
    billingCycle: subscription.billingCycle,
    nextPaymentDate: subscription.nextPaymentDate,
    status: subscription.status,
  },
});

export const buildChangeEvents = (
  previous: SubscriptionHistoryAware,
  next: SubscriptionHistoryAware,
  effectiveDate: string,
): HistoryEventInput[] => {
  const events: HistoryEventInput[] = [];

  if (previous.amount !== next.amount) {
    events.push({
      subscriptionId: next.id,
      type: "amount_changed",
      effectiveDate,
      previousAmount: previous.amount,
      nextAmount: next.amount,
      snapshot: {
        amount: next.amount,
      },
    });
  }

  if (previous.billingCycle !== next.billingCycle) {
    events.push({
      subscriptionId: next.id,
      type: "billing_cycle_changed",
      effectiveDate,
      previousBillingCycle: previous.billingCycle,
      nextBillingCycle: next.billingCycle,
      snapshot: {
        billingCycle: next.billingCycle,
      },
    });
  }

  if (previous.nextPaymentDate !== next.nextPaymentDate) {
    events.push({
      subscriptionId: next.id,
      type: "due_date_changed",
      effectiveDate,
      previousNextPaymentDate: previous.nextPaymentDate,
      nextNextPaymentDate: next.nextPaymentDate,
      snapshot: {
        nextPaymentDate: next.nextPaymentDate,
      },
    });
  }

  const wasActive = previous.status === "active";
  const isActive = next.status === "active";

  if (wasActive && !isActive) {
    events.push({
      subscriptionId: next.id,
      type: "subscription_deactivated",
      effectiveDate,
      snapshot: {
        status: next.status,
      },
    });
  }

  if (!wasActive && isActive) {
    events.push({
      subscriptionId: next.id,
      type: "subscription_reactivated",
      effectiveDate,
      snapshot: {
        status: next.status,
      },
    });
  }

  return events;
};

export const getHistorySyncSummary = (
  history: SubscriptionHistoryEvent[],
): HistorySyncSummary =>
  history
    .filter((event) => event.type === "payment_skipped_inactive")
    .reduce(
      (summary, event) => ({
        skippedPaymentsCount: summary.skippedPaymentsCount + 1,
        skippedPaymentsAmount: summary.skippedPaymentsAmount + (event.amount ?? 0),
      }),
      {
        skippedPaymentsCount: 0,
        skippedPaymentsAmount: 0,
      } satisfies HistorySyncSummary,
    );

export const sortHistoryNewestFirst = (history: SubscriptionHistoryEvent[]) =>
  [...history].sort((left, right) => {
    const timestampDifference = getEventSortTimestamp(right) - getEventSortTimestamp(left);

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    const createdAtDifference =
      (toSortableTimestamp(right.createdAt) ?? Number.NEGATIVE_INFINITY) -
      (toSortableTimestamp(left.createdAt) ?? Number.NEGATIVE_INFINITY);
    if (createdAtDifference !== 0) {
      return createdAtDifference;
    }

    const effectiveDateDifference = getEventDate(right).localeCompare(getEventDate(left));
    if (effectiveDateDifference !== 0) {
      return effectiveDateDifference;
    }

    return right.id.localeCompare(left.id);
  });

const translateHistory = (
  language: AppLanguage,
  key: string,
  variables?: Record<string, string | number | undefined>,
) => {
  const historyTranslations = translations[language]?.history as Record<string, unknown> | undefined;
  const template = historyTranslations?.[key];
  const text = typeof template === "string" ? template : key;

  return Object.entries(variables ?? {}).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value ?? "")),
    text,
  );
};

const translateBillingCycle = (language: AppLanguage, cycle?: string) => {
  if (!cycle) {
    return undefined;
  }

  const subscriptionTranslations = translations[language]?.subscription as
    | Record<string, unknown>
    | undefined;
  const template = subscriptionTranslations?.[`billing_${cycle}`];
  return typeof template === "string" ? template : cycle;
};

export const formatHistoryEvent = (
  event: SubscriptionHistoryEvent,
  options: {
    currency: "EUR" | "Dollar";
    language: AppLanguage;
  },
): SubscriptionHistoryPresentation => {
  const amountLabel =
    typeof event.amount === "number"
      ? formatCurrency(event.amount, options.currency)
      : undefined;
  const dateKey = getEventDate(event);
  const dateLabel = formatDate(dateKey);
  const canEdit = isEditablePaymentEventType(event.type);

  switch (event.type) {
    case "payment_booked":
      return {
        id: event.id,
        title: translateHistory(options.language, "paymentBookedTitle"),
        subtitle:
          event.source === "manual"
            ? translateHistory(options.language, "manualAdded")
            : event.dueDate
              ? translateHistory(options.language, "dueOn", {
                  date: formatDate(event.dueDate),
                })
              : undefined,
        amountLabel,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "payment_skipped_inactive":
      return {
        id: event.id,
        title: translateHistory(options.language, "paymentSkippedTitle"),
        subtitle: event.dueDate
          ? translateHistory(options.language, "originallyDueOn", {
              date: formatDate(event.dueDate),
            })
          : undefined,
        amountLabel,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "subscription_deactivated":
      return {
        id: event.id,
        title: translateHistory(options.language, "subscriptionDeactivatedTitle"),
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "subscription_reactivated":
      return {
        id: event.id,
        title: translateHistory(options.language, "subscriptionReactivatedTitle"),
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "amount_changed":
      return {
        id: event.id,
        title: translateHistory(options.language, "amountChangedTitle"),
        subtitle:
          event.previousAmount !== undefined && event.nextAmount !== undefined
            ? translateHistory(options.language, "amountChangedFromTo", {
                from: formatCurrency(event.previousAmount, options.currency),
                to: formatCurrency(event.nextAmount, options.currency),
              })
            : undefined,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "billing_cycle_changed":
      return {
        id: event.id,
        title: translateHistory(options.language, "billingCycleChangedTitle"),
        subtitle:
          event.previousBillingCycle && event.nextBillingCycle
            ? translateHistory(options.language, "billingCycleChangedFromTo", {
                from: translateBillingCycle(options.language, event.previousBillingCycle),
                to: translateBillingCycle(options.language, event.nextBillingCycle),
              })
            : undefined,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "due_date_changed":
      return {
        id: event.id,
        title: translateHistory(options.language, "dueDateChangedTitle"),
        subtitle:
          event.previousNextPaymentDate && event.nextNextPaymentDate
            ? translateHistory(options.language, "dueDateChangedFromTo", {
                from: formatDate(event.previousNextPaymentDate),
                to: formatDate(event.nextNextPaymentDate),
              })
            : undefined,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "subscription_created":
    default:
      return {
        id: event.id,
        title: translateHistory(options.language, "subscriptionCreatedTitle"),
        subtitle: event.initialNextPaymentDate
          ? translateHistory(options.language, "firstDueDate", {
              date: formatDate(event.initialNextPaymentDate),
            })
          : undefined,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
  }
};

export const getTodayDateString = () => toCalendarDateString(new Date());
