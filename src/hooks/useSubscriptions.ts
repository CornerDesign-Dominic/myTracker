import { useEffect, useMemo, useState } from "react";

import { subscriptionRepository, usingFirebase } from "@/services/subscriptionRepository";
import { Subscription, SubscriptionInput } from "@/types/subscription";
import { buildSubscriptionMetrics } from "@/utils/subscriptionMetrics";

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscriptionRepository.subscribe((items) => {
      setSubscriptions(items);
      setIsLoading(false);
      setErrorMessage(null);
    });

    return unsubscribe;
  }, []);

  const metrics = useMemo(
    () => buildSubscriptionMetrics(subscriptions),
    [subscriptions],
  );

  const wrapAction = async (action: () => Promise<void>) => {
    try {
      setErrorMessage(null);
      await action();
    } catch (error) {
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
      wrapAction(() => subscriptionRepository.create(input)),
    updateSubscription: (id: string, input: Partial<SubscriptionInput>) =>
      wrapAction(() => subscriptionRepository.update(id, input)),
    archiveSubscription: (id: string) =>
      wrapAction(() => subscriptionRepository.archive(id)),
  };
};
