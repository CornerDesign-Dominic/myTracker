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
import { crashlyticsService } from "@/services/crashlytics/crashlytics";
import {
  PendingRegistrationDocument,
  ensureUserDocument,
  subscribeToUserDocument,
  updateUserPendingRegistration,
} from "@/services/firestore/userFirestore";
import { logFirestoreError } from "@/utils/firestoreDebug";

const PENDING_REGISTRATION_WINDOW_MS = 72 * 60 * 60 * 1000;

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
  resendPendingRegistration: () => Promise<void>;
  cancelPendingRegistration: () => Promise<void>;
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

  console.log("[Auth] ensureUserDocument:start", payload);

  try {
    await ensureUserDocument(payload);
    console.log("[Auth] ensureUserDocument:success", payload);
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
    console.log("[Auth] signInAnonymous:start");
    const credential = await signInAnonymously(auth);
    console.log("[Auth] signInAnonymous:success", {
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
      console.log("[Auth] onAuthStateChanged", {
        hasUser: Boolean(user),
        uid: user?.uid ?? null,
        isAnonymous: user?.isAnonymous ?? null,
        email: user?.email ?? null,
      });

      try {
        if (!user) {
          console.log("[Auth] onAuthStateChanged:no-user -> starting anonymous sign-in");
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
      setPendingRegistration(null);
      return;
    }

    const unsubscribe = subscribeToUserDocument(currentUser.uid, (document) => {
      const nextPendingRegistration =
        currentUser.isAnonymous ? document?.pendingRegistration ?? null : null;
      setPendingRegistration(nextPendingRegistration);
    });

    return unsubscribe;
  }, [currentUser?.uid, currentUser?.isAnonymous, isLoggingOut]);

  const login = async (email: string, password: string) => {
    const auth = ensureAuth();
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    setCurrentUser(credential.user);
    await syncUserDocument(credential.user);
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

    const credential = EmailAuthProvider.credential(email.trim(), password);
    const linkedUser = await linkWithCredential(user, credential);
    setCurrentUser(linkedUser.user);
    await syncUserDocument(linkedUser.user, true);
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
    await sendPasswordResetEmail(auth, email.trim());
  };

  const startPendingRegistration = async (email: string) => {
    const userId = currentUser?.uid;

    if (!userId || !currentUser?.isAnonymous) {
      throw new Error("Pending registration requires an anonymous user.");
    }

    const auth = ensureAuth();
    const signInMethods = await fetchSignInMethodsForEmail(auth, email.trim());

    if (signInMethods.length > 0) {
      const error = new Error("Email already in use.");
      (error as Error & { code?: string }).code = "auth/email-already-in-use";
      throw error;
    }

    const now = new Date();
    const pendingEntry: PendingRegistrationDocument = {
      status: "pending",
      pendingEmail: email.trim(),
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + PENDING_REGISTRATION_WINDOW_MS).toISOString(),
      lastRequestedAt: now.toISOString(),
    };

    await updateUserPendingRegistration(userId, pendingEntry);
    setPendingRegistration(pendingEntry);
  };

  const resendPendingRegistration = async () => {
    const userId = currentUser?.uid;

    if (!userId || !pendingRegistration || !currentUser?.isAnonymous) {
      throw new Error("No pending registration available.");
    }

    const now = new Date();
    const nextPendingRegistration: PendingRegistrationDocument = {
      ...pendingRegistration,
      expiresAt: new Date(now.getTime() + PENDING_REGISTRATION_WINDOW_MS).toISOString(),
      lastRequestedAt: now.toISOString(),
    };

    await updateUserPendingRegistration(userId, nextPendingRegistration);
    setPendingRegistration(nextPendingRegistration);
  };

  const cancelPendingRegistration = async () => {
    const userId = currentUser?.uid;

    if (!userId || !currentUser?.isAnonymous) {
      throw new Error("No pending registration available.");
    }

    await updateUserPendingRegistration(userId, null);
    setPendingRegistration(null);
  };

  const logout = async () => {
    const auth = ensureAuth();
    setIsLoggingOut(true);

    try {
      await signOut(auth);
    } catch (error) {
      setIsLoggingOut(false);
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
