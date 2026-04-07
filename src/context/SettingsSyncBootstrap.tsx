import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { retryPendingSettingsSync } from "@/services/settings/localFirstStore";

export const SettingsSyncBootstrap = () => {
  const { currentUser, authIsReady } = useAuth();

  useEffect(() => {
    if (!authIsReady || !currentUser?.uid) {
      return;
    }

    void retryPendingSettingsSync(currentUser.uid);

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void retryPendingSettingsSync(currentUser.uid);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [authIsReady, currentUser?.uid]);

  return null;
};
