import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Auth, Persistence } from "firebase/auth";
import * as FirebaseAuth from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAGxIceK-AabrSLO8Z3in7Z8SZrC3cjKGo",
  authDomain: "mytracker-0.firebaseapp.com",
  projectId: "mytracker-0",
  storageBucket: "mytracker-0.firebasestorage.app",
  messagingSenderId: "304610414523",
  appId: "1:304610414523:web:7948365ebe0fd51d61fe9e"
};

const hasRequiredFirebaseConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId,
);

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

if (hasRequiredFirebaseConfig) {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firestoreDb = getFirestore(firebaseApp);

  if (Platform.OS === "web") {
    firebaseAuth = FirebaseAuth.getAuth(firebaseApp);
  } else {
    try {
      const getReactNativePersistence = (
        FirebaseAuth as typeof FirebaseAuth & {
          getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
        }
      ).getReactNativePersistence;

      firebaseAuth = FirebaseAuth.initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence?.(AsyncStorage),
      });
    } catch {
      firebaseAuth = FirebaseAuth.getAuth(firebaseApp);
    }
  }
}

export { firebaseApp, firestoreDb, firebaseAuth, hasRequiredFirebaseConfig };
