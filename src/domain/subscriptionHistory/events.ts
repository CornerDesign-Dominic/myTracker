import { AppLanguage } from "@/i18n/translations";
import {
  HistoryEventInput,
  HistorySyncSummary,
  SubscriptionHistoryAware,
  SubscriptionHistoryEvent,
  SubscriptionHistoryPresentation,
} from "@/types/subscriptionHistory";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

import {
  parseCalendarDate,
  toCalendarDateString,
} from "./schedule";
import { getMissingPaymentHistoryEvents } from "./paymentSync";
export { getMissingPaymentHistoryEvents } from "./paymentSync";

const getEventDate = (event: Pick<SubscriptionHistoryEvent, "effectiveDate" | "occurredAt" | "createdAt">) =>
  event.effectiveDate ?? event.occurredAt ?? event.createdAt;

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
  [...history].sort((left, right) => getEventDate(right).localeCompare(getEventDate(left)));

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
  const canEdit = event.type === "payment_booked";

  if (options.language === "de") {
    switch (event.type) {
      case "payment_booked":
        return {
          id: event.id,
          title: "Zahlung gebucht",
          subtitle:
            event.source === "manual"
              ? "Manuell erfasst"
              : event.dueDate
                ? `FÃ¤llig am ${formatDate(event.dueDate)}`
                : undefined,
          amountLabel,
          dateLabel,
          canEdit,
          occurredAt: dateKey,
        };
      case "payment_skipped_inactive":
        return {
          id: event.id,
          title: "Zahlung ausgesetzt",
          subtitle: event.dueDate ? `Eigentlich fällig am ${formatDate(event.dueDate)}` : undefined,
          amountLabel,
          dateLabel,
          canEdit,
          occurredAt: dateKey,
        };
      case "subscription_deactivated":
        return {
          id: event.id,
          title: "Abo deaktiviert",
          dateLabel,
          canEdit,
          occurredAt: dateKey,
        };
      case "subscription_reactivated":
        return {
          id: event.id,
          title: "Abo reaktiviert",
          dateLabel,
          canEdit,
          occurredAt: dateKey,
        };
      case "amount_changed":
        return {
          id: event.id,
          title: "Betrag geändert",
          subtitle:
            event.previousAmount !== undefined && event.nextAmount !== undefined
              ? `Von ${formatCurrency(event.previousAmount, options.currency)} auf ${formatCurrency(event.nextAmount, options.currency)}`
              : undefined,
          dateLabel,
          canEdit,
          occurredAt: dateKey,
        };
      case "billing_cycle_changed":
        return {
          id: event.id,
          title: "Intervall geändert",
          subtitle:
            event.previousBillingCycle && event.nextBillingCycle
              ? `Von ${event.previousBillingCycle} auf ${event.nextBillingCycle}`
              : undefined,
          dateLabel,
          canEdit,
          occurredAt: dateKey,
        };
      case "due_date_changed":
        return {
          id: event.id,
          title: "Fälligkeit geändert",
          subtitle:
            event.previousNextPaymentDate && event.nextNextPaymentDate
              ? `Von ${formatDate(event.previousNextPaymentDate)} auf ${formatDate(event.nextNextPaymentDate)}`
              : undefined,
          dateLabel,
          canEdit,
          occurredAt: dateKey,
        };
      case "subscription_created":
      default:
        return {
          id: event.id,
          title: "Abo angelegt",
          subtitle: event.initialNextPaymentDate
            ? `Erste Fälligkeit ${formatDate(event.initialNextPaymentDate)}`
            : undefined,
          dateLabel,
          canEdit,
          occurredAt: dateKey,
        };
    }
  }

  switch (event.type) {
    case "payment_booked":
      return {
        id: event.id,
        title: "Payment booked",
        subtitle:
          event.source === "manual"
            ? "Added manually"
            : event.dueDate
              ? `Due on ${formatDate(event.dueDate)}`
              : undefined,
        amountLabel,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "payment_skipped_inactive":
      return {
        id: event.id,
        title: "Payment skipped",
        subtitle: event.dueDate ? `Originally due on ${formatDate(event.dueDate)}` : undefined,
        amountLabel,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "subscription_deactivated":
      return {
        id: event.id,
        title: "Subscription deactivated",
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "subscription_reactivated":
      return {
        id: event.id,
        title: "Subscription reactivated",
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "amount_changed":
      return {
        id: event.id,
        title: "Amount changed",
        subtitle:
          event.previousAmount !== undefined && event.nextAmount !== undefined
            ? `From ${formatCurrency(event.previousAmount, options.currency)} to ${formatCurrency(event.nextAmount, options.currency)}`
            : undefined,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "billing_cycle_changed":
      return {
        id: event.id,
        title: "Billing cycle changed",
        subtitle:
          event.previousBillingCycle && event.nextBillingCycle
            ? `From ${event.previousBillingCycle} to ${event.nextBillingCycle}`
            : undefined,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "due_date_changed":
      return {
        id: event.id,
        title: "Due date changed",
        subtitle:
          event.previousNextPaymentDate && event.nextNextPaymentDate
            ? `From ${formatDate(event.previousNextPaymentDate)} to ${formatDate(event.nextNextPaymentDate)}`
            : undefined,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
    case "subscription_created":
    default:
      return {
        id: event.id,
        title: "Subscription created",
        subtitle: event.initialNextPaymentDate
          ? `First due date ${formatDate(event.initialNextPaymentDate)}`
          : undefined,
        dateLabel,
        canEdit,
        occurredAt: dateKey,
      };
  }
};

export const getTodayDateString = () => toCalendarDateString(new Date());
