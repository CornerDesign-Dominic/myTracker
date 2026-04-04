import test from "node:test";
import assert from "node:assert/strict";

import { getStartedSubscriptionsForStatistics } from "../../src/domain/subscriptions/statistics.ts";
import type { Subscription } from "../../src/types/subscription.ts";
import type { SubscriptionHistoryEvent } from "../../src/types/subscriptionHistory.ts";

const buildSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: "sub_1",
  name: "Netflix",
  category: "Entertainment",
  amount: 9.99,
  billingCycle: "monthly",
  nextPaymentDate: "2026-05-04",
  status: "active",
  createdAt: "2026-04-04T10:00:00.000Z",
  updatedAt: "2026-04-04T10:00:00.000Z",
  ...overrides,
});

test("future first due date is excluded from statistics before the subscription has started", () => {
  const subscriptions = [buildSubscription()];
  const history: SubscriptionHistoryEvent[] = [];

  const result = getStartedSubscriptionsForStatistics(
    subscriptions,
    history,
    new Date("2026-04-04T12:00:00.000Z"),
  );

  assert.equal(result.length, 0);
});

test("subscription is included once payment history exists even if the next due date is in the future", () => {
  const subscriptions = [buildSubscription({ nextPaymentDate: "2026-06-04" })];
  const history: SubscriptionHistoryEvent[] = [
    {
      id: "payment_1",
      subscriptionId: "sub_1",
      type: "payment_booked",
      amount: 9.99,
      dueDate: "2026-05-04",
      bookedAt: "2026-05-04",
      occurredAt: "2026-05-04",
      createdAt: "2026-05-04T09:00:00.000Z",
      source: "sync",
    },
  ];

  const result = getStartedSubscriptionsForStatistics(
    subscriptions,
    history,
    new Date("2026-05-20T12:00:00.000Z"),
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "sub_1");
});
