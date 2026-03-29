import { useEffect, useState } from "react";

import { Subscription } from "@/types/subscription";
import { SubscriptionService } from "@/application/subscriptions/service";
import { getSubscriptionErrorMessage, hasUserScope } from "@/application/subscriptions/errors";
import { useI18n } from "@/hooks/useI18n";
import { logFirestoreError } from "@/utils/firestoreDebug";

type Options = {
  authIsReady: boolean;
  userId?: string | null;
  service: SubscriptionService;
};

export const useSubscriptionCollection = ({ authIsReady, userId, service }: Options) => {
  const { t } = useI18n();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authIsReady) {
      return;
    }

    if (!hasUserScope(userId)) {
      setSubscriptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = service.observeUserSubscriptions(
      userId,
      (items) => {
        setSubscriptions(items);
        setIsLoading(false);
        setErrorMessage(null);
      },
      (error) => {
        logFirestoreError("useSubscriptionCollection.observe", error, {
          userId,
        });
        setSubscriptions([]);
        setIsLoading(false);
        setErrorMessage(getSubscriptionErrorMessage(error, t("common.actionFailed")));
      },
    );

    return unsubscribe;
  }, [authIsReady, service, t, userId]);

  useEffect(() => {
    if (!authIsReady || !hasUserScope(userId) || subscriptions.length === 0) {
      return;
    }

    service.syncHistoryForUser(userId, subscriptions).catch((error) => {
      logFirestoreError("useSubscriptionCollection.syncHistory", error, {
        userId,
      });
    });
  }, [authIsReady, service, subscriptions, userId]);

  return {
    subscriptions,
    isLoading,
    errorMessage,
    setErrorMessage,
  };
};
