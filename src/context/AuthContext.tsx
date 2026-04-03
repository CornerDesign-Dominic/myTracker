import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { firebaseAuth, hasRequiredFirebaseConfig } from "@/firebase/config";
import {
  finalizePendingRegistrationRequest,
  resendPendingRegistrationRequest,
  startPendingRegistrationRequest,
} from "@/services/auth/pendingRegistrationApi";
import { crashlyticsService } from "@/services/crashlytics/crashlytics";
import {
  PendingRegistrationDocument,
  ensureUserDocument,
  subscribeToUserDocument,
  updateUserPendingRegistration,
} from "@/services/firestore/userFirestore";
import { logFirestoreError } from "@/utils/firestoreDebug";

const PENDING_REGISTRATION_WINDOW_MS = 72 * 60 * 60 * 1000;
const AUTH_DEBUG_PREFIX = "[AuthDebug]";

type AuthContextValue = {
  currentUser: User | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  authIsReady: boolean;
  pendingRegistration: PendingRegistrationDocument | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  startPendingRegistration: (email: string) => Promise<void>;
  resendPendingRegistration: () => Promise<"resent" | "confirmed" | "blocked">;
  cancelPendingRegistration: () => Promise<void>;
  completePendingRegistration: (password: string) => Promise<void>;
  signInAnonymous: () => Promise<void>;
  upgradeAnonymousAccount: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ensureAuth = () => {
  if (!firebaseAuth || !hasRequiredFirebaseConfig) {
    throw new Error("Firebase Auth is not configured.");
  }

  return firebaseAuth;
};

const syncUserDocument = async (user: User, upgradedAt = false) => {
  if (!hasRequiredFirebaseConfig) {
    return;
  }

  const payload = {
    userId: user.uid,
    email: user.email,
    isAnonymous: user.isAnonymous,
    upgradedAt,
    providerIds: user.providerData.map((provider) => provider.providerId),
  };

  console.log(`${AUTH_DEBUG_PREFIX} ensureUserDocument:start`, payload);

  try {
    await ensureUserDocument(payload);
    console.log(`${AUTH_DEBUG_PREFIX} ensureUserDocument:success`, payload);
  } catch (error) {
    logFirestoreError("Auth.ensureUserDocument", error, payload);
  }
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistrationDocument | null>(null);

  useEffect(() => {
    crashlyticsService.setUserId(currentUser?.uid ?? null);
  }, [currentUser?.uid]);

  const signInAnonymous = async () => {
    const auth = ensureAuth();
    console.log(`${AUTH_DEBUG_PREFIX} signInAnonymous:start`);
    const credential = await signInAnonymously(auth);
    console.log(`${AUTH_DEBUG_PREFIX} signInAnonymous:success`, {
      uid: credential.user.uid,
      isAnonymous: credential.user.isAnonymous,
      email: credential.user.email,
    });
    await syncUserDocument(credential.user);
  };

  useEffect(() => {
    if (!hasRequiredFirebaseConfig) {
      setIsInitializing(false);
      return;
    }

    const auth = ensureAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(`${AUTH_DEBUG_PREFIX} onAuthStateChanged`, {
        hasUser: Boolean(user),
        uid: user?.uid ?? null,
        isAnonymous: user?.isAnonymous ?? null,
        email: user?.email ?? null,
      });

      try {
        if (!user) {
          console.log(`${AUTH_DEBUG_PREFIX} onAuthStateChanged:no-user -> starting anonymous sign-in`);
          await signInAnonymous();
          return;
        }

        setCurrentUser(user);
        await syncUserDocument(user);
      } finally {
        setIsLoggingOut(false);
        setIsInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoggingOut || !currentUser?.uid || !hasRequiredFirebaseConfig) {
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:subscription:skip`, {
        isLoggingOut,
        hasUserId: Boolean(currentUser?.uid),
        hasFirebaseConfig: hasRequiredFirebaseConfig,
      });
      setPendingRegistration(null);
      return;
    }

    const unsubscribe = subscribeToUserDocument(currentUser.uid, (document) => {
      const nextPendingRegistration =
        currentUser.isAnonymous ? document?.pendingRegistration ?? null : null;
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:update`, {
        uid: currentUser.uid,
        isAnonymous: currentUser.isAnonymous,
        status: nextPendingRegistration?.status ?? null,
        pendingEmail: nextPendingRegistration?.pendingEmail ?? null,
        expiresAt: nextPendingRegistration?.expiresAt ?? null,
      });
      setPendingRegistration(nextPendingRegistration);
    });

    return unsubscribe;
  }, [currentUser?.uid, currentUser?.isAnonymous, isLoggingOut]);

  const login = async (email: string, password: string) => {
    const auth = ensureAuth();
    const trimmedEmail = email.trim();
    console.log(`${AUTH_DEBUG_PREFIX} login:start`, { email: trimmedEmail });

    try {
      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      console.log(`${AUTH_DEBUG_PREFIX} login:success`, {
        uid: credential.user.uid,
        email: credential.user.email,
        isAnonymous: credential.user.isAnonymous,
      });
      setCurrentUser(credential.user);
      await syncUserDocument(credential.user);
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} login:error`, {
        email: trimmedEmail,
        message: error instanceof Error ? error.message : String(error),
        code:
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof (error as { code?: unknown }).code === "string"
            ? (error as { code: string }).code
            : null,
      });
      throw error;
    }
  };

  const upgradeAnonymousAccount = async (email: string, password: string) => {
    const auth = ensureAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Kein aktiver Benutzer vorhanden.");
    }

    if (!user.isAnonymous) {
      throw new Error("Dieser Account wurde bereits aufgewertet.");
    }

    console.log(`${AUTH_DEBUG_PREFIX} upgradeAnonymousAccount:start`, {
      uid: user.uid,
      email: email.trim(),
    });
    const credential = EmailAuthProvider.credential(email.trim(), password);
    try {
      const linkedUser = await linkWithCredential(user, credential);
      console.log(`${AUTH_DEBUG_PREFIX} upgradeAnonymousAccount:success`, {
        uid: linkedUser.user.uid,
        email: linkedUser.user.email,
        isAnonymous: linkedUser.user.isAnonymous,
      });
      setCurrentUser(linkedUser.user);
      await syncUserDocument(linkedUser.user, true);
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} upgradeAnonymousAccount:error`, {
        uid: user.uid,
        email: email.trim(),
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    const auth = ensureAuth();
    const current = auth.currentUser;

    if (current?.isAnonymous) {
      await upgradeAnonymousAccount(email, password);
      return;
    }

    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    setCurrentUser(credential.user);
    await syncUserDocument(credential.user);
  };

  const requestPasswordReset = async (email: string) => {
    const auth = ensureAuth();
    const trimmedEmail = email.trim();
    console.log(`${AUTH_DEBUG_PREFIX} passwordReset:start`, { email: trimmedEmail });

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      console.log(`${AUTH_DEBUG_PREFIX} passwordReset:success`, { email: trimmedEmail });
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} passwordReset:error`, {
        email: trimmedEmail,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const startPendingRegistration = async (email: string) => {
    const userId = currentUser?.uid;

    if (!userId || !currentUser?.isAnonymous) {
      throw new Error("Pending registration requires an anonymous user.");
    }

    const auth = ensureAuth();
    const trimmedEmail = email.trim();
    console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:start`, {
      uid: userId,
      email: trimmedEmail,
    });
    const signInMethods = await fetchSignInMethodsForEmail(auth, trimmedEmail);

    if (signInMethods.length > 0) {
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:email-in-use`, {
        uid: userId,
        email: trimmedEmail,
        signInMethods,
      });
      const error = new Error("Email already in use.");
      (error as Error & { code?: string }).code = "auth/email-already-in-use";
      throw error;
    }

    try {
      const idToken = await currentUser.getIdToken();
      await startPendingRegistrationRequest({
        idToken,
        email: trimmedEmail,
      });

      const now = new Date();
      const pendingEntry: PendingRegistrationDocument = {
        status: "pending",
        pendingEmail: trimmedEmail,
        startedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + PENDING_REGISTRATION_WINDOW_MS).toISOString(),
        lastRequestedAt: now.toISOString(),
      };

      await updateUserPendingRegistration(userId, pendingEntry);
      setPendingRegistration(pendingEntry);
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:success`, {
        uid: userId,
        email: trimmedEmail,
        expiresAt: pendingEntry.expiresAt,
      });
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:error`, {
        uid: userId,
        email: trimmedEmail,
        code:
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof (error as { code?: unknown }).code === "string"
            ? (error as { code: string }).code
            : null,
        status:
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          typeof (error as { status?: unknown }).status === "number"
            ? (error as { status: number }).status
            : null,
        body:
          typeof error === "object" &&
          error !== null &&
          "body" in error &&
          typeof (error as { body?: unknown }).body === "string"
            ? (error as { body: string }).body
            : null,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const resendPendingRegistration = async () => {
    const userId = currentUser?.uid;

    if (!userId || !pendingRegistration || !currentUser?.isAnonymous) {
      throw new Error("No pending registration available.");
    }

    if (pendingRegistration.status !== "pending") {
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:resend:blocked-local`, {
        uid: userId,
        email: pendingRegistration.pendingEmail,
        localStatus: pendingRegistration.status,
      });
      return pendingRegistration.status === "confirmed" ? "confirmed" : "blocked";
    }

    if (new Date(pendingRegistration.expiresAt).getTime() <= Date.now()) {
      const expiredRegistration: PendingRegistrationDocument = {
        ...pendingRegistration,
        status: "expired",
      };
      setPendingRegistration(expiredRegistration);
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:resend:blocked-local-expired`, {
        uid: userId,
        email: pendingRegistration.pendingEmail,
        expiresAt: pendingRegistration.expiresAt,
      });
      return "blocked";
    }

    console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:resend:start`, {
      uid: userId,
      email: pendingRegistration.pendingEmail,
      previousStatus: pendingRegistration.status,
    });

    try {
      const idToken = await currentUser.getIdToken();
      await resendPendingRegistrationRequest({ idToken });

      const now = new Date();
      const nextPendingRegistration: PendingRegistrationDocument = {
        ...pendingRegistration,
        status: "pending",
        expiresAt: new Date(now.getTime() + PENDING_REGISTRATION_WINDOW_MS).toISOString(),
        lastRequestedAt: now.toISOString(),
        confirmedAt: undefined,
        cancelledAt: undefined,
      };

      await updateUserPendingRegistration(userId, nextPendingRegistration);
      setPendingRegistration(nextPendingRegistration);
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:resend:success`, {
        uid: userId,
        email: nextPendingRegistration.pendingEmail,
        expiresAt: nextPendingRegistration.expiresAt,
      });
      return "resent";
    } catch (error) {
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : null;
      const errorStatus =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof (error as { status?: unknown }).status === "number"
          ? (error as { status: number }).status
          : null;

      if (errorCode === "registration-already-confirmed") {
        const confirmedRegistration: PendingRegistrationDocument = {
          ...pendingRegistration,
          status: "confirmed",
          confirmedAt: new Date().toISOString(),
        };
        setPendingRegistration(confirmedRegistration);
        console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:resend:resolved-confirmed`, {
          uid: userId,
          email: pendingRegistration.pendingEmail,
          backendCode: errorCode,
          backendStatus: errorStatus,
        });
        return "confirmed";
      }

      if (errorCode === "pending-registration-expired") {
        const expiredRegistration: PendingRegistrationDocument = {
          ...pendingRegistration,
          status: "expired",
        };
        setPendingRegistration(expiredRegistration);
        console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:resend:resolved-expired`, {
          uid: userId,
          email: pendingRegistration.pendingEmail,
          backendCode: errorCode,
          backendStatus: errorStatus,
        });
        return "blocked";
      }

      if (errorCode === "registration-cancelled") {
        const cancelledRegistration: PendingRegistrationDocument = {
          ...pendingRegistration,
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
        };
        setPendingRegistration(cancelledRegistration);
        console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:resend:resolved-cancelled`, {
          uid: userId,
          email: pendingRegistration.pendingEmail,
          backendCode: errorCode,
          backendStatus: errorStatus,
        });
        return "blocked";
      }

      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:resend:error`, {
        uid: userId,
        email: pendingRegistration.pendingEmail,
        code: errorCode,
        status: errorStatus,
        body:
          typeof error === "object" &&
          error !== null &&
          "body" in error &&
          typeof (error as { body?: unknown }).body === "string"
            ? (error as { body: string }).body
            : null,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const cancelPendingRegistration = async () => {
    const userId = currentUser?.uid;

    if (!userId || !currentUser?.isAnonymous) {
      throw new Error("No pending registration available.");
    }

    console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:cancel:start`, {
      uid: userId,
      email: pendingRegistration?.pendingEmail ?? null,
      status: pendingRegistration?.status ?? null,
    });

    const cancelledRegistration: PendingRegistrationDocument | null = pendingRegistration
      ? {
          ...pendingRegistration,
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
        }
      : null;

    try {
      await updateUserPendingRegistration(userId, cancelledRegistration);
      setPendingRegistration(cancelledRegistration);
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:cancel:success`, {
        uid: userId,
        email: cancelledRegistration?.pendingEmail ?? null,
      });
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:cancel:error`, {
        uid: userId,
        email: pendingRegistration?.pendingEmail ?? null,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const completePendingRegistration = async (password: string) => {
    const userId = currentUser?.uid;

    if (!userId || !currentUser?.isAnonymous || !pendingRegistration) {
      throw new Error("No confirmed pending registration available.");
    }

    if (pendingRegistration.status !== "confirmed") {
      const error = new Error("Pending registration is not confirmed.");
      (error as Error & { code?: string }).code = "pending-registration-not-confirmed";
      throw error;
    }

    if (new Date(pendingRegistration.expiresAt).getTime() <= Date.now()) {
      const error = new Error("Pending registration expired.");
      (error as Error & { code?: string }).code = "pending-registration-expired";
      throw error;
    }

    console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:complete:start`, {
      uid: userId,
      email: pendingRegistration.pendingEmail,
      status: pendingRegistration.status,
    });

    try {
      const idToken = await currentUser.getIdToken();
      const finalizeResponse = await finalizePendingRegistrationRequest({ idToken });
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:complete:finalize-success`, {
        uid: userId,
        email: finalizeResponse.email,
      });

      await upgradeAnonymousAccount(finalizeResponse.email, password);
      await updateUserPendingRegistration(userId, null);
      setPendingRegistration(null);
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:complete:success`, {
        uid: userId,
        email: finalizeResponse.email,
      });
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:complete:error`, {
        uid: userId,
        email: pendingRegistration.pendingEmail,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const logout = async () => {
    const auth = ensureAuth();
    setIsLoggingOut(true);
    console.log(`${AUTH_DEBUG_PREFIX} logout:start`, {
      uid: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
    });

    try {
      await signOut(auth);
      console.log(`${AUTH_DEBUG_PREFIX} logout:success`);
    } catch (error) {
      setIsLoggingOut(false);
      console.log(`${AUTH_DEBUG_PREFIX} logout:error`, {
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      isAnonymous: Boolean(currentUser?.isAnonymous),
      isAuthenticated: Boolean(currentUser),
      isInitializing,
      authIsReady: !isInitializing && !isLoggingOut,
      pendingRegistration,
      login,
      register,
      requestPasswordReset,
      startPendingRegistration,
      resendPendingRegistration,
      cancelPendingRegistration,
      completePendingRegistration,
      signInAnonymous,
      upgradeAnonymousAccount,
      logout,
    }),
    [currentUser, isInitializing, isLoggingOut, pendingRegistration],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
};
