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
      onError?.(error);
    },
  );
};

export const createFirestoreSubscription = async (userId: string, input: SubscriptionInput) => {
  await addDoc(subscriptionsCollection(userId), {
    ...input,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateFirestoreSubscription = async (
  userId: string,
  id: string,
  input: Partial<SubscriptionInput>,
) => {
  await updateDoc(subscriptionDoc(userId, id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
};

export const archiveFirestoreSubscription = async (userId: string, id: string) => {
  await updateDoc(subscriptionDoc(userId, id), {
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
