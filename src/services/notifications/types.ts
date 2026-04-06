export type NotificationChannelId = "general-reminders" | "billing-deadlines" | "debug";

export type NotificationPermissionState =
  | "granted"
  | "denied"
  | "undetermined";

export type LocalNotificationScenario =
  | "daily-due-today"
  | "daily-due-today-test"
  | "event-in-three-days"
  | "cancellation-window-ending"
  | "renewal-tomorrow"
  | "test-notification";

export type PushTokenBundle = {
  expoPushToken: string | null;
  nativePushToken: string | null;
};
