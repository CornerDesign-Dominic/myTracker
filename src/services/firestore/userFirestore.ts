import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import { firestoreDb } from "@/firebase/config";
import { logFirestoreError } from "@/utils/firestoreDebug";

export type UserSettingsDocument = {
  language: "de" | "en";
  currency: "EUR" | "Dollar";
  theme: "Dark" | "Light";
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type UserStatsMirrorDocument = {
  subscriptionCount?: number;
  isPremium?: boolean;
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

  try {
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
  } catch (error) {
    logFirestoreError("userFirestore.ensureUserDocument", error, {
      path: `users/${params.userId}`,
      userId: params.userId,
    });
    throw error;
  }

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

  try {
    await setDoc(
      settingsDocRef(userId),
      {
        ...settings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    logFirestoreError("userFirestore.ensureSettingsDocument", error, {
      path: `users/${userId}/settings/app`,
      userId,
      settings,
    });
    throw error;
  }

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
      logFirestoreError("userFirestore.subscribeToUserSettings", error, {
        path: `users/${userId}/settings/app`,
        userId,
      });
      onError?.(error);
    },
  );
};

export const updateUserSettings = async (
  userId: string,
  settings: Partial<Omit<UserSettingsDocument, "createdAt" | "updatedAt">>,
) => {
  try {
    await setDoc(
      settingsDocRef(userId),
      {
        ...settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    logFirestoreError("userFirestore.updateUserSettings", error, {
      path: `users/${userId}/settings/app`,
      userId,
      settings,
    });
    throw error;
  }
};

export const updateUserStatsMirror = async (
  userId: string,
  stats: Omit<UserStatsMirrorDocument, "updatedAt">,
) => {
  try {
    await setDoc(
      userDocRef(userId),
      {
        ...stats,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    logFirestoreError("userFirestore.updateUserStatsMirror", error, {
      path: `users/${userId}`,
      userId,
      stats,
    });
    throw error;
  }
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
