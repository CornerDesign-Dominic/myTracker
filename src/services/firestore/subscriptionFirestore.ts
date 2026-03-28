import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { buildChangeEvents, buildCreatedEvent, getMissingPaymentHistoryEvents } from "@/domain/subscriptionHistory/events";
import { firestoreDb } from "@/firebase/config";
import { Subscription, SubscriptionInput } from "@/types/subscription";
import { HistoryEventInput, SubscriptionHistoryEvent } from "@/types/subscriptionHistory";
import { logFirestoreError } from "@/utils/firestoreDebug";
import { serializeTimestamp } from "./userFirestore";

const ensureFirestore = () => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured.");
  }

  return firestoreDb;
};

const subscriptionsCollection = (userId: string) =>
  collection(ensureFirestore(), "users", userId, "subscriptions");

const subscriptionDoc = (userId: string, subscriptionId: string) =>
  doc(ensureFirestore(), "users", userId, "subscriptions", subscriptionId);

const historyCollection = (userId: string, subscriptionId: string) =>
  collection(ensureFirestore(), "users", userId, "subscriptions", subscriptionId, "history");

const historyDoc = (userId: string, subscriptionId: string, eventId: string) =>
  doc(ensureFirestore(), "users", userId, "subscriptions", subscriptionId, "history", eventId);

const removeUndefinedFields = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;

const mapSubscription = (id: string, data: Record<string, unknown>): Subscription => ({
  id,
  name: String(data.name ?? ""),
  category: String(data.category ?? ""),
  amount: Number(data.amount ?? data.price ?? 0),
  billingCycle: (data.billingCycle as Subscription["billingCycle"]) ?? "monthly",
  nextPaymentDate: String(data.nextPaymentDate ?? ""),
  status: (data.status as Subscription["status"]) ?? "active",
  endDate: data.endDate ? String(data.endDate) : undefined,
  notes: data.notes ? String(data.notes) : undefined,
  createdAt: serializeTimestamp(data.createdAt),
  updatedAt: serializeTimestamp(data.updatedAt),
  archivedAt: data.archivedAt ? serializeTimestamp(data.archivedAt) : null,
});

const mapHistoryEvent = (
  subscriptionId: string,
  id: string,
  data: Record<string, unknown>,
): SubscriptionHistoryEvent => ({
  id,
  subscriptionId,
  type: String(data.type ?? "subscription_created") as SubscriptionHistoryEvent["type"],
  createdAt: serializeTimestamp(data.createdAt),
  updatedAt: data.updatedAt ? serializeTimestamp(data.updatedAt) : undefined,
  deletedAt: data.deletedAt ? serializeTimestamp(data.deletedAt) : undefined,
  source: data.source === "manual" ? "manual" : data.source === "sync" ? "sync" : undefined,
  occurredAt: data.occurredAt ? String(data.occurredAt) : undefined,
  effectiveDate: data.effectiveDate ? String(data.effectiveDate) : undefined,
  notes: data.notes ? String(data.notes) : undefined,
  metadata: (data.metadata as SubscriptionHistoryEvent["metadata"]) ?? undefined,
  syncSuppressedDueDates: Array.isArray(data.syncSuppressedDueDates)
    ? data.syncSuppressedDueDates.map(String)
    : undefined,
  snapshot: (data.snapshot as SubscriptionHistoryEvent["snapshot"]) ?? undefined,
  amount: typeof data.amount === "number" ? data.amount : undefined,
  dueDate: data.dueDate ? String(data.dueDate) : undefined,
  bookedAt: data.bookedAt ? String(data.bookedAt) : undefined,
  reason: data.reason === "inactive" ? "inactive" : undefined,
  billingCycleSnapshot:
    (data.billingCycleSnapshot as SubscriptionHistoryEvent["billingCycleSnapshot"]) ?? undefined,
  previousAmount: typeof data.previousAmount === "number" ? data.previousAmount : undefined,
  nextAmount: typeof data.nextAmount === "number" ? data.nextAmount : undefined,
  previousBillingCycle:
    (data.previousBillingCycle as SubscriptionHistoryEvent["previousBillingCycle"]) ?? undefined,
  nextBillingCycle:
    (data.nextBillingCycle as SubscriptionHistoryEvent["nextBillingCycle"]) ?? undefined,
  previousNextPaymentDate: data.previousNextPaymentDate
    ? String(data.previousNextPaymentDate)
    : undefined,
  nextNextPaymentDate: data.nextNextPaymentDate ? String(data.nextNextPaymentDate) : undefined,
  initialAmount: typeof data.initialAmount === "number" ? data.initialAmount : undefined,
  initialBillingCycle:
    (data.initialBillingCycle as SubscriptionHistoryEvent["initialBillingCycle"]) ?? undefined,
  initialNextPaymentDate: data.initialNextPaymentDate
    ? String(data.initialNextPaymentDate)
    : undefined,
  initialStatus: (data.initialStatus as SubscriptionHistoryEvent["initialStatus"]) ?? undefined,
});

