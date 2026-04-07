import { useMemo } from "react";

import { createSubscriptionService } from "@/application/subscriptions/service";
import { useAuth } from "@/context/AuthContext";
import { usePurchases } from "@/context/PurchaseContext";
import { useI18n } from "@/hooks/useI18n";
import { subscriptionRepository, usingFirebase } from "@/services/subscriptionRepository";
import { canCreateSubscription, getSubscriptionCount } from "@/services/purchases/freemium";
import { buildSubscriptionMetrics } from "@/utils/subscriptionMetrics";
import { useSubscriptionActions } from "@/presentation/subscriptions/useSubscriptionActions";
import { useSubscriptionCollection } from "@/presentation/subscriptions/useSubscriptionCollection";
import { useSubscriptionHistorySync } from "@/presentation/subscriptions/useSubscriptionHistorySync";

const subscriptionService = createSubscriptionService(subscriptionRepository);

export const useSubscriptions = () => {
  const { currentUser, authIsReady } = useAuth();
  const { isPremium } = usePurchases();
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
  const pendingSubscriptionsCount = useMemo(
    () => subscriptions.filter((subscription) => subscription.syncState?.isPending).length,
    [subscriptions],
  );
  const hasSyncErrors = useMemo(
    () => subscriptions.some((subscription) => subscription.syncState?.hasError),
    [subscriptions],
  );
  const subscriptionCount = useMemo(
    () => getSubscriptionCount(subscriptions),
    [subscriptions],
  );
  const actions = useSubscriptionActions({
    userId: currentUser?.uid,
    service: subscriptionService,
    setErrorMessage,
    isPremium,
    subscriptionCount,
  });

  return {
    subscriptions,
    metrics,
    subscriptionCount,
    pendingSubscriptionsCount,
    hasSyncErrors,
    isPremium,
    canCreateSubscription: canCreateSubscription({
      subscriptionCount,
      isPremium,
    }),
    isLoading,
    errorMessage,
    isUsingFirebase: usingFirebase,
    ...actions,
  };
};
