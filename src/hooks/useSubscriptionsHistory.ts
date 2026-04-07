import { useEffect, useMemo, useRef, useState } from "react";

import { createSubscriptionService } from "@/application/subscriptions/service";
import { getSubscriptionErrorMessage, hasUserScope } from "@/application/subscriptions/errors";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/hooks/useI18n";
import {
  subscribePendingHistoryProjection,
  subscriptionRepository,
  usingFirebase,
} from "@/services/subscriptionRepository";
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
  const activeUnsubscribersRef = useRef<Record<string, () => void>>({});

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
      Object.values(activeUnsubscribersRef.current).forEach((unsubscribe) => unsubscribe());
      activeUnsubscribersRef.current = {};
      setHistoryBySubscription({});
      setLoadedSubscriptions({});
      return;
    }

    if (usingFirebase) {
      setErrorMessage(null);
      setLoadedSubscriptions(
        Object.fromEntries(stableSubscriptionIds.map((subscriptionId) => [subscriptionId, true])),
      );

      let unsubscribe: () => void = () => {};

      void subscribePendingHistoryProjection(
        currentUser.uid,
        stableSubscriptionIds,
        (items) => {
          const nextHistoryBySubscription = stableSubscriptionIds.reduce<
            Record<string, SubscriptionHistoryEvent[]>
          >((current, subscriptionId) => {
            current[subscriptionId] = items.filter(
              (event) => event.subscriptionId === subscriptionId && !event.deletedAt,
            );
            return current;
          }, {});

          setHistoryBySubscription(nextHistoryBySubscription);
        },
        (error) => {
          logFirestoreError("useSubscriptionsHistory.projection", error, {
            userId: currentUser.uid,
            subscriptionIds: stableSubscriptionIds,
          });
          setErrorMessage(getSubscriptionErrorMessage(error, t("common.actionFailed")));
        },
      )
        .then((nextUnsubscribe) => {
          unsubscribe = nextUnsubscribe;
        })
        .catch((error) => {
          logFirestoreError("useSubscriptionsHistory.projection.connect", error, {
            userId: currentUser.uid,
            subscriptionIds: stableSubscriptionIds,
          });
          setErrorMessage(getSubscriptionErrorMessage(error, t("common.actionFailed")));
        });

      return () => {
        unsubscribe();
      };
    }

    setErrorMessage(null);
    const nextIdSet = new Set(stableSubscriptionIds);

    Object.entries(activeUnsubscribersRef.current).forEach(([subscriptionId, unsubscribe]) => {
      if (nextIdSet.has(subscriptionId)) {
        return;
      }

      unsubscribe();
      delete activeUnsubscribersRef.current[subscriptionId];
      setHistoryBySubscription((current) => {
        const next = { ...current };
        delete next[subscriptionId];
        return next;
      });
      setLoadedSubscriptions((current) => {
        const next = { ...current };
        delete next[subscriptionId];
        return next;
      });
    });

    stableSubscriptionIds.forEach((subscriptionId) => {
      if (activeUnsubscribersRef.current[subscriptionId]) {
        return;
      }

      const unsubscribe = subscriptionService.observeSubscriptionHistory(
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
      );

      activeUnsubscribersRef.current[subscriptionId] = unsubscribe;
    });

  }, [authIsReady, currentUser?.uid, stableSubscriptionIdsKey, t]);

  useEffect(
    () => () => {
      Object.values(activeUnsubscribersRef.current).forEach((unsubscribe) => unsubscribe());
      activeUnsubscribersRef.current = {};
    },
    [],
  );

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
