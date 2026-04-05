import * as Notifications from "expo-notifications";

import {
  notificationScenarioChannelMap,
  notificationScenarioDefaults,
} from "./constants";
import type { LocalNotificationScenario } from "./types";

export const scheduleLocalNotification = async ({
  scenario,
  date,
  title,
  body,
  data,
}: {
  scenario: LocalNotificationScenario;
  date: Date;
  title?: string;
  body?: string;
  data?: Record<string, string | number | boolean | null>;
}) => {
  const defaults = notificationScenarioDefaults[scenario];

  return Notifications.scheduleNotificationAsync({
    content: {
      title: title ?? defaults.title,
      body: body ?? defaults.body,
      data: {
        scenario,
        ...data,
      },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      channelId: notificationScenarioChannelMap[scenario],
      date,
    },
  });
};

export const scheduleTestNotification = async (secondsFromNow = 5) =>
  scheduleLocalNotification({
    scenario: "test-notification",
    date: new Date(Date.now() + secondsFromNow * 1000),
  });

export const scheduleThreeDayEventReminder = async (date: Date, subscriptionId?: string) =>
  scheduleLocalNotification({
    scenario: "event-in-three-days",
    date,
    data: {
      subscriptionId: subscriptionId ?? null,
    },
  });

export const scheduleCancellationDeadlineReminder = async (date: Date, subscriptionId?: string) =>
  scheduleLocalNotification({
    scenario: "cancellation-window-ending",
    date,
    data: {
      subscriptionId: subscriptionId ?? null,
    },
  });

export const scheduleRenewalTomorrowReminder = async (date: Date, subscriptionId?: string) =>
  scheduleLocalNotification({
    scenario: "renewal-tomorrow",
    date,
    data: {
      subscriptionId: subscriptionId ?? null,
    },
  });
