import type { NotificationChannelId, LocalNotificationScenario } from "./types";

export const notificationChannelDefinitions: Record<
  NotificationChannelId,
  {
    name: string;
    description: string;
  }
> = {
  "general-reminders": {
    name: "General reminders",
    description: "Reminder notifications for upcoming subscription events.",
  },
  "billing-deadlines": {
    name: "Billing deadlines",
    description: "Notifications for renewals and cancellation deadlines.",
  },
  debug: {
    name: "Debug notifications",
    description: "Temporary test notifications for local dev builds.",
  },
};

export const notificationScenarioChannelMap: Record<LocalNotificationScenario, NotificationChannelId> = {
  "event-in-three-days": "general-reminders",
  "cancellation-window-ending": "billing-deadlines",
  "renewal-tomorrow": "billing-deadlines",
  "test-notification": "debug",
};

export const notificationScenarioDefaults: Record<
  LocalNotificationScenario,
  {
    title: string;
    body: string;
  }
> = {
  "event-in-three-days": {
    title: "Upcoming subscription event",
    body: "TODO: Replace with the final reminder copy for events due in 3 days.",
  },
  "cancellation-window-ending": {
    title: "Cancellation window ending soon",
    body: "TODO: Replace with the final cancellation deadline reminder copy.",
  },
  "renewal-tomorrow": {
    title: "Renewal tomorrow",
    body: "TODO: Replace with the final one-day renewal reminder copy.",
  },
  "test-notification": {
    title: "OctoVault test notification",
    body: "Notifications are wired for the next dev build. Final product logic comes later.",
  },
};
