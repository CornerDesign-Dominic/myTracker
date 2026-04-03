import { useEffect, useMemo, useState } from "react";

import { createSubscriptionService } from "@/application/subscriptions/service";
import { getSubscriptionErrorMessage, hasUserScope } from "@/application/subscriptions/errors";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/hooks/useI18n";
import { subscriptionRepository } from "@/services/subscriptionRepository";
import { SubscriptionHistoryEvent } from "@/types/subscriptionHistory";
import { logFirestoreError } from "@/utils/firestoreDebug";

const subscriptionService = createSubscriptionService(subscriptionRepository);

export const useSubscriptionsHistory = (subscriptionIds: string[]) => {
  const { currentUser, authIsReady } = useAuth();
  const { t } = useI18n();
  const [historyBySubscription, setHistoryBySubscription] = useState<
    Record<string, SubscriptionHistoryEvent[]>
  >({});
  const [loadedSubscriptions, setLoadedSubscriptions] = useState<Record<string, true>>({});
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
      setLoadedSubscriptions({});
      return;
    }

    setHistoryBySubscription({});
    setLoadedSubscriptions({});
    setErrorMessage(null);

    const unsubscribers = stableSubscriptionIds.map((subscriptionId) =>
      subscriptionService.observeSubscriptionHistory(
        currentUser.uid,
        subscriptionId,
        (items) => {
          setLoadedSubscriptions((current) => ({
            ...current,
            [subscriptionId]: true,
          }));
          setHistoryBySubscription((current) => ({
            ...current,
            [subscriptionId]: items.filter((event) => !event.deletedAt),
          }));
        },
        (error) => {
          setLoadedSubscriptions((current) => ({
            ...current,
            [subscriptionId]: true,
          }));
          logFirestoreError("useSubscriptionsHistory.observe", error, {
            userId: currentUser.uid,
            subscriptionId,
          });
          setErrorMessage(getSubscriptionErrorMessage(error, t("common.actionFailed")));
        },
      ),
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [authIsReady, currentUser?.uid, stableSubscriptionIdsKey, t]);

  const history = useMemo(
    () => Object.values(historyBySubscription).flat(),
    [historyBySubscription],
  );
  const isLoading =
    hasUserScope(currentUser?.uid) &&
    stableSubscriptionIds.length > 0 &&
    stableSubscriptionIds.some((subscriptionId) => !loadedSubscriptions[subscriptionId]);

  return {
    history,
    isLoading,
    errorMessage,
  };
};
