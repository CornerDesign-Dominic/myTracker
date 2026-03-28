import { useMemo } from "react";

import { createSubscriptionService } from "@/application/subscriptions/service";
import { useAuth } from "@/context/AuthContext";
import { subscriptionRepository, usingFirebase } from "@/services/subscriptionRepository";
import { buildSubscriptionMetrics } from "@/utils/subscriptionMetrics";
import { useSubscriptionActions } from "@/presentation/subscriptions/useSubscriptionActions";
import { useSubscriptionCollection } from "@/presentation/subscriptions/useSubscriptionCollection";

const subscriptionService = createSubscriptionService(subscriptionRepository);

export const useSubscriptions = () => {
  const { currentUser, authIsReady } = useAuth();
  const { subscriptions, isLoading, errorMessage, setErrorMessage } = useSubscriptionCollection({
    authIsReady,
    userId: currentUser?.uid,
    service: subscriptionService,
  });

  const metrics = useMemo(
    () => buildSubscriptionMetrics(subscriptions),
    [subscriptions],
  );
  const actions = useSubscriptionActions({
    userId: currentUser?.uid,
    service: subscriptionService,
    setErrorMessage,
  });

  return {
    subscriptions,
    metrics,
    isLoading,
    errorMessage,
    isUsingFirebase: usingFirebase,
    ...actions,
  };
};
