import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { subscriptionRepository, usingFirebase } from "@/services/subscriptionRepository";
import { Subscription, SubscriptionInput } from "@/types/subscription";
import { logFirestoreError } from "@/utils/firestoreDebug";
import { buildSubscriptionMetrics } from "@/utils/subscriptionMetrics";

export const useSubscriptions = () => {
  const { currentUser, authIsReady } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authIsReady) {
      return;
    }

    if (!currentUser?.uid) {
      setSubscriptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscriptionRepository.subscribe(
      currentUser.uid,
      (items) => {
        setSubscriptions(items);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        logFirestoreError("useSubscriptions.subscribe", error, {
          userId: currentUser.uid,
        });
        setSubscriptions([]);
        setIsLoading(false);
        setErrorMessage(
          error.message || "Abos konnten nicht geladen werden.",
        );
      },
    );

    return unsubscribe;
  }, [authIsReady, currentUser?.uid]);

  const metrics = useMemo(
    () => buildSubscriptionMetrics(subscriptions),
    [subscriptions],
  );

  const wrapAction = async (action: () => Promise<void>) => {
    try {
      setErrorMessage(null);
      await action();
    } catch (error) {
      logFirestoreError("useSubscriptions.action", error, {
        userId: currentUser?.uid ?? null,
      });
      setErrorMessage(
        error instanceof Error ? error.message : "Aktion konnte nicht ausgefuehrt werden.",
      );
    }
  };

  return {
    subscriptions,
    metrics,
    isLoading,
    errorMessage,
    isUsingFirebase: usingFirebase,
    createSubscription: (input: SubscriptionInput) =>
      currentUser?.uid
        ? wrapAction(() => subscriptionRepository.create(currentUser.uid, input))
        : Promise.resolve(),
    updateSubscription: (id: string, input: Partial<SubscriptionInput>) =>
      currentUser?.uid
        ? wrapAction(() => subscriptionRepository.update(currentUser.uid, id, input))
        : Promise.resolve(),
    archiveSubscription: (id: string) =>
      currentUser?.uid
        ? wrapAction(() => subscriptionRepository.archive(currentUser.uid, id))
        : Promise.resolve(),
  };
};
