import { useEffect, useMemo, useState } from "react";

import { createSubscriptionService } from "@/application/subscriptions/service";
import { getSubscriptionErrorMessage, hasUserScope } from "@/application/subscriptions/errors";
import { getHistorySyncSummary, sortHistoryNewestFirst } from "@/domain/subscriptionHistory/events";
import { useAuth } from "@/context/AuthContext";
import { subscriptionRepository } from "@/services/subscriptionRepository";
import { SubscriptionHistoryEvent } from "@/types/subscriptionHistory";
import { logFirestoreError } from "@/utils/firestoreDebug";

const subscriptionService = createSubscriptionService(subscriptionRepository);

export const useSubscriptionHistory = (subscriptionId?: string) => {
  const { currentUser, authIsReady } = useAuth();
  const [history, setHistory] = useState<SubscriptionHistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authIsReady) {
      return;
    }

    if (!hasUserScope(currentUser?.uid) || !subscriptionId) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscriptionService.observeSubscriptionHistory(
      currentUser.uid,
      subscriptionId,
      (items) => {
        setHistory(sortHistoryNewestFirst(items.filter((event) => !event.deletedAt)));
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        logFirestoreError("useSubscriptionHistory.observe", error, {
          userId: currentUser.uid,
          subscriptionId,
        });
        setHistory([]);
        setIsLoading(false);
        setErrorMessage(getSubscriptionErrorMessage(error));
      },
    );

    return unsubscribe;
  }, [authIsReady, currentUser?.uid, subscriptionId]);

  const summary = useMemo(() => getHistorySyncSummary(history), [history]);

  return {
    history,
    summary,
    isLoading,
    errorMessage,
  };
};
