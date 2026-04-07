import test from "node:test";
import assert from "node:assert/strict";

import {
  sanitizeHistoryEventForFirestore,
  sanitizeSubscriptionInputForFirestore,
} from "../../src/services/firestore/payloadSanitizer.ts";

test("history payload sanitizer removes syncState and nested undefined values", () => {
  const sanitized = sanitizeHistoryEventForFirestore({
    id: "event-1",
    subscriptionId: "subscription-1",
    type: "payment_booked",
    createdAt: "2026-04-07T10:00:00.000Z",
    dueDate: "2026-04-15",
    amount: 12,
    metadata: {
      source: "manual",
      debug: undefined,
    } as unknown as Record<string, string | number | boolean | null>,
    snapshot: {
      amount: 12,
      nextPaymentDate: undefined,
    },
    syncState: {
      status: "retryPending",
      isPending: true,
      isSyncing: false,
      hasError: true,
      localOnly: false,
      retryPending: true,
      lastError: undefined,
    },
  });

  assert.equal("syncState" in sanitized, false);
  assert.deepEqual(sanitized.metadata, { source: "manual" });
  assert.deepEqual(sanitized.snapshot, { amount: 12 });
});

test("subscription payload sanitizer removes local sync metadata and undefined fields", () => {
  const sanitized = sanitizeSubscriptionInputForFirestore({
    name: "Netflix",
    category: "Streaming",
    amount: 12.99,
    billingCycle: "monthly",
    nextPaymentDate: "2026-04-15",
    status: "active",
    notes: undefined,
    syncState: {
      status: "pending",
      isPending: true,
      isSyncing: false,
      hasError: false,
      localOnly: true,
      retryPending: false,
      lastError: undefined,
    },
  });

  assert.equal("syncState" in sanitized, false);
  assert.equal("notes" in sanitized, false);
  assert.equal(sanitized.name, "Netflix");
});
