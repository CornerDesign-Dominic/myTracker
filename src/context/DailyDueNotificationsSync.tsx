import { useEffect, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useI18n } from "@/hooks/useI18n";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { notificationsService } from "@/services/notifications/service";
import { syncDailyDueNotifications } from "@/services/notifications/dailyDue";
import { cancelScheduledNotificationsForScenario } from "@/services/notifications/scheduling";
import { formatLocalDateInput } from "@/utils/date";

export const DailyDueNotificationsSync = () => {
  const { authIsReady, currentUser } = useAuth();
  const { notificationsEnabled } = useAppSettings();
  const { language } = useI18n();
  const { subscriptions, isLoading } = useSubscriptions();
  const lastSyncSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authIsReady || isLoading) {
      return;
    }

    const signature = JSON.stringify({
      date: formatLocalDateInput(new Date()),
      userId: currentUser?.uid ?? "guest",
      language,
      subscriptions: subscriptions
        .map((subscription) => ({
          id: subscription.id,
          name: subscription.name,
          nextPaymentDate: subscription.nextPaymentDate,
          billingCycle: subscription.billingCycle,
          status: subscription.status,
          createdAt: subscription.createdAt,
          endDate: subscription.endDate ?? null,
          archivedAt: subscription.archivedAt ?? null,
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    });

    if (lastSyncSignatureRef.current === signature) {
      return;
    }

    let isCancelled = false;

    const run = async () => {
      try {
        await notificationsService.initializeAsync();

        if (!notificationsEnabled) {
          await cancelScheduledNotificationsForScenario("daily-due-today");
          if (!isCancelled) {
            lastSyncSignatureRef.current = signature;
          }
          return;
        }

        let permissionState = await notificationsService.getPermissionStateAsync();
        if (permissionState === "undetermined" && subscriptions.length > 0) {
          permissionState = await notificationsService.requestPermissionAsync();
        }

        if (permissionState !== "granted") {
          lastSyncSignatureRef.current = signature;
          return;
        }

        await syncDailyDueNotifications({
          subscriptions,
          language,
        });

        if (!isCancelled) {
          lastSyncSignatureRef.current = signature;
        }
      } catch {
        if (!isCancelled) {
          lastSyncSignatureRef.current = signature;
        }
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [authIsReady, currentUser?.uid, isLoading, language, notificationsEnabled, subscriptions]);

  return null;
};
