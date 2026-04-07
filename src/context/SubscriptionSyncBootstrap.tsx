import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { retryPendingSubscriptionSync } from "@/services/subscriptionRepository";

export const SubscriptionSyncBootstrap = () => {
  const { currentUser, authIsReady } = useAuth();

  useEffect(() => {
    if (!authIsReady || !currentUser?.uid) {
      return;
    }

    void retryPendingSubscriptionSync(currentUser.uid);

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void retryPendingSubscriptionSync(currentUser.uid);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [authIsReady, currentUser?.uid]);

  return null;
};
