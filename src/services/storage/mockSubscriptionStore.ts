import { Subscription, SubscriptionInput } from "@/types/subscription";

import { seedSubscriptions } from "./seedSubscriptions";

type Listener = (items: Subscription[]) => void;

class MockSubscriptionStore {
  private subscriptions = [...seedSubscriptions];
  private listeners = new Set<Listener>();

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
    this.emit();

    return nextItem;
  }

  async update(id: string, input: Partial<SubscriptionInput>) {
    this.subscriptions = this.subscriptions.map((item) =>
      item.id === id
        ? {
            ...item,
            ...input,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

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

  private getActiveSnapshot() {
    return this.subscriptions
      .filter((item) => !item.archivedAt)
      .sort((left, right) => left.nextPaymentDate.localeCompare(right.nextPaymentDate));
  }

  private emit() {
    const snapshot = this.getActiveSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const mockSubscriptionStore = new MockSubscriptionStore();
