import test from "node:test";
import assert from "node:assert/strict";

import { MockSubscriptionStore } from "../../src/services/storage/mockSubscriptionStore.ts";
import type { SubscriptionHistoryEvent } from "../../src/types/subscriptionHistory.ts";

const createStoreWithSubscription = async () => {
  const store = new MockSubscriptionStore();
  const subscription = await store.create({
    name: "Regression Subscription",
    category: "Software",
    amount: 15,
    billingCycle: "monthly",
    nextPaymentDate: "2026-04-15",
    status: "active",
    notes: "",
  });

  return { store, subscription };
};

const getVisibleHistory = async (store: MockSubscriptionStore, subscriptionId: string) => {
  const items: SubscriptionHistoryEvent[] = [];
  const unsubscribe = store.subscribeHistory(subscriptionId, (nextItems) => {
    items.splice(0, items.length, ...nextItems);
  });
  unsubscribe();
  return items;
};

test("offline create payment keeps one active payment event", async () => {
  const { store, subscription } = await createStoreWithSubscription();

  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 15,
    dueDate: "2026-04-15",
    notes: "offline create",
  });

  const history = await getVisibleHistory(store, subscription.id);
  const activePayments = history.filter(
    (event) => event.type === "payment_booked" && event.dueDate === "2026-04-15" && !event.deletedAt,
  );

  assert.equal(activePayments.length, 1);
  assert.equal(activePayments[0]?.notes, "offline create");
});

test("offline delete payment removes it from duplicate checks for same due date", async () => {
  const { store, subscription } = await createStoreWithSubscription();

  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 15,
    dueDate: "2026-04-15",
  });

  const firstHistory = await getVisibleHistory(store, subscription.id);
  const originalPayment = firstHistory.find(
    (event) => event.type === "payment_booked" && event.dueDate === "2026-04-15" && !event.deletedAt,
  );

  assert.ok(originalPayment);

  await store.deleteHistoryEvent(subscription.id, originalPayment.id);
  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 18,
    dueDate: "2026-04-15",
    notes: "replacement",
  });

  const finalHistory = await getVisibleHistory(store, subscription.id);
  const activePayments = finalHistory.filter(
    (event) => event.type === "payment_booked" && event.dueDate === "2026-04-15" && !event.deletedAt,
  );
  const deletedOriginal = finalHistory.find((event) => event.id === originalPayment.id);

  assert.equal(activePayments.length, 1);
  assert.equal(activePayments[0]?.notes, "replacement");
  assert.ok(deletedOriginal?.deletedAt);
});

test("offline create delete create on same due date keeps final active record only once", async () => {
  const { store, subscription } = await createStoreWithSubscription();

  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 15,
    dueDate: "2026-04-15",
    notes: "first",
  });

  const firstHistory = await getVisibleHistory(store, subscription.id);
  const firstPayment = firstHistory.find(
    (event) => event.type === "payment_booked" && event.dueDate === "2026-04-15" && !event.deletedAt,
  );

  assert.ok(firstPayment);

  await store.deleteHistoryEvent(subscription.id, firstPayment.id);
  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 21,
    dueDate: "2026-04-15",
    notes: "second",
  });

  const finalHistory = await getVisibleHistory(store, subscription.id);
  const activePayments = finalHistory.filter(
    (event) => event.type === "payment_booked" && event.dueDate === "2026-04-15" && !event.deletedAt,
  );

  assert.equal(activePayments.length, 1);
  assert.equal(activePayments[0]?.amount, 21);
  assert.equal(activePayments[0]?.notes, "second");
});

test("offline repeated edits keep only the final relevant state on the same record", async () => {
  const { store, subscription } = await createStoreWithSubscription();

  await store.createManualPayment(subscription.id, {
    type: "payment_booked",
    amount: 15,
    dueDate: "2026-04-15",
  });

  const initialHistory = await getVisibleHistory(store, subscription.id);
  const payment = initialHistory.find(
    (event) => event.type === "payment_booked" && event.dueDate === "2026-04-15" && !event.deletedAt,
  );

  assert.ok(payment);

  await store.updateHistoryEvent(subscription.id, payment.id, {
    type: "payment_booked",
    amount: 16,
    dueDate: "2026-05-15",
    notes: "first edit",
  });
  await store.updateHistoryEvent(subscription.id, payment.id, {
    type: "payment_skipped_inactive",
    amount: 17,
    dueDate: "2026-06-15",
    notes: "second edit",
  });
  await store.updateHistoryEvent(subscription.id, payment.id, {
    type: "payment_booked",
    amount: 19,
    dueDate: "2026-07-15",
    notes: "final edit",
  });

  const finalHistory = await getVisibleHistory(store, subscription.id);
  const updatedPayment = finalHistory.find((event) => event.id === payment.id);

  assert.ok(updatedPayment);
  assert.equal(updatedPayment?.type, "payment_booked");
  assert.equal(updatedPayment?.amount, 19);
  assert.equal(updatedPayment?.dueDate, "2026-07-15");
  assert.equal(updatedPayment?.notes, "final edit");
  assert.equal(updatedPayment?.deletedAt, undefined);
});
