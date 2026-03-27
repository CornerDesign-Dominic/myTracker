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

const syncUserDocument = async (user: User, upgradedAt = false) => {
  if (!hasRequiredFirebaseConfig) {
    return;
  }

  try {
    await ensureUserDocument({
      userId: user.uid,
      email: user.email,
      isAnonymous: user.isAnonymous,
      upgradedAt,
      providerIds: user.providerData.map((provider) => provider.providerId),
    });
  } catch {
    // Auth must stay usable even if Firestore rules are not deployed yet.
  }
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const signInAnonymous = async () => {
    const auth = ensureAuth();
    const credential = await signInAnonymously(auth);
    await syncUserDocument(credential.user);
  };

  useEffect(() => {
    if (!hasRequiredFirebaseConfig) {
      setIsInitializing(false);
      return;
    }

    const auth = ensureAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
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
