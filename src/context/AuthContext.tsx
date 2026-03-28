import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  linkWithCredential,
  onAuthStateChanged,
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
import { ensureUserDocument } from "@/services/firestore/userFirestore";

type AuthContextValue = {
  currentUser: User | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  authIsReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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

const getErrorDetails = (error: unknown) => ({
  code:
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : undefined,
  message: error instanceof Error ? error.message : String(error),
});

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
    const details = getErrorDetails(error);
    console.error("[Auth] ensureUserDocument:error", {
      ...payload,
      code: details.code,
      message: details.message,
      error,
    });
  }
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

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
        setIsInitializing(false);
      }
    });

    return unsubscribe;
  }, []);

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

  const logout = async () => {
    const auth = ensureAuth();
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      currentUser,
      isAnonymous: Boolean(currentUser?.isAnonymous),
      isAuthenticated: Boolean(currentUser),
      isInitializing,
      authIsReady: !isInitializing,
      login,
      register,
      signInAnonymous,
      upgradeAnonymousAccount,
      logout,
    }),
    [currentUser, isInitializing],
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
