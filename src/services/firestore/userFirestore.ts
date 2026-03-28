import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { firestoreDb } from "@/firebase/config";

export type UserSettingsDocument = {
  language: "de" | "en";
  currency: "EUR" | "Dollar";
  theme: "Dark" | "Light";
  createdAt?: unknown;
  updatedAt?: unknown;
};

const ensureFirestore = () => {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured.");
  }

  return firestoreDb;
};

const userDocRef = (userId: string) => doc(ensureFirestore(), "users", userId);
const settingsDocRef = (userId: string) => doc(ensureFirestore(), "users", userId, "settings", "app");

export const ensureUserDocument = async (params: {
  userId: string;
  email: string | null;
  isAnonymous: boolean;
  upgradedAt?: boolean;
  providerIds?: string[];
}) => {
  console.log("[Firestore] setDoc users/{userId}:start", {
    path: `users/${params.userId}`,
    userId: params.userId,
    email: params.email,
    isAnonymous: params.isAnonymous,
    providerIds: params.providerIds ?? [],
    upgradedAt: Boolean(params.upgradedAt),
  });

  await setDoc(
    userDocRef(params.userId),
    {
      email: params.email,
      isAnonymous: params.isAnonymous,
      providerIds: params.providerIds ?? [],
      ...(params.upgradedAt ? { upgradedAt: serverTimestamp() } : {}),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  console.log("[Firestore] setDoc users/{userId}:success", {
    path: `users/${params.userId}`,
    userId: params.userId,
  });
};

export const ensureSettingsDocument = async (
  userId: string,
  settings: Omit<UserSettingsDocument, "createdAt" | "updatedAt">,
) => {
  console.log("[Firestore] setDoc users/{userId}/settings/app:start", {
    path: `users/${userId}/settings/app`,
    userId,
    settings,
  });

  await setDoc(
    settingsDocRef(userId),
    {
      ...settings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  console.log("[Firestore] setDoc users/{userId}/settings/app:success", {
    path: `users/${userId}/settings/app`,
    userId,
  });
};

export const subscribeToUserSettings = (
  userId: string,
  callback: (settings: UserSettingsDocument | null) => void,
  onError?: (error: Error) => void,
) => {
  return onSnapshot(
    settingsDocRef(userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(snapshot.data() as UserSettingsDocument);
    },
    (error) => {
      onError?.(error);
    },
  );
};

export const updateUserSettings = async (
  userId: string,
  settings: Partial<Omit<UserSettingsDocument, "createdAt" | "updatedAt">>,
) => {
  await setDoc(
    settingsDocRef(userId),
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const serializeTimestamp = (value: unknown) => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
};
