import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { runtimeConfig } from "@/config/runtime";
import { analyticsEventNames } from "@/services/analytics/events";
import { analyticsService } from "@/services/analytics/service";

import type { PushTokenBundle } from "./types";

export const readPushTokenBundle = async (): Promise<PushTokenBundle> => {
  if (!Device.isDevice) {
    return {
      expoPushToken: null,
      nativePushToken: null,
    };
  }

  const [expoPushToken, nativePushToken] = await Promise.all([
    runtimeConfig.easProjectId
      ? Notifications.getExpoPushTokenAsync({
          projectId: runtimeConfig.easProjectId,
        })
          .then((result) => result.data)
          .catch(() => null)
      : Promise.resolve<string | null>(null),
    Notifications.getDevicePushTokenAsync()
      .then((result) => String(result.data))
      .catch(() => null),
  ]);

  if (expoPushToken || nativePushToken) {
    analyticsService.track(analyticsEventNames.pushTokenRegistered, {
      hasExpoPushToken: Boolean(expoPushToken),
      hasNativePushToken: Boolean(nativePushToken),
    });
  }

  return {
    expoPushToken,
    nativePushToken,
  };
};

export const syncPushTokenPlaceholder = async (userId?: string | null) => {
  const tokens = await readPushTokenBundle();

  // TODO: Send the push token bundle to Firebase/your backend after the final device-registration API exists.
  return {
    userId: userId ?? null,
    ...tokens,
  };
};
