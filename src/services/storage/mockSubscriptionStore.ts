import { Subscription, SubscriptionInput } from "@/types/subscription";
import {
  buildChangeEvents,
  buildCreatedEvent,
  getMissingPaymentHistoryEvents,
  sortHistoryNewestFirst,
} from "@/domain/subscriptionHistory/events";
import {
  buildReplacementPaymentEvent,
  buildUpdatedPaymentEvent,
  buildEditablePaymentEventFields,
  getPaymentEventId,
  hasActivePaymentEventForDueDate,
  isEditablePaymentEventType,
} from "@/domain/subscriptionHistory/paymentEvents";
import { HistoryEventInput, SubscriptionHistoryEvent } from "@/types/subscriptionHistory";

import { seedSubscriptions } from "./seedSubscriptions";

type Listener = (items: Subscription[]) => void;
type HistoryListener = (items: SubscriptionHistoryEvent[]) => void;

class MockSubscriptionStore {
  private subscriptions = [...seedSubscriptions];
  private listeners = new Set<Listener>();
  private history = new Map<string, SubscriptionHistoryEvent[]>();
  private historyListeners = new Map<string, Set<HistoryListener>>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.getActiveSnapshot());

    return () => {
      this.listeners.delete(listener);
    };
  }

  async create(input: SubscriptionInput) {
    const timestamp = new Date().toISOString();
    const nextItem: Subscription = {
      id: `local-${Date.now()}`,
      ...input,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    };

    this.subscriptions = [nextItem, ...this.subscriptions];
    await this.createHistoryEvent(
      nextItem.id,
      buildCreatedEvent(nextItem.id, nextItem),
    );
    await this.syncHistory(nextItem);
    this.emit();

    return nextItem;
  }

  async update(id: string, input: Partial<SubscriptionInput>) {
    const previousItem = this.subscriptions.find((item) => item.id === id);
    if (!previousItem) {
      return;
    }

    const nextItem: Subscription = {
      ...previousItem,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    this.subscriptions = this.subscriptions.map((item) =>
      item.id === id
        ? nextItem
        : item,
    );

    for (const event of buildChangeEvents(
      previousItem,
      nextItem,
      new Date().toISOString().slice(0, 10),
    )) {
      await this.createHistoryEvent(id, event);
    }

    await this.syncHistory(nextItem);

    this.emit();
  }

  async archive(id: string) {
    this.subscriptions = this.subscriptions.map((item) =>
      item.id === id
        ? {
            ...item,
            archivedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    this.emit();
  }

  subscribeHistory(subscriptionId: string, listener: HistoryListener) {
    const listeners = this.historyListeners.get(subscriptionId) ?? new Set<HistoryListener>();
    listeners.add(listener);
    this.historyListeners.set(subscriptionId, listeners);
    listener(sortHistoryNewestFirst(this.history.get(subscriptionId) ?? []));

    return () => {
      const nextListeners = this.historyListeners.get(subscriptionId);
      nextListeners?.delete(listener);
    };
  }

  async createHistoryEvent(subscriptionId: string, event: HistoryEventInput) {
    const currentHistory = this.history.get(subscriptionId) ?? [];
    const eventId = event.id ?? `${event.type}_${Date.now()}`;
    const nextEvent: SubscriptionHistoryEvent = {
      ...event,
      id: eventId,
      subscriptionId,
      createdAt: new Date().toISOString(),
    };
    const withoutExisting = currentHistory.filter((item) => item.id !== eventId);
    const nextHistory = sortHistoryNewestFirst([...withoutExisting, nextEvent]);
    this.history.set(subscriptionId, nextHistory);
    this.emitHistory(subscriptionId);
  }

  async createManualPayment(
    subscriptionId: string,
    input: {
      type: "payment_booked" | "payment_skipped_inactive";
      amount: number;
      dueDate: string;
      notes?: string;
    },
  ) {
    const currentHistory = this.history.get(subscriptionId) ?? [];
    const hasExistingScheduledEvent = hasActivePaymentEventForDueDate(
      currentHistory,
      input.dueDate,
    );

    if (hasExistingScheduledEvent) {
      throw new Error("A payment event already exists for this due date.");
    }

    await this.createHistoryEvent(subscriptionId, {
      id: getPaymentEventId(input.type, input.dueDate),
      subscriptionId,
      ...buildEditablePaymentEventFields({
        type: input.type,
        amount: input.amount,
        dueDate: input.dueDate,
        notes: input.notes,
      }),
      updatedAt: new Date().toISOString(),
    });
  }

  async updateHistoryEvent(
    subscriptionId: string,
    eventId: string,
    input: {
      type: "payment_booked" | "payment_skipped_inactive";
      amount: number;
      dueDate: string;
      notes?: string;
    },
  ) {
    const currentHistory = this.history.get(subscriptionId) ?? [];
    const currentEvent = currentHistory.find((event) => event.id === eventId);

    if (!currentEvent || !isEditablePaymentEventType(currentEvent.type) || currentEvent.deletedAt) {
      throw new Error("Only editable payment events can be updated.");
    }

    const editableCurrentEvent = currentEvent as SubscriptionHistoryEvent & {
      type: "payment_booked" | "payment_skipped_inactive";
    };

    const hasDuplicate = hasActivePaymentEventForDueDate(
      currentHistory,
      input.dueDate,
      eventId,
    );

    if (hasDuplicate) {
      throw new Error("A payment event already exists for this due date.");
    }

    const now = new Date().toISOString();
    const nextEventId = getPaymentEventId(input.type, input.dueDate);

    if (nextEventId === editableCurrentEvent.id) {
      const nextHistory = currentHistory.map((event) =>
        event.id === eventId
          ? {
              ...event,
              ...buildUpdatedPaymentEvent({
                currentEvent: editableCurrentEvent,
                input,
                now,
              }),
            }
          : event,
      );

      this.history.set(subscriptionId, sortHistoryNewestFirst(nextHistory));
      this.emitHistory(subscriptionId);
      return;
    }

    const mutation = buildReplacementPaymentEvent({
      currentEvent: editableCurrentEvent,
      input,
      now,
    });
    const nextHistory = sortHistoryNewestFirst([
      ...currentHistory.map((event) =>
        event.id === eventId
          ? {
              ...event,
              ...mutation.archivedCurrentEvent,
            }
          : event,
      ),
      {
        id: mutation.nextEvent.id ?? nextEventId,
        createdAt: now,
        ...mutation.nextEvent,
      },
    ]);

    this.history.set(subscriptionId, nextHistory);
    this.emitHistory(subscriptionId);
  }

  async deleteHistoryEvent(subscriptionId: string, eventId: string) {
    const currentHistory = this.history.get(subscriptionId) ?? [];
    const currentEvent = currentHistory.find((event) => event.id === eventId);

    if (!currentEvent || !isEditablePaymentEventType(currentEvent.type) || currentEvent.deletedAt) {
      throw new Error("Only editable payment events can be deleted.");
    }

    const nextHistory = currentHistory.map((event) =>
      event.id === eventId
        ? {
            ...event,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : event,
    );

    this.history.set(subscriptionId, sortHistoryNewestFirst(nextHistory));
    this.emitHistory(subscriptionId);
  }

  async syncHistory(subscription: Subscription) {
    const currentHistory = this.history.get(subscription.id) ?? [];
    const hasCreatedEvent = currentHistory.some((event) => event.type === "subscription_created");
    const missingEvents = getMissingPaymentHistoryEvents(subscription, currentHistory);

    if (!hasCreatedEvent) {
      await this.createHistoryEvent(subscription.id, buildCreatedEvent(subscription.id, subscription));
    }

    if (missingEvents.length === 0) {
      return;
    }

    const nextHistory = [...currentHistory];
    missingEvents.forEach((event) => {
      nextHistory.push({
        ...event,
        id: event.id ?? `${event.type}_${Date.now()}`,
        subscriptionId: subscription.id,
        createdAt: new Date().toISOString(),
      });
    });
    this.history.set(subscription.id, sortHistoryNewestFirst(nextHistory));
    this.emitHistory(subscription.id);
  }

  private getActiveSnapshot() {
    return this.subscriptions
      .filter((item) => !item.archivedAt)
      .sort((left, right) => left.nextPaymentDate.localeCompare(right.nextPaymentDate));
  }

  private emit() {
    const snapshot = this.getActiveSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private emitHistory(subscriptionId: string) {
    const snapshot = sortHistoryNewestFirst(this.history.get(subscriptionId) ?? []);
    const listeners = this.historyListeners.get(subscriptionId);
    listeners?.forEach((listener) => listener(snapshot));
  }
}

export const mockSubscriptionStore = new MockSubscriptionStore();
