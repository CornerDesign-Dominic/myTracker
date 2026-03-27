import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Firestore, getFirestore } from "firebase/firestore";

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

if (hasRequiredFirebaseConfig) {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firestoreDb = getFirestore(firebaseApp);
}

export { firebaseApp, firestoreDb, hasRequiredFirebaseConfig };
