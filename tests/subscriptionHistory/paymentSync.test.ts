import test from "node:test";
import assert from "node:assert/strict";

import { getMissingPaymentHistoryEvents } from "../../src/domain/subscriptionHistory/paymentSync.ts";
import type {
  SubscriptionHistoryAware,
  SubscriptionHistoryEvent,
} from "../../src/types/subscriptionHistory.ts";

const TODAY = new Date(2026, 2, 28);
const TOMORROW = new Date(2026, 2, 29);

const createSubscription = (
  overrides: Partial<SubscriptionHistoryAware> = {},
): SubscriptionHistoryAware => ({
  id: "subscription-1",
  amount: 13.99,
  billingCycle: "monthly",
  nextPaymentDate: "2026-03-29",
  status: "active",
  createdAt: "2026-03-28T09:00:00.000Z",
  updatedAt: "2026-03-28T09:00:00.000Z",
  ...overrides,
});

const createEvent = (
  overrides: Partial<SubscriptionHistoryEvent>,
): SubscriptionHistoryEvent => ({
  id: "event-1",
  subscriptionId: "subscription-1",
  type: "subscription_created",
  createdAt: "2026-03-28T09:00:00.000Z",
  effectiveDate: "2026-03-28",
  occurredAt: "2026-03-28",
  initialAmount: 13.99,
  initialBillingCycle: "monthly",
  initialNextPaymentDate: "2026-03-29",
  initialStatus: "active",
  ...overrides,
});

test("creates no event before a due date is actually reached", () => {
  const subscription = createSubscription({
    createdAt: "2026-03-28T09:00:00.000Z",
    nextPaymentDate: "2026-03-29",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], TODAY);

  assert.equal(result.length, 0);
});

test("creates an event once the due date day is reached", () => {
  const subscription = createSubscription({
    createdAt: "2026-03-28T09:00:00.000Z",
    nextPaymentDate: "2026-03-29",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], TOMORROW);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.type, "payment_booked");
  assert.equal(result[0]?.dueDate, "2026-03-29");
});

test("creates no payments when next due date is before subscription createdAt day", () => {
  const subscription = createSubscription({
    createdAt: "2026-03-28T09:00:00.000Z",
    updatedAt: "2026-03-28T09:00:00.000Z",
    nextPaymentDate: "2025-11-29",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], TODAY);

  assert.equal(result.length, 0);
});

test("creates a payment when due date is today", () => {
  const subscription = createSubscription({
    nextPaymentDate: "2026-03-28",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], TODAY);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.type, "payment_booked");
  assert.equal(result[0]?.dueDate, "2026-03-28");
});

test("creates payment_skipped_inactive for today's due date while inactive", () => {
  const subscription = createSubscription({
    status: "paused",
    nextPaymentDate: "2026-03-28",
  });
  const history = [
    createEvent({
      id: "created",
    }),
    createEvent({
      id: "deactivated",
      type: "subscription_deactivated",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, TODAY);

  assert.equal(result.length, 1);
  assert.equal(result[0]?.type, "payment_skipped_inactive");
  assert.equal(result[0]?.dueDate, "2026-03-28");
});

test("creates no skipped payment for a future due date while inactive", () => {
  const subscription = createSubscription({
    status: "paused",
    nextPaymentDate: "2026-03-29",
  });
  const history = [
    createEvent({
      id: "created",
    }),
    createEvent({
      id: "deactivated",
      type: "subscription_deactivated",
      effectiveDate: "2026-03-20",
      occurredAt: "2026-03-20",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, TODAY);

  assert.equal(result.length, 0);
});

test("changing due date into the past does not backfill payments before createdAt", () => {
  const subscription = createSubscription({
    createdAt: "2026-03-28T09:00:00.000Z",
    nextPaymentDate: "2024-01-15",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], TODAY);

  assert.equal(result.length, 0);
});

test("changing amount does not create historical payment events by itself", () => {
  const subscription = createSubscription({
    amount: 19.99,
    nextPaymentDate: "2024-01-15",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], TODAY);

  assert.equal(result.length, 0);
});

test("sync backfills only missing months within the app-internal period", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-01-15",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], new Date(2026, 3, 20));

  assert.deepEqual(
    result.map((event) => event.dueDate),
    ["2026-01-15", "2026-02-15", "2026-03-15", "2026-04-15"],
  );
  assert.ok(result.every((event) => event.type === "payment_booked"));
});

test("sync respects historical deactivation state for missing months", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-01-15",
    status: "paused",
  });
  const history = [
    createEvent({
      id: "created",
      createdAt: "2026-01-10T09:00:00.000Z",
      effectiveDate: "2026-01-10",
      occurredAt: "2026-01-10",
      initialNextPaymentDate: "2026-01-15",
    }),
    createEvent({
      id: "deactivated",
      type: "subscription_deactivated",
      createdAt: "2026-02-10T09:00:00.000Z",
      effectiveDate: "2026-02-10",
      occurredAt: "2026-02-10",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 3, 20));

  assert.deepEqual(
    result.map((event) => [event.dueDate, event.type]),
    [
      ["2026-01-15", "payment_booked"],
      ["2026-02-15", "payment_skipped_inactive"],
      ["2026-03-15", "payment_skipped_inactive"],
      ["2026-04-15", "payment_skipped_inactive"],
    ],
  );
});

test("deleted payment events suppress automatic recreation for the same due date", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-01-15",
  });
  const history = [
    createEvent({
      id: "deleted-payment",
      type: "payment_booked",
      dueDate: "2026-01-15",
      deletedAt: "2026-01-16T09:00:00.000Z",
      amount: 13.99,
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 1, 20));

  assert.deepEqual(
    result.map((event) => event.dueDate),
    ["2026-02-15"],
  );
});
