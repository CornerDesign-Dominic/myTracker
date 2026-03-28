import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { firestoreDb } from "@/firebase/config";
import { Subscription, SubscriptionInput } from "@/types/subscription";
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

export const createFirestoreSubscription = async (userId: string, input: SubscriptionInput) => {
  const payload = removeUndefinedFields({
    ...input,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await addDoc(subscriptionsCollection(userId), payload);
  } catch (error) {
    logFirestoreError("subscriptionFirestore.createFirestoreSubscription", error, {
      path: `users/${userId}/subscriptions`,
      userId,
      input: payload,
    });
    throw error;
  }
};

export const updateFirestoreSubscription = async (
  userId: string,
  id: string,
  input: Partial<SubscriptionInput>,
) => {
  const payload = removeUndefinedFields({
    ...input,
    updatedAt: serverTimestamp(),
  });

  try {
    await updateDoc(subscriptionDoc(userId, id), payload);
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
