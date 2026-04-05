import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { firebaseAuth, hasRequiredFirebaseConfig } from "@/firebase/config";
import { analyticsEventNames } from "@/services/analytics/events";
import { analyticsService } from "@/services/analytics/service";
import {
  cancelPendingRegistrationRequest,
  confirmPendingRegistrationRequest,
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
  changePassword: (currentPassword: string, nextPassword: string) => Promise<void>;
  startPendingRegistration: (email: string) => Promise<void>;
  resendPendingRegistration: () => Promise<"resent" | "confirmed" | "blocked">;
  cancelPendingRegistration: () => Promise<void>;
  confirmPendingRegistrationLink: (token: string) => Promise<{ email: string; status: "confirmed" }>;
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
  const previousPendingRegistrationStatusRef = useRef<PendingRegistrationDocument["status"] | null>(null);

  useEffect(() => {
    crashlyticsService.setUserId(currentUser?.uid ?? null);
    analyticsService.setUserId(currentUser?.uid ?? null);
  }, [currentUser?.uid]);

  const signInAnonymous = async () => {
    const auth = ensureAuth();
    console.log(`${AUTH_DEBUG_PREFIX} signInAnonymous:start`);
    const credential = await signInAnonymously(auth);
    analyticsService.track(analyticsEventNames.anonymousStart, {
      uid: credential.user.uid,
    });
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
      const previousStatus = previousPendingRegistrationStatusRef.current;
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:update`, {
        uid: currentUser.uid,
        isAnonymous: currentUser.isAnonymous,
        previousStatus,
        status: nextPendingRegistration?.status ?? null,
        pendingEmail: nextPendingRegistration?.pendingEmail ?? null,
        expiresAt: nextPendingRegistration?.expiresAt ?? null,
        confirmedAt: nextPendingRegistration?.confirmedAt ?? null,
      });

      if (previousStatus !== nextPendingRegistration?.status && nextPendingRegistration?.status === "confirmed") {
        console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:transition:confirmed`, {
          uid: currentUser.uid,
          pendingEmail: nextPendingRegistration.pendingEmail,
          confirmedAt: nextPendingRegistration.confirmedAt ?? null,
          expiresAt: nextPendingRegistration.expiresAt,
        });
      }

      previousPendingRegistrationStatusRef.current = nextPendingRegistration?.status ?? null;
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
      analyticsService.track(analyticsEventNames.loginSuccess, {
        uid: credential.user.uid,
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
      analyticsService.track(analyticsEventNames.passwordResetRequested, {
        emailDomain: trimmedEmail.split("@")[1] ?? null,
      });
      console.log(`${AUTH_DEBUG_PREFIX} passwordReset:success`, { email: trimmedEmail });
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} passwordReset:error`, {
        email: trimmedEmail,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, nextPassword: string) => {
    const auth = ensureAuth();
    const user = auth.currentUser;

    if (!user || user.isAnonymous || !user.email) {
      const error = new Error("No linked email account available.");
      (error as Error & { code?: string }).code = "auth/no-linked-email-account";
      throw error;
    }

    console.log(`${AUTH_DEBUG_PREFIX} changePassword:start`, {
      uid: user.uid,
      email: user.email,
      currentPasswordLength: currentPassword.length,
      nextPasswordLength: nextPassword.length,
    });

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, nextPassword);
      console.log(`${AUTH_DEBUG_PREFIX} changePassword:success`, {
        uid: user.uid,
        email: user.email,
      });
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} changePassword:error`, {
        uid: user.uid,
        email: user.email,
        code:
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof (error as { code?: unknown }).code === "string"
            ? (error as { code: string }).code
            : null,
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
    const trimmedEmail = email.trim().toLowerCase();
    const previousPendingRegistration = pendingRegistration;
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

    const now = new Date();
    const optimisticPendingEntry: PendingRegistrationDocument = {
      status: "pending",
      pendingEmail: trimmedEmail,
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + PENDING_REGISTRATION_WINDOW_MS).toISOString(),
      lastRequestedAt: now.toISOString(),
    };

    setPendingRegistration(optimisticPendingEntry);
    console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:start:optimistic-local-state`, {
      uid: userId,
      email: trimmedEmail,
      previousStatus: previousPendingRegistration?.status ?? null,
      nextStatus: optimisticPendingEntry.status,
    });

    try {
      const idToken = await currentUser.getIdToken();
      await startPendingRegistrationRequest({
        idToken,
        email: trimmedEmail,
      });
      analyticsService.track(analyticsEventNames.pendingRegistrationStarted, {
        uid: userId,
        emailDomain: trimmedEmail.split("@")[1] ?? null,
      });
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:success`, {
        uid: userId,
        email: trimmedEmail,
        expiresAt: optimisticPendingEntry.expiresAt,
      });
    } catch (error) {
      setPendingRegistration(previousPendingRegistration);
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
      const idToken = await currentUser.getIdToken();
      await cancelPendingRegistrationRequest({ idToken });
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

  const confirmPendingRegistrationLink = async (token: string) => {
    const userId = currentUser?.uid;

    if (!userId || !currentUser?.isAnonymous) {
      throw new Error("Pending registration confirmation requires an anonymous user.");
    }

    const trimmedToken = token.trim();

    if (!trimmedToken) {
      const error = new Error("Registration token is invalid.");
      (error as Error & { code?: string }).code = "invalid-registration-token";
      throw error;
    }

    console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:confirm-link:start`, {
      uid: userId,
      localStatus: pendingRegistration?.status ?? null,
      pendingEmail: pendingRegistration?.pendingEmail ?? null,
      tokenLength: trimmedToken.length,
    });

    try {
      const idToken = await currentUser.getIdToken();
      const confirmResponse = await confirmPendingRegistrationRequest({
        idToken,
        token: trimmedToken,
      });

      setPendingRegistration((previous) =>
        previous
          ? {
              ...previous,
              status: "confirmed",
              pendingEmail: confirmResponse.email,
              confirmedAt: new Date().toISOString(),
            }
          : previous,
      );

      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:confirm-link:success`, {
        uid: userId,
        email: confirmResponse.email,
        status: confirmResponse.status,
      });

      return confirmResponse;
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:confirm-link:error`, {
        uid: userId,
        pendingEmail: pendingRegistration?.pendingEmail ?? null,
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

  const completePendingRegistration = async (password: string) => {
    const userId = currentUser?.uid;

    if (!userId || !currentUser?.isAnonymous) {
      throw new Error("No pending registration available.");
    }

    console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:complete:start`, {
      uid: userId,
      email: pendingRegistration?.pendingEmail ?? null,
      status: pendingRegistration?.status ?? null,
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
      analyticsService.track(analyticsEventNames.pendingRegistrationCompleted, {
        uid: userId,
        emailDomain: finalizeResponse.email.split("@")[1] ?? null,
      });
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:complete:success`, {
        uid: userId,
        email: finalizeResponse.email,
      });
    } catch (error) {
      console.log(`${AUTH_DEBUG_PREFIX} pendingRegistration:complete:error`, {
        uid: userId,
        email: pendingRegistration?.pendingEmail ?? null,
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
      changePassword,
        startPendingRegistration,
        resendPendingRegistration,
        cancelPendingRegistration,
        confirmPendingRegistrationLink,
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
