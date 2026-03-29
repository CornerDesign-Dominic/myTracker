import test from "node:test";
import assert from "node:assert/strict";

import { MockSubscriptionStore } from "../../src/services/storage/mockSubscriptionStore.ts";
import type { SubscriptionHistoryEvent } from "../../src/types/subscriptionHistory.ts";

const createStoreWithHistory = async () => {
  const store = new MockSubscriptionStore();
  const subscription = await store.create({
    name: "Test Subscription",
    category: "Software",
    amount: 10,
    billingCycle: "monthly",
    nextPaymentDate: "2026-03-15",
    status: "active",
    notes: "",
  });

  return {
    store,
    subscription,
  };
};

const getVisibleHistory = async (store: MockSubscriptionStore, subscriptionId: string) => {
  const events: SubscriptionHistoryEvent[] = [];
  const unsubscribe = store.subscribeHistory(subscriptionId, (items) => {
    events.splice(0, events.length, ...items);
  });
  unsubscribe();
  return events;
};

test("manual payment creation blocks duplicate due dates", async () => {
  const { store, subscription } = await createStoreWithHistory();

  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 10,
    dueDate: "2026-04-15",
  });

  await assert.rejects(
    () =>
      store.createManualPayment(subscription.id, {
        type: "payment_skipped_inactive",
        amount: 10,
        dueDate: "2026-04-15",
      }),
    /already exists/i,
  );
});

test("editing a payment to an occupied due date is blocked", async () => {
  const { store, subscription } = await createStoreWithHistory();

  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 10,
    dueDate: "2026-04-15",
  });
  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 12,
    dueDate: "2026-05-15",
  });

  const history = await getVisibleHistory(store, subscription.id);
  const aprilPayment = history.find((event) => event.dueDate === "2026-04-15");
  const mayPayment = history.find((event) => event.dueDate === "2026-05-15");

  assert.ok(aprilPayment);
  assert.ok(mayPayment);

  await assert.rejects(
    () =>
      store.updateHistoryEvent(subscription.id, aprilPayment.id, {
        type: "payment_booked",
        amount: 10,
        dueDate: "2026-05-15",
      }),
    /already exists/i,
  );
});

test("multiple edits keep the same payment record id", async () => {
  const { store, subscription } = await createStoreWithHistory();

  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 10,
    dueDate: "2026-04-15",
    notes: "first",
  });

  const initialHistory = await getVisibleHistory(store, subscription.id);
  const payment = initialHistory.find((event) => event.dueDate === "2026-04-15");
  assert.ok(payment);

  await store.updateHistoryEvent(subscription.id, payment.id, {
    type: "payment_skipped_inactive",
    amount: 10,
    dueDate: "2026-04-15",
    notes: "second",
  });

  await store.updateHistoryEvent(subscription.id, payment.id, {
    type: "payment_booked",
    amount: 15,
    dueDate: "2026-06-15",
    notes: "third",
  });

  const finalHistory = await getVisibleHistory(store, subscription.id);
  const updatedPayment = finalHistory.find((event) => event.id === payment.id);

  assert.ok(updatedPayment);
  assert.equal(updatedPayment.id, payment.id);
  assert.equal(updatedPayment.type, "payment_booked");
  assert.equal(updatedPayment.amount, 15);
  assert.equal(updatedPayment.dueDate, "2026-06-15");
  assert.equal(updatedPayment.notes, "third");
});
