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

test("sync uses the latest real payment anchor instead of only the current nextPaymentDate", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-04-15",
  });
  const history = [
    createEvent({
      id: "payment-january",
      type: "payment_booked",
      createdAt: "2026-01-15T08:00:00.000Z",
      effectiveDate: "2026-01-15",
      occurredAt: "2026-01-15",
      dueDate: "2026-01-15",
      amount: 13.99,
      bookedAt: "2026-01-15T08:00:00.000Z",
      billingCycleSnapshot: "monthly",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 3, 20));

  assert.deepEqual(
    result.map((event) => event.dueDate),
    ["2026-02-15", "2026-03-15", "2026-04-15"],
  );
});

test("latest skipped payment also works as the sync anchor", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-04-15",
    status: "paused",
  });
  const history = [
    createEvent({
      id: "payment-january",
      type: "payment_skipped_inactive",
      createdAt: "2026-01-15T08:00:00.000Z",
      effectiveDate: "2026-01-15",
      occurredAt: "2026-01-15",
      dueDate: "2026-01-15",
      amount: 13.99,
      billingCycleSnapshot: "monthly",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 3, 20));

  assert.deepEqual(
    result.map((event) => [event.dueDate, event.type]),
    [
      ["2026-02-15", "payment_skipped_inactive"],
      ["2026-03-15", "payment_skipped_inactive"],
      ["2026-04-15", "payment_skipped_inactive"],
    ],
  );
});

test("sync creates nothing when the latest active payment already reaches today", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-03-15",
  });
  const history = [
    createEvent({
      id: "payment-march",
      type: "payment_booked",
      dueDate: "2026-03-15",
      effectiveDate: "2026-03-15",
      occurredAt: "2026-03-15",
      amount: 13.99,
      billingCycleSnapshot: "monthly",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 2, 20));

  assert.equal(result.length, 0);
});

test("sync creates no new events for cancelled subscriptions", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-01-15",
    status: "cancelled",
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
      id: "cancelled",
      type: "subscription_deactivated",
      createdAt: "2026-02-10T09:00:00.000Z",
      effectiveDate: "2026-02-10",
      occurredAt: "2026-02-10",
      snapshot: {
        status: "cancelled",
      },
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 3, 20));

  assert.deepEqual(
    result.map((event) => [event.dueDate, event.type]),
    [["2026-01-15", "payment_booked"]],
  );
});

test("status changes between due dates are distributed correctly", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-01-15",
    status: "active",
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
      snapshot: { status: "paused" },
    }),
    createEvent({
      id: "reactivated",
      type: "subscription_reactivated",
      createdAt: "2026-04-10T09:00:00.000Z",
      effectiveDate: "2026-04-10",
      occurredAt: "2026-04-10",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 4, 20));

  assert.deepEqual(
    result.map((event) => [event.dueDate, event.type]),
    [
      ["2026-01-15", "payment_booked"],
      ["2026-02-15", "payment_skipped_inactive"],
      ["2026-03-15", "payment_skipped_inactive"],
      ["2026-04-15", "payment_booked"],
      ["2026-05-15", "payment_booked"],
    ],
  );
});

test("deleting the latest payment allows sync to recreate it from the last remaining payment", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-01-15",
  });
  const history = [
    createEvent({
      id: "payment-january",
      type: "payment_booked",
      dueDate: "2026-01-15",
      effectiveDate: "2026-01-15",
      occurredAt: "2026-01-15",
      amount: 13.99,
    }),
    createEvent({
      id: "deleted-payment-february",
      type: "payment_booked",
      dueDate: "2026-02-15",
      effectiveDate: "2026-02-15",
      occurredAt: "2026-02-15",
      amount: 13.99,
      deletedAt: "2026-02-16T09:00:00.000Z",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 1, 20));

  assert.deepEqual(
    result.map((event) => event.dueDate),
    ["2026-02-15"],
  );
});

test("deleting an older payment does not recreate it when a newer payment still exists", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    nextPaymentDate: "2026-01-15",
  });
  const history = [
    createEvent({
      id: "deleted-payment-january",
      type: "payment_booked",
      dueDate: "2026-01-15",
      effectiveDate: "2026-01-15",
      occurredAt: "2026-01-15",
      amount: 13.99,
      deletedAt: "2026-01-16T09:00:00.000Z",
    }),
    createEvent({
      id: "payment-february",
      type: "payment_booked",
      dueDate: "2026-02-15",
      effectiveDate: "2026-02-15",
      occurredAt: "2026-02-15",
      amount: 13.99,
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 1, 20));

  assert.deepEqual(
    result.map((event) => event.dueDate),
    [],
  );
});

