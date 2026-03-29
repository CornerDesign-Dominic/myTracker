import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { Subscription } from "../../types/subscription.ts";
import type { SubscriptionService } from "../../application/subscriptions/service.ts";
import { logFirestoreError } from "../../utils/firestoreDebug.ts";
import {
  readLastGlobalSyncAt,
  shouldRunGlobalSync,
  writeLastGlobalSyncAt,
} from "./historySync.ts";

type Options = {
  authIsReady: boolean;
  userId?: string | null;
  subscriptions: Subscription[];
  service: SubscriptionService;
};

export const useSubscriptionHistorySync = ({
  authIsReady,
  userId,
  subscriptions,
  service,
}: Options) => {
  const [lastGlobalSyncAt, setLastGlobalSyncAt] = useState<number | null>(null);
  const isSyncingRef = useRef(false);
  const hasCompletedInitialSyncRef = useRef(false);
  const lastAppStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    hasCompletedInitialSyncRef.current = false;
    setLastGlobalSyncAt(null);

    if (!userId) {
      return;
    }

    readLastGlobalSyncAt(userId)
      .then((value) => {
        setLastGlobalSyncAt(value);
      })
      .catch((error) => {
        logFirestoreError("useSubscriptionHistorySync.readLastGlobalSyncAt", error, {
          userId,
        });
      });
  }, [userId]);

  const runGlobalSync = async () => {
    if (!authIsReady || !userId || subscriptions.length === 0 || isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;

    try {
      await service.syncHistoryForUser(userId, subscriptions);
      const syncedAt = Date.now();
      setLastGlobalSyncAt(syncedAt);
      await writeLastGlobalSyncAt(userId, syncedAt);
    } catch (error) {
      logFirestoreError("useSubscriptionHistorySync.runGlobalSync", error, {
        userId,
      });
    } finally {
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    if (!authIsReady || !userId || subscriptions.length === 0 || hasCompletedInitialSyncRef.current) {
      return;
    }

    hasCompletedInitialSyncRef.current = true;
    void runGlobalSync();
  }, [authIsReady, service, subscriptions, userId]);

  useEffect(() => {
    if (!authIsReady || !userId) {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const wasBackgrounded =
        lastAppStateRef.current === "background" || lastAppStateRef.current === "inactive";

      lastAppStateRef.current = nextAppState;

      if (!wasBackgrounded || nextAppState !== "active") {
        return;
      }

      if (
        !shouldRunGlobalSync({
          lastSyncedAt: lastGlobalSyncAt,
        })
      ) {
        return;
      }

      void runGlobalSync();
    });

    return () => {
      subscription.remove();
    };
  }, [authIsReady, lastGlobalSyncAt, service, subscriptions, userId]);

  return {
    lastGlobalSyncAt,
  };
};
