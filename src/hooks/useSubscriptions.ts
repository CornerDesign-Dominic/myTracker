import { useMemo } from "react";

import { createSubscriptionService } from "@/application/subscriptions/service";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/hooks/useI18n";
import { subscriptionRepository, usingFirebase } from "@/services/subscriptionRepository";
import { buildSubscriptionMetrics } from "@/utils/subscriptionMetrics";
import { useSubscriptionActions } from "@/presentation/subscriptions/useSubscriptionActions";
import { useSubscriptionCollection } from "@/presentation/subscriptions/useSubscriptionCollection";
import { useSubscriptionHistorySync } from "@/presentation/subscriptions/useSubscriptionHistorySync";

const subscriptionService = createSubscriptionService(subscriptionRepository);

export const useSubscriptions = () => {
  const { currentUser, authIsReady } = useAuth();
  const { language } = useI18n();
  const { subscriptions, isLoading, errorMessage, setErrorMessage } = useSubscriptionCollection({
    authIsReady,
    userId: currentUser?.uid,
    service: subscriptionService,
  });
  useSubscriptionHistorySync({
    authIsReady,
    userId: currentUser?.uid,
    subscriptions,
    service: subscriptionService,
  });

  const metrics = useMemo(
    () => buildSubscriptionMetrics(subscriptions, language),
    [language, subscriptions],
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
