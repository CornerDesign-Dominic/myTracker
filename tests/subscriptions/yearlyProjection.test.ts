import test from "node:test";
import assert from "node:assert/strict";

import {
  getProjectedSubscriptionYearlyCost,
  getProjectedYearlyCost,
} from "../../src/domain/subscriptions/statistics.ts";
import type { Subscription } from "../../src/types/subscription.ts";
import type { SubscriptionHistoryEvent } from "../../src/types/subscriptionHistory.ts";

const NOW = new Date(2026, 2, 15);

const createSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: "subscription-1",
  name: "Netflix",
  category: "Unterhaltung",
  amount: 10,
  billingCycle: "monthly",
  nextPaymentDate: "2026-04-01",
  status: "active",
  createdAt: "2026-01-01T09:00:00.000Z",
  updatedAt: "2026-03-01T09:00:00.000Z",
  ...overrides,
});

const createBookedEvent = (
  dueDate: string,
  overrides: Partial<SubscriptionHistoryEvent> = {},
): SubscriptionHistoryEvent => ({
  id: `event-${dueDate}`,
  subscriptionId: "subscription-1",
  type: "payment_booked",
  amount: 10,
  dueDate,
  bookedAt: `${dueDate}T08:00:00.000Z`,
  createdAt: `${dueDate}T08:00:00.000Z`,
  ...overrides,
});

test("active monthly subscription includes booked payments and forecasts remaining months", () => {
  const subscription = createSubscription();
  const history = [
    createBookedEvent("2026-01-01"),
    createBookedEvent("2026-02-01"),
    createBookedEvent("2026-03-01"),
  ];

  const result = getProjectedSubscriptionYearlyCost(subscription, history, NOW);

  assert.equal(result, 120);
});

test("paused monthly subscription includes booked payments but does not forecast future months", () => {
  const subscription = createSubscription({ status: "paused" });
  const history = [
    createBookedEvent("2026-01-01"),
    createBookedEvent("2026-02-01"),
    createBookedEvent("2026-03-01"),
  ];

  const result = getProjectedSubscriptionYearlyCost(subscription, history, NOW);

  assert.equal(result, 30);
});

test("paused subscription without booked payments in the current year has yearly cost of zero", () => {
  const subscription = createSubscription({ status: "paused" });

  const result = getProjectedSubscriptionYearlyCost(subscription, [], NOW);

  assert.equal(result, 0);
});

test("active subscription does not double count booked payments that already exist in history", () => {
  const subscription = createSubscription({
    nextPaymentDate: "2026-04-01",
  });
  const history = [
    createBookedEvent("2026-01-01"),
    createBookedEvent("2026-04-01"),
  ];

  const result = getProjectedSubscriptionYearlyCost(subscription, history, NOW);

  assert.equal(result, 100);
});

test("projected yearly total aggregates subscription-level results", () => {
  const activeSubscription = createSubscription();
  const pausedSubscription = createSubscription({
    id: "subscription-2",
    name: "Spotify",
    status: "paused",
  });
  const history = [
    createBookedEvent("2026-01-01"),
    createBookedEvent("2026-02-01"),
    createBookedEvent("2026-03-01"),
    createBookedEvent("2026-01-10", { subscriptionId: "subscription-2" }),
  ];

  const result = getProjectedYearlyCost(
    [activeSubscription, pausedSubscription],
    history,
    NOW,
  );

  assert.equal(result, 130);
});
