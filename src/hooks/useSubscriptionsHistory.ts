import { useEffect, useMemo, useState } from "react";

import { createSubscriptionService } from "@/application/subscriptions/service";
import { getSubscriptionErrorMessage, hasUserScope } from "@/application/subscriptions/errors";
import { useAuth } from "@/context/AuthContext";
import { subscriptionRepository } from "@/services/subscriptionRepository";
import { SubscriptionHistoryEvent } from "@/types/subscriptionHistory";
import { logFirestoreError } from "@/utils/firestoreDebug";

const subscriptionService = createSubscriptionService(subscriptionRepository);

export const useSubscriptionsHistory = (subscriptionIds: string[]) => {
  const { currentUser, authIsReady } = useAuth();
  const [historyBySubscription, setHistoryBySubscription] = useState<
    Record<string, SubscriptionHistoryEvent[]>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stableSubscriptionIdsKey = useMemo(
    () => [...subscriptionIds].sort().join("|"),
    [subscriptionIds],
  );
  const stableSubscriptionIds = useMemo(
    () => (stableSubscriptionIdsKey ? stableSubscriptionIdsKey.split("|") : []),
    [stableSubscriptionIdsKey],
  );

  useEffect(() => {
    if (!authIsReady) {
      return;
    }

    if (!hasUserScope(currentUser?.uid) || stableSubscriptionIds.length === 0) {
      setHistoryBySubscription({});
      return;
    }

    setHistoryBySubscription({});
    setErrorMessage(null);

    const unsubscribers = stableSubscriptionIds.map((subscriptionId) =>
      subscriptionService.observeSubscriptionHistory(
        currentUser.uid,
        subscriptionId,
        (items) => {
          setHistoryBySubscription((current) => ({
            ...current,
            [subscriptionId]: items.filter((event) => !event.deletedAt),
          }));
        },
        (error) => {
          logFirestoreError("useSubscriptionsHistory.observe", error, {
            userId: currentUser.uid,
            subscriptionId,
          });
          setErrorMessage(getSubscriptionErrorMessage(error));
        },
      ),
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [authIsReady, currentUser?.uid, stableSubscriptionIdsKey]);

  const history = useMemo(
    () => Object.values(historyBySubscription).flat(),
    [historyBySubscription],
  );

  return {
    history,
    errorMessage,
  };
};