for (const monthCount of [3, 4, 6, 12]) {
  test(`active subscriptions backfill ${monthCount} missing monthly payments`, () => {
    const subscription = createSubscription({
      createdAt: "2025-01-10T09:00:00.000Z",
      nextPaymentDate: `2025-${String(13 - monthCount).padStart(2, "0")}-15`,
      status: "active",
    });

    const result = getMissingPaymentHistoryEvents(subscription, [], new Date(2025, 11, 20));

    assert.equal(result.length, monthCount);
    assert.ok(result.every((event) => event.type === "payment_booked"));
  });
}

for (const monthCount of [3, 4, 6, 12]) {
  test(`paused subscriptions backfill ${monthCount} missing monthly skipped payments`, () => {
    const subscription = createSubscription({
      createdAt: "2025-01-10T09:00:00.000Z",
      nextPaymentDate: `2025-${String(13 - monthCount).padStart(2, "0")}-15`,
      status: "paused",
    });

    const result = getMissingPaymentHistoryEvents(subscription, [], new Date(2025, 11, 20));

    assert.equal(result.length, monthCount);
    assert.ok(result.every((event) => event.type === "payment_skipped_inactive"));
  });
}

test("quarterly sync follows the new due date basis after interval change", () => {
  const subscription = createSubscription({
    createdAt: "2026-01-10T09:00:00.000Z",
    billingCycle: "quarterly",
    nextPaymentDate: "2026-05-31",
  });
  const history = [
    createEvent({
      id: "created",
      createdAt: "2026-01-10T09:00:00.000Z",
      effectiveDate: "2026-01-10",
      occurredAt: "2026-01-10",
      initialBillingCycle: "monthly",
      initialNextPaymentDate: "2026-01-31",
    }),
    createEvent({
      id: "billing-cycle-changed",
      type: "billing_cycle_changed",
      effectiveDate: "2026-05-01",
      previousBillingCycle: "monthly",
      nextBillingCycle: "quarterly",
    }),
    createEvent({
      id: "due-date-changed",
      type: "due_date_changed",
      effectiveDate: "2026-05-01",
      previousNextPaymentDate: "2026-01-31",
      nextNextPaymentDate: "2026-05-31",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 10, 30));

  assert.deepEqual(
    result.map((event) => event.dueDate),
    ["2026-05-31", "2026-08-31", "2026-11-30"],
  );
});

test("explicitly changing nextPaymentDate after an already booked first payment sets the new future sync basis", () => {
  const subscription = createSubscription({
    createdAt: "2026-03-28T09:00:00.000Z",
    updatedAt: "2026-03-28T12:00:00.000Z",
    nextPaymentDate: "2026-03-29",
  });
  const history = [
    createEvent({
      id: "created",
      createdAt: "2026-03-28T09:00:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      initialNextPaymentDate: "2026-03-28",
    }),
    createEvent({
      id: "payment-first",
      type: "payment_booked",
      createdAt: "2026-03-28T09:05:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      dueDate: "2026-03-28",
      amount: 13.99,
      bookedAt: "2026-03-28T09:05:00.000Z",
      billingCycleSnapshot: "monthly",
    }),
    createEvent({
      id: "due-date-changed",
      type: "due_date_changed",
      createdAt: "2026-03-28T12:00:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      previousNextPaymentDate: "2026-03-28",
      nextNextPaymentDate: "2026-03-29",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 2, 29));

  assert.deepEqual(
    result.map((event) => [event.dueDate, event.type]),
    [["2026-03-29", "payment_booked"]],
  );
});

test("an already booked first payment remains untouched when the next due date is changed", () => {
  const subscription = createSubscription({
    createdAt: "2026-03-28T09:00:00.000Z",
    updatedAt: "2026-03-28T12:00:00.000Z",
    nextPaymentDate: "2026-03-29",
  });
  const history = [
    createEvent({
      id: "created",
      createdAt: "2026-03-28T09:00:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      initialNextPaymentDate: "2026-03-28",
    }),
    createEvent({
      id: "payment-first",
      type: "payment_booked",
      createdAt: "2026-03-28T09:05:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      dueDate: "2026-03-28",
      amount: 13.99,
      bookedAt: "2026-03-28T09:05:00.000Z",
      billingCycleSnapshot: "monthly",
    }),
    createEvent({
      id: "due-date-changed",
      type: "due_date_changed",
      createdAt: "2026-03-28T12:00:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      previousNextPaymentDate: "2026-03-28",
      nextNextPaymentDate: "2026-03-29",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 2, 29));

  assert.equal(history.filter((event) => event.type === "payment_booked").length, 1);
  assert.equal(history[1]?.dueDate, "2026-03-28");
  assert.equal(result[0]?.dueDate, "2026-03-29");
});

test("changing billing cycle with a newly confirmed due date uses that due date as the new sync basis", () => {
  const subscription = createSubscription({
    createdAt: "2026-03-28T09:00:00.000Z",
    updatedAt: "2026-03-28T12:00:00.000Z",
    billingCycle: "quarterly",
    nextPaymentDate: "2026-04-15",
  });
  const history = [
    createEvent({
      id: "created",
      createdAt: "2026-03-28T09:00:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      initialBillingCycle: "monthly",
      initialNextPaymentDate: "2026-03-28",
    }),
    createEvent({
      id: "payment-first",
      type: "payment_booked",
      createdAt: "2026-03-28T09:05:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      dueDate: "2026-03-28",
      amount: 13.99,
      bookedAt: "2026-03-28T09:05:00.000Z",
      billingCycleSnapshot: "monthly",
    }),
    createEvent({
      id: "billing-cycle-changed",
      type: "billing_cycle_changed",
      createdAt: "2026-03-28T12:00:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      previousBillingCycle: "monthly",
      nextBillingCycle: "quarterly",
    }),
    createEvent({
      id: "due-date-changed",
      type: "due_date_changed",
      createdAt: "2026-03-28T12:00:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      previousNextPaymentDate: "2026-03-28",
      nextNextPaymentDate: "2026-04-15",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 3, 15));

  assert.deepEqual(
    result.map((event) => [event.dueDate, event.type, event.billingCycleSnapshot]),
    [["2026-04-15", "payment_booked", "quarterly"]],
  );
});

test("sync does not duplicate a payment when the explicit new due date already exists", () => {
  const subscription = createSubscription({
    createdAt: "2026-03-28T09:00:00.000Z",
    updatedAt: "2026-03-28T12:00:00.000Z",
    nextPaymentDate: "2026-03-29",
  });
  const history = [
    createEvent({
      id: "payment-first",
      type: "payment_booked",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      dueDate: "2026-03-28",
      amount: 13.99,
      bookedAt: "2026-03-28T09:05:00.000Z",
      billingCycleSnapshot: "monthly",
    }),
    createEvent({
      id: "due-date-changed",
      type: "due_date_changed",
      createdAt: "2026-03-28T12:00:00.000Z",
      effectiveDate: "2026-03-28",
      occurredAt: "2026-03-28",
      previousNextPaymentDate: "2026-03-28",
      nextNextPaymentDate: "2026-03-29",
    }),
    createEvent({
      id: "payment-second",
      type: "payment_booked",
      effectiveDate: "2026-03-29",
      occurredAt: "2026-03-29",
      dueDate: "2026-03-29",
      amount: 13.99,
      bookedAt: "2026-03-29T09:00:00.000Z",
      billingCycleSnapshot: "monthly",
    }),
  ];

  const result = getMissingPaymentHistoryEvents(subscription, history, new Date(2026, 2, 29));

  assert.equal(result.length, 0);
});

test("yearly sync respects yearly cycles and does not create future events", () => {
  const subscription = createSubscription({
    createdAt: "2024-01-10T09:00:00.000Z",
    billingCycle: "yearly",
    nextPaymentDate: "2024-03-31",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], new Date(2026, 2, 20));

  assert.deepEqual(
    result.map((event) => event.dueDate),
    ["2024-03-31", "2025-03-31"],
  );
});

test("monthly sync keeps month-end clamping across year changes", () => {
  const subscription = createSubscription({
    createdAt: "2025-11-10T09:00:00.000Z",
    nextPaymentDate: "2025-12-31",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], new Date(2026, 1, 20));

  assert.deepEqual(
    result.map((event) => event.dueDate),
    ["2025-12-31", "2026-01-31"],
  );
});

test("invalid bases produce no events", () => {
  const subscription = createSubscription({
    createdAt: "invalid-date",
    nextPaymentDate: "2026-03-28",
  });

  const result = getMissingPaymentHistoryEvents(subscription, [], TODAY);

  assert.equal(result.length, 0);
});
