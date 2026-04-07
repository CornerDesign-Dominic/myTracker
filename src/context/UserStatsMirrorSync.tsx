import { useEffect, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import { usePurchases } from "@/context/PurchaseContext";
import { hasRequiredFirebaseConfig } from "@/firebase/config";
import { subscribeUserStatsProjection } from "@/services/subscriptionRepository";
import { updateUserStatsMirror } from "@/services/firestore/userFirestore";
import { logFirestoreError } from "@/utils/firestoreDebug";

export const UserStatsMirrorSync = () => {
  const { currentUser, authIsReady } = useAuth();
  const { isHydrated, isPremium } = usePurchases();
  const lastMirrorKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasRequiredFirebaseConfig || !authIsReady || !isHydrated || !currentUser?.uid) {
      lastMirrorKeyRef.current = null;
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isActive = true;

    void subscribeUserStatsProjection(
      currentUser.uid,
      (stats) => {
        const nextPayload = {
          subscriptionCount: stats.subscriptionCount,
          isPremium,
        };
        const nextKey = JSON.stringify(nextPayload);

        if (lastMirrorKeyRef.current === nextKey) {
          return;
        }

        lastMirrorKeyRef.current = nextKey;

        updateUserStatsMirror(currentUser.uid, nextPayload).catch((error) => {
          logFirestoreError("UserStatsMirrorSync.updateUserStatsMirror", error, {
            userId: currentUser.uid,
            ...nextPayload,
          });
        });
      },
      (error) => {
        logFirestoreError("UserStatsMirrorSync.subscribeUserStatsProjection", error, {
          userId: currentUser.uid,
        });
      },
    )
      .then((nextUnsubscribe) => {
        if (!isActive) {
          nextUnsubscribe();
          return;
        }

        unsubscribe = nextUnsubscribe;
      })
      .catch((error) => {
        logFirestoreError("UserStatsMirrorSync.subscribeUserStatsProjection", error, {
          userId: currentUser.uid,
        });
      });

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [authIsReady, currentUser?.uid, isHydrated, isPremium]);

  return null;
};
