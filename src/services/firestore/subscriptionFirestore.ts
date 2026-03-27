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

const COLLECTION_NAME = "subscriptions";

const ensureFirestore = () => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured.");
  }

  return firestoreDb;
};

const serializeTimestamp = (value: unknown) => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
};

const mapSubscription = (id: string, data: Record<string, unknown>): Subscription => ({
  id,
  name: String(data.name ?? ""),
  category: String(data.category ?? ""),
  price: Number(data.price ?? 0),
  currency: String(data.currency ?? "EUR"),
  billingCycle: (data.billingCycle as Subscription["billingCycle"]) ?? "monthly",
  nextPaymentDate: String(data.nextPaymentDate ?? ""),
  cancellationDeadline: data.cancellationDeadline
    ? String(data.cancellationDeadline)
    : undefined,
  status: (data.status as Subscription["status"]) ?? "active",
  endDate: data.endDate ? String(data.endDate) : undefined,
  notes: data.notes ? String(data.notes) : undefined,
  createdAt: serializeTimestamp(data.createdAt),
  updatedAt: serializeTimestamp(data.updatedAt),
  archivedAt: data.archivedAt ? serializeTimestamp(data.archivedAt) : null,
});

export const subscribeToFirestoreSubscriptions = (
  callback: (subscriptions: Subscription[]) => void,
) => {
  const db = ensureFirestore();
  const subscriptionQuery = query(
    collection(db, COLLECTION_NAME),
    where("archivedAt", "==", null),
    orderBy("nextPaymentDate", "asc"),
  );

  return onSnapshot(subscriptionQuery, (snapshot) => {
    const items = snapshot.docs.map((snapshotItem) =>
      mapSubscription(snapshotItem.id, snapshotItem.data()),
    );
    callback(items);
  });
};

export const createFirestoreSubscription = async (input: SubscriptionInput) => {
  const db = ensureFirestore();
  const collectionRef = collection(db, COLLECTION_NAME);

  await addDoc(collectionRef, {
    ...input,
    archivedAt: null,
    userId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateFirestoreSubscription = async (
  id: string,
  input: Partial<SubscriptionInput>,
) => {
  const db = ensureFirestore();

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
};

export const archiveFirestoreSubscription = async (id: string) => {
  const db = ensureFirestore();

  await updateDoc(doc(db, COLLECTION_NAME, id), {
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};
