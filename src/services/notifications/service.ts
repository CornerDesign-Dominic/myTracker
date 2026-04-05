import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { runtimeConfig } from "@/config/runtime";

import { notificationChannelDefinitions } from "./constants";
import { requestNotificationPermission, getNotificationPermissionState } from "./permissions";
import { scheduleTestNotification } from "./scheduling";
import { syncPushTokenPlaceholder } from "./token";

let hasInitializedNotifications = false;

const ensureAndroidChannels = async () => {
  if (Platform.OS !== "android") {
    return;
  }

  await Promise.all(
    Object.entries(notificationChannelDefinitions).map(([channelId, definition]) =>
      Notifications.setNotificationChannelAsync(channelId, {
        name: definition.name,
        description: definition.description,
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150, 100, 150],
        lightColor: "#0F766E",
      }),
    ),
  );
};

export const notificationsService = {
  async initializeAsync() {
    if (hasInitializedNotifications) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await ensureAndroidChannels();
    hasInitializedNotifications = true;

    if (runtimeConfig.notificationDebugEnabled) {
      console.log("[Notifications] initialized");
    }
  },
  async getPermissionStateAsync() {
    return getNotificationPermissionState();
  },
  async requestPermissionAsync() {
    return requestNotificationPermission();
  },
  async syncPushTokenAsync(userId?: string | null) {
    return syncPushTokenPlaceholder(userId);
  },
  async scheduleDebugTestAsync(secondsFromNow?: number) {
    return scheduleTestNotification(secondsFromNow);
  },
};
