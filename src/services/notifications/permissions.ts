import * as Notifications from "expo-notifications";

import { analyticsEventNames } from "@/services/analytics/events";
import { analyticsService } from "@/services/analytics/service";

import type { NotificationPermissionState } from "./types";

const mapPermissionStatus = (
  status: Notifications.PermissionStatus,
): NotificationPermissionState => {
  if (status === "granted") {
    return "granted";
  }

  if (status === "denied") {
    return "denied";
  }

  return "undetermined";
};

export const getNotificationPermissionState = async (): Promise<NotificationPermissionState> => {
  const settings = await Notifications.getPermissionsAsync();
  return mapPermissionStatus(settings.status);
};

export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  const settings = await Notifications.requestPermissionsAsync();
  const result = mapPermissionStatus(settings.status);

  analyticsService.track(analyticsEventNames.notificationPermissionResult, {
    status: result,
  });

  return result;
};