const toHistoryPayload = (event: HistoryEventInput) =>
  removeUndefinedFields({
    ...event,
    createdAt: serverTimestamp(),
  });

const readSubscription = async (userId: string, subscriptionId: string) => {
  const snapshot = await getDoc(subscriptionDoc(userId, subscriptionId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapSubscription(snapshot.id, snapshot.data());
};

const readSubscriptionHistory = async (userId: string, subscriptionId: string) => {
  const snapshot = await getDocs(
    query(historyCollection(userId, subscriptionId), orderBy("effectiveDate", "asc")),
  );

  return snapshot.docs.map((eventSnapshot) =>
    mapHistoryEvent(subscriptionId, eventSnapshot.id, eventSnapshot.data()),
  );
};

export const subscribeToFirestoreSubscriptions = (
  userId: string,
  callback: (subscriptions: Subscription[]) => void,
  onError?: (error: Error) => void,
) => {
  const subscriptionQuery = query(
    subscriptionsCollection(userId),
    where("archivedAt", "==", null),
    orderBy("nextPaymentDate", "asc"),
  );

  return onSnapshot(
    subscriptionQuery,
    (snapshot) => {
      const items = snapshot.docs.map((snapshotItem) =>
        mapSubscription(snapshotItem.id, snapshotItem.data()),
      );
      callback(items);
    },
    (error) => {
      logFirestoreError("subscriptionFirestore.subscribeToFirestoreSubscriptions", error, {
        path: `users/${userId}/subscriptions`,
        userId,
      });
      onError?.(error);
    },
  );
};

export const subscribeToFirestoreSubscriptionHistory = (
  userId: string,
  subscriptionId: string,
  callback: (history: SubscriptionHistoryEvent[]) => void,
  onError?: (error: Error) => void,
) => {
  const historyQuery = query(historyCollection(userId, subscriptionId), orderBy("effectiveDate", "desc"));

  return onSnapshot(
    historyQuery,
    (snapshot) => {
      const items = snapshot.docs.map((snapshotItem) =>
        mapHistoryEvent(subscriptionId, snapshotItem.id, snapshotItem.data()),
      );
      callback(items);
    },
    (error) => {
      logFirestoreError("subscriptionFirestore.subscribeToFirestoreSubscriptionHistory", error, {
        path: `users/${userId}/subscriptions/${subscriptionId}/history`,
        userId,
        subscriptionId,
      });
      onError?.(error);
    },
  );
};

export const createFirestoreHistoryEvent = async (
  userId: string,
  subscriptionId: string,
  event: HistoryEventInput,
) => {
  const eventId = event.id ?? `${event.type}_${Date.now()}`;
  const payload = toHistoryPayload(event);

  try {
    await setDoc(historyDoc(userId, subscriptionId, eventId), payload, { merge: true });
  } catch (error) {
    logFirestoreError("subscriptionFirestore.createFirestoreHistoryEvent", error, {
      path: `users/${userId}/subscriptions/${subscriptionId}/history/${eventId}`,
      userId,
      subscriptionId,
      input: payload,
    });
    throw error;
  }
};

export const createFirestoreManualPayment = async (
  userId: string,
  subscriptionId: string,
  input: {
    amount: number;
    dueDate: string;
    notes?: string;
  },
) => {
  try {
    const history = await readSubscriptionHistory(userId, subscriptionId);
    const hasExistingScheduledEvent = history.some(
      (event) =>
        !event.deletedAt &&
        (event.type === "payment_booked" || event.type === "payment_skipped_inactive") &&
        event.dueDate === input.dueDate,
    );

    if (hasExistingScheduledEvent) {
      throw new Error("A payment event already exists for this due date.");
    }

    const eventId = `payment_booked_${input.dueDate}`;
    const payload = toHistoryPayload({
      id: eventId,
      subscriptionId,
      type: "payment_booked",
      source: "manual",
      amount: input.amount,
      dueDate: input.dueDate,
      bookedAt: new Date().toISOString(),
      occurredAt: input.dueDate,
      effectiveDate: input.dueDate,
      notes: input.notes,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(historyDoc(userId, subscriptionId, eventId), payload, { merge: false });
  } catch (error) {
    logFirestoreError("subscriptionFirestore.createFirestoreManualPayment", error, {
      path: `users/${userId}/subscriptions/${subscriptionId}/history`,
      userId,
      subscriptionId,
      input,
    });
    throw error;
  }
};

export const updateFirestoreHistoryEvent = async (
  userId: string,
  subscriptionId: string,
  eventId: string,
  input: {
    amount: number;
    dueDate: string;
    notes?: string;
  },
) => {
  try {
    const history = await readSubscriptionHistory(userId, subscriptionId);
    const currentEvent = history.find((event) => event.id === eventId);

    if (!currentEvent || currentEvent.type !== "payment_booked" || currentEvent.deletedAt) {
      throw new Error("Only payment_booked events can be updated.");
    }

    const hasDuplicate = history.some(
      (event) =>
        event.id !== eventId &&
        !event.deletedAt &&
        (event.type === "payment_booked" || event.type === "payment_skipped_inactive") &&
        event.dueDate === input.dueDate,
    );

    if (hasDuplicate) {
      throw new Error("A payment event already exists for this due date.");
    }

    const nextSuppressedDueDates = Array.from(
      new Set([
        ...(currentEvent.syncSuppressedDueDates ?? []),
        ...(currentEvent.dueDate && currentEvent.dueDate !== input.dueDate ? [currentEvent.dueDate] : []),
      ]),
    );

    await updateDoc(
      historyDoc(userId, subscriptionId, eventId),
      removeUndefinedFields({
        amount: input.amount,
        dueDate: input.dueDate,
        notes: input.notes,
        occurredAt: input.dueDate,
        effectiveDate: input.dueDate,
        syncSuppressedDueDates: nextSuppressedDueDates.length ? nextSuppressedDueDates : undefined,
        updatedAt: serverTimestamp(),
      }),
    );
  } catch (error) {
    logFirestoreError("subscriptionFirestore.updateFirestoreHistoryEvent", error, {
      path: `users/${userId}/subscriptions/${subscriptionId}/history/${eventId}`,
      userId,
      subscriptionId,
      eventId,
      input,
    });
    throw error;
  }
};

export const deleteFirestoreHistoryEvent = async (
  userId: string,
  subscriptionId: string,
  eventId: string,
) => {
  try {
    const history = await readSubscriptionHistory(userId, subscriptionId);
    const currentEvent = history.find((event) => event.id === eventId);

    if (!currentEvent || currentEvent.type !== "payment_booked" || currentEvent.deletedAt) {
      throw new Error("Only payment_booked events can be deleted.");
    }

    const nextSuppressedDueDates = Array.from(
      new Set([
        ...(currentEvent.syncSuppressedDueDates ?? []),
        ...(currentEvent.dueDate ? [currentEvent.dueDate] : []),
      ]),
    );

    await updateDoc(historyDoc(userId, subscriptionId, eventId), {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      syncSuppressedDueDates: nextSuppressedDueDates,
    });
  } catch (error) {
    logFirestoreError("subscriptionFirestore.deleteFirestoreHistoryEvent", error, {
      path: `users/${userId}/subscriptions/${subscriptionId}/history/${eventId}`,
      userId,
      subscriptionId,
      eventId,
    });
    throw error;
  }
};

export const createFirestoreSubscription = async (userId: string, input: SubscriptionInput) => {
  const subscriptionRef = doc(subscriptionsCollection(userId));
  const subscriptionId = subscriptionRef.id;
  const now = new Date().toISOString();
  const subscriptionSnapshot: Subscription = {
    id: subscriptionId,
    ...input,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
  const batch = writeBatch(ensureFirestore());
  const subscriptionPayload = removeUndefinedFields({
    ...input,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const createdEvent = buildCreatedEvent(subscriptionId, subscriptionSnapshot);

  batch.set(subscriptionRef, subscriptionPayload);
  batch.set(historyDoc(userId, subscriptionId, createdEvent.id ?? "subscription_created"), toHistoryPayload(createdEvent));

  try {
    await batch.commit();
    await syncFirestoreSubscriptionHistory(userId, subscriptionSnapshot);
  } catch (error) {
    logFirestoreError("subscriptionFirestore.createFirestoreSubscription", error, {
      path: `users/${userId}/subscriptions/${subscriptionId}`,
      userId,
      subscriptionId,
      input: subscriptionPayload,
    });
    throw error;
  }
};

export const updateFirestoreSubscription = async (
  userId: string,
  id: string,
  input: Partial<SubscriptionInput>,
) => {
  const previousSubscription = await readSubscription(userId, id);

  if (!previousSubscription) {
    throw new Error("Subscription not found.");
  }

  const effectiveDate = new Date().toISOString().slice(0, 10);
  const nextSubscription: Subscription = {
    ...previousSubscription,
    ...removeUndefinedFields(input),
    updatedAt: new Date().toISOString(),
  };
  const payload = removeUndefinedFields({
    ...input,
    updatedAt: serverTimestamp(),
  });
  const events = buildChangeEvents(previousSubscription, nextSubscription, effectiveDate);
  const batch = writeBatch(ensureFirestore());

  batch.update(subscriptionDoc(userId, id), payload);

  events.forEach((event, index) => {
    const eventId = event.id ?? `${event.type}_${effectiveDate}_${index}`;
    batch.set(historyDoc(userId, id, eventId), toHistoryPayload(event));
  });

  try {
    await batch.commit();
    await syncFirestoreSubscriptionHistory(userId, nextSubscription);
  } catch (error) {
    logFirestoreError("subscriptionFirestore.updateFirestoreSubscription", error, {
      path: `users/${userId}/subscriptions/${id}`,
      userId,
      subscriptionId: id,
      input: payload,
    });
    throw error;
  }
};

export const archiveFirestoreSubscription = async (userId: string, id: string) => {
  try {
    await updateDoc(subscriptionDoc(userId, id), {
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logFirestoreError("subscriptionFirestore.archiveFirestoreSubscription", error, {
      path: `users/${userId}/subscriptions/${id}`,
      userId,
      subscriptionId: id,
    });
    throw error;
  }
};

export const syncFirestoreSubscriptionHistory = async (
  userId: string,
  subscription: Subscription,
) => {
  try {
    const history = await readSubscriptionHistory(userId, subscription.id);
    const createdEvent = buildCreatedEvent(subscription.id, subscription);
    const missingEvents = getMissingPaymentHistoryEvents(subscription, history);

    const needsCreatedEvent = !history.some((event) => event.type === "subscription_created");

    if (!needsCreatedEvent && missingEvents.length === 0) {
      return;
    }

    const batch = writeBatch(ensureFirestore());

    if (needsCreatedEvent) {
      batch.set(
        historyDoc(userId, subscription.id, createdEvent.id ?? "subscription_created"),
        toHistoryPayload(createdEvent),
        { merge: true },
      );
    }

    missingEvents.forEach((event) => {
      const eventId = event.id ?? `${event.type}_${event.dueDate ?? Date.now()}`;
      batch.set(historyDoc(userId, subscription.id, eventId), toHistoryPayload(event), { merge: true });
    });

    await batch.commit();
  } catch (error) {
    logFirestoreError("subscriptionFirestore.syncFirestoreSubscriptionHistory", error, {
      path: `users/${userId}/subscriptions/${subscription.id}/history`,
      userId,
      subscriptionId: subscription.id,
    });
    throw error;
  }
};

export const syncFirestoreSubscriptionsHistory = async (
  userId: string,
  subscriptions: Subscription[],
) => {
  await Promise.all(
    subscriptions.map((subscription) => syncFirestoreSubscriptionHistory(userId, subscription)),
  );
};
