import test from "node:test";
import assert from "node:assert/strict";

import {
  buildEditablePaymentEventFields,
  isEditablePaymentEventType,
} from "../../src/domain/subscriptionHistory/paymentEvents.ts";

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
