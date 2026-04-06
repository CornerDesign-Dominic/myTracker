import {
  deleteField,
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
  weekStart?: "monday" | "sunday";
  notificationsEnabled?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type UserStatsMirrorDocument = {
  subscriptionCount?: number;
  isPremium?: boolean;
  updatedAt?: unknown;
};

export type PendingRegistrationDocument = {
  status: "pending" | "confirmed" | "cancelled" | "expired";
  pendingEmail: string;
  startedAt: string;
  expiresAt: string;
  lastRequestedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
};

export type UserDocument = {
  email?: string | null;
  isAnonymous?: boolean;
  providerIds?: string[];
  pendingRegistration?: PendingRegistrationDocument | null;
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

const mapPendingRegistration = (value: unknown): PendingRegistrationDocument | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const entry = value as Record<string, unknown>;

  if (
    !["pending", "confirmed", "cancelled", "expired"].includes(String(entry.status)) ||
    typeof entry.pendingEmail !== "string" ||
    typeof entry.startedAt !== "string" ||
    typeof entry.expiresAt !== "string" ||
    typeof entry.lastRequestedAt !== "string"
  ) {
    return null;
  }

  return {
    status: entry.status as PendingRegistrationDocument["status"],
    pendingEmail: entry.pendingEmail,
    startedAt: entry.startedAt,
    expiresAt: entry.expiresAt,
    lastRequestedAt: entry.lastRequestedAt,
    confirmedAt: typeof entry.confirmedAt === "string" ? entry.confirmedAt : undefined,
    cancelledAt: typeof entry.cancelledAt === "string" ? entry.cancelledAt : undefined,
  };
};

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

export const subscribeToUserDocument = (
  userId: string,
  callback: (document: UserDocument | null) => void,
  onError?: (error: Error) => void,
) =>
  onSnapshot(
    userDocRef(userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const data = snapshot.data();
      callback({
        email: typeof data.email === "string" ? data.email : null,
        isAnonymous: typeof data.isAnonymous === "boolean" ? data.isAnonymous : undefined,
        providerIds: Array.isArray(data.providerIds)
          ? data.providerIds.filter((item): item is string => typeof item === "string")
          : undefined,
        pendingRegistration: mapPendingRegistration(data.pendingRegistration),
        updatedAt: data.updatedAt,
      });
    },
    (error) => {
      logFirestoreError("userFirestore.subscribeToUserDocument", error, {
        path: `users/${userId}`,
        userId,
      });
      onError?.(error);
    },
  );

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

export const updateUserPendingRegistration = async (
  userId: string,
  pendingRegistration: PendingRegistrationDocument | null,
) => {
  try {
    await setDoc(
      userDocRef(userId),
      {
        pendingRegistration: pendingRegistration ?? deleteField(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    logFirestoreError("userFirestore.updateUserPendingRegistration", error, {
      path: `users/${userId}`,
      userId,
      pendingRegistration,
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
