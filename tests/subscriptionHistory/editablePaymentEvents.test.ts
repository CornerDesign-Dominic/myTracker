import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEditablePaymentEventFields,
  buildUpdatedPaymentEvent,
  hasActivePaymentEventForDueDate,
  isDueDateSuppressedForAutoSync,
  isEditablePaymentEventType,
} from "../../src/domain/subscriptionHistory/paymentEvents.ts";
import type { SubscriptionHistoryEvent } from "../../src/types/subscriptionHistory.ts";

test("payment_booked fields include bookedAt and no inactive reason", () => {
  const result = buildEditablePaymentEventFields({
    type: "payment_booked",
    amount: 12.99,
    dueDate: "2026-04-01",
    notes: "manual fix",
    bookedAt: "2026-04-01T08:00:00.000Z",
    source: "manual",
  });

  assert.equal(result.type, "payment_booked");
  assert.equal(result.amount, 12.99);
  assert.equal(result.dueDate, "2026-04-01");
  assert.equal(result.notes, "manual fix");
  assert.equal("bookedAt" in result ? result.bookedAt : undefined, "2026-04-01T08:00:00.000Z");
  assert.equal("source" in result ? result.source : undefined, "manual");
  assert.equal("reason" in result, false);
});

test("payment_skipped_inactive fields include inactive reason and no bookedAt", () => {
  const result = buildEditablePaymentEventFields({
    type: "payment_skipped_inactive",
    amount: 7.5,
    dueDate: "2026-05-15",
  });

  assert.equal(result.type, "payment_skipped_inactive");
  assert.equal(result.amount, 7.5);
  assert.equal(result.dueDate, "2026-05-15");
  assert.equal("reason" in result ? result.reason : undefined, "inactive");
  assert.equal("bookedAt" in result, false);
  assert.equal("source" in result, false);
});

test("booked and skipped payment events are marked as editable", () => {
  assert.equal(isEditablePaymentEventType("payment_booked"), true);
  assert.equal(isEditablePaymentEventType("payment_skipped_inactive"), true);
});

test("type change mutates the same payment record in place", () => {
  const currentEvent: SubscriptionHistoryEvent & { type: "payment_booked" } = {
    id: "payment-1",
    subscriptionId: "subscription-1",
    type: "payment_booked",
    createdAt: "2026-04-01T08:00:00.000Z",
    dueDate: "2026-04-01",
    amount: 12.99,
    bookedAt: "2026-04-01T08:00:00.000Z",
    source: "sync",
  };

  const updated = buildUpdatedPaymentEvent({
    currentEvent,
    input: {
      type: "payment_skipped_inactive",
      amount: 12.99,
      dueDate: "2026-04-01",
      notes: "corrected",
    },
    now: "2026-04-10T10:00:00.000Z",
  });

  assert.equal(updated.type, "payment_skipped_inactive");
  assert.equal(updated.dueDate, "2026-04-01");
  assert.equal("reason" in updated ? updated.reason : undefined, "inactive");
  assert.equal("bookedAt" in updated, false);
  assert.equal(updated.updatedAt, "2026-04-10T10:00:00.000Z");
});

test("in-place update allows changing type, due date and notes on the same record", () => {
  const currentEvent: SubscriptionHistoryEvent & { type: "payment_booked" } = {
    id: "payment-1",
    subscriptionId: "subscription-1",
    type: "payment_booked",
    createdAt: "2026-04-01T08:00:00.000Z",
    dueDate: "2026-04-01",
    amount: 12.99,
    bookedAt: "2026-04-01T08:00:00.000Z",
    source: "sync",
  };

  const updated = buildUpdatedPaymentEvent({
    currentEvent,
    input: {
      type: "payment_booked",
      amount: 14.99,
      dueDate: "2026-05-01",
      notes: "adjusted",
    },
    now: "2026-04-10T10:00:00.000Z",
  });

  assert.equal(updated.type, "payment_booked");
  assert.equal(updated.dueDate, "2026-05-01");
  assert.equal(updated.amount, 14.99);
  assert.equal(updated.notes, "adjusted");
  assert.equal("source" in updated ? updated.source : undefined, "sync");
  assert.equal("bookedAt" in updated ? updated.bookedAt : undefined, "2026-04-10T10:00:00.000Z");
  assert.equal(updated.updatedAt, "2026-04-10T10:00:00.000Z");
});

test("duplicate helper ignores deleted payment events and current record exclusion", () => {
  const history: SubscriptionHistoryEvent[] = [
    {
      id: "payment-1",
      subscriptionId: "subscription-1",
      type: "payment_booked",
      createdAt: "2026-04-01T08:00:00.000Z",
      dueDate: "2026-04-01",
      amount: 12.99,
    },
    {
      id: "payment-2",
      subscriptionId: "subscription-1",
      type: "payment_skipped_inactive",
      createdAt: "2026-05-01T08:00:00.000Z",
      dueDate: "2026-05-01",
      amount: 12.99,
      deletedAt: "2026-05-02T08:00:00.000Z",
    },
  ];

  assert.equal(hasActivePaymentEventForDueDate(history, "2026-04-01"), true);
  assert.equal(hasActivePaymentEventForDueDate(history, "2026-05-01"), false);
  assert.equal(hasActivePaymentEventForDueDate(history, "2026-04-01", "payment-1"), false);
});

test("legacy sync suppression stays readable for old history data", () => {
  const history: SubscriptionHistoryEvent[] = [
    {
      id: "event-1",
      subscriptionId: "subscription-1",
      type: "subscription_created",
      createdAt: "2026-01-01T08:00:00.000Z",
      syncSuppressedDueDates: ["2026-05-01"],
    },
  ];

  assert.equal(isDueDateSuppressedForAutoSync(history, "2026-05-01"), true);
});
