import { useEffect, useRef } from "react";

import { createSubscriptionService } from "@/application/subscriptions/service";
import { useAuth } from "@/context/AuthContext";
import { usePurchases } from "@/context/PurchaseContext";
import { hasRequiredFirebaseConfig } from "@/firebase/config";
import { subscriptionRepository } from "@/services/subscriptionRepository";
import { updateUserStatsMirror } from "@/services/firestore/userFirestore";
import { logFirestoreError } from "@/utils/firestoreDebug";

const subscriptionService = createSubscriptionService(subscriptionRepository);

export const UserStatsMirrorSync = () => {
  const { currentUser, authIsReady } = useAuth();
  const { isHydrated, isPremium } = usePurchases();
  const lastMirrorKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasRequiredFirebaseConfig || !authIsReady || !isHydrated || !currentUser?.uid) {
      lastMirrorKeyRef.current = null;
      return;
    }

    const unsubscribe = subscriptionService.observeUserSubscriptions(
      currentUser.uid,
      (subscriptions) => {
        const nextPayload = {
          subscriptionCount: subscriptions.length,
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
        logFirestoreError("UserStatsMirrorSync.observeUserSubscriptions", error, {
          userId: currentUser.uid,
        });
      },
    );

    return unsubscribe;
  }, [authIsReady, currentUser?.uid, isHydrated, isPremium]);

  return null;
};
