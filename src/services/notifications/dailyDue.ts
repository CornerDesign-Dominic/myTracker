import { Subscription } from "@/types/subscription";
import { formatLocalDateInput } from "@/utils/date";
import { getRecurringDueDateInputForMonth } from "@/utils/recurringDates";

import { cancelScheduledNotificationsForScenario, scheduleLocalNotification } from "./scheduling";

const DAILY_DUE_SCENARIO = "daily-due-today" as const;
const DAILY_DUE_TEST_SCENARIO = "daily-due-today-test" as const;
const DAILY_DUE_HOUR = 6;
const DAYS_AHEAD_TO_SCHEDULE = 30;

const buildDueNotificationDate = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    DAILY_DUE_HOUR,
    0,
    0,
    0,
  );

const sanitizeSubscriptionName = (value: string) => {
  const trimmed = value.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return "";
  }

  return trimmed.length > 36 ? `${trimmed.slice(0, 33).trimEnd()}...` : trimmed;
};

const getDueSubscriptionsForDate = (subscriptions: Subscription[], targetDate: Date) => {
  const targetDateKey = formatLocalDateInput(targetDate);

  return subscriptions.filter((subscription) => {
    if (subscription.status !== "active" || subscription.archivedAt) {
      return false;
    }

    return (
      getRecurringDueDateInputForMonth({
        anchorDate: subscription.nextPaymentDate,
        billingCycle: subscription.billingCycle,
        targetMonth: targetDate,
        startsOn: subscription.createdAt,
        endsOn: subscription.endDate,
      }) === targetDateKey
    );
  });
};

const buildNotificationTitle = (count: number, language: "de" | "en") => {
  if (language === "de") {
    return count === 1 ? "1 Zahlung heute" : `${count} Zahlungen heute`;
  }

  return count === 1 ? "1 payment today" : `${count} payments today`;
};

const buildNotificationBody = (subscriptions: Subscription[], language: "de" | "en") => {
  const visibleNames = subscriptions
    .map((subscription) => sanitizeSubscriptionName(subscription.name))
    .filter(Boolean)
    .filter((name, index, values) => values.indexOf(name) === index)
    .slice(0, 2);
  const remainingCount = Math.max(subscriptions.length - visibleNames.length, 0);

  if (language === "de") {
    if (visibleNames.length === 0) {
      return "Heute fällig: Abonnements";
    }

    if (remainingCount > 0) {
      return `Heute fällig: ${visibleNames.join(", ")} und ${remainingCount} weitere`;
    }

    return `Heute fällig: ${visibleNames.join(", ")}`;
  }

  if (visibleNames.length === 0) {
    return "Due today: subscriptions";
  }

  if (remainingCount > 0) {
    return `Due today: ${visibleNames.join(", ")} and ${remainingCount} more`;
  }

  return `Due today: ${visibleNames.join(", ")}`;
};

export const buildDailyDueNotificationContent = ({
  subscriptions,
  targetDate,
  language,
}: {
  subscriptions: Subscription[];
  targetDate: Date;
  language: "de" | "en";
}) => {
  const dueSubscriptions = getDueSubscriptionsForDate(subscriptions, targetDate);

  if (dueSubscriptions.length === 0) {
    return null;
  }

  return {
    dueSubscriptions,
    title: buildNotificationTitle(dueSubscriptions.length, language),
    body: buildNotificationBody(dueSubscriptions, language),
    targetDate: formatLocalDateInput(targetDate),
  };
};

export const scheduleDailyDueTestNotification = async ({
  subscriptions,
  language,
  secondsFromNow = 5,
}: {
  subscriptions: Subscription[];
  language: "de" | "en";
  secondsFromNow?: number;
}) => {
  const content = buildDailyDueNotificationContent({
    subscriptions,
    targetDate: new Date(),
    language,
  });

  if (!content) {
    return null;
  }

  await scheduleLocalNotification({
    scenario: DAILY_DUE_TEST_SCENARIO,
    date: new Date(Date.now() + secondsFromNow * 1000),
    title: content.title,
    body: content.body,
    data: {
      targetDate: content.targetDate,
    },
  });

  return content;
};

export const syncDailyDueNotifications = async ({
  subscriptions,
  language,
}: {
  subscriptions: Subscription[];
  language: "de" | "en";
}) => {
  await cancelScheduledNotificationsForScenario(DAILY_DUE_SCENARIO);

  const now = new Date();

  for (let offset = 0; offset < DAYS_AHEAD_TO_SCHEDULE; offset += 1) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12, 0, 0, 0);
    const triggerDate = buildDueNotificationDate(targetDate);

    if (triggerDate.getTime() <= now.getTime()) {
      continue;
    }

    const content = buildDailyDueNotificationContent({
      subscriptions,
      targetDate,
      language,
    });

    if (!content) {
      continue;
    }

    await scheduleLocalNotification({
      scenario: DAILY_DUE_SCENARIO,
      date: triggerDate,
      title: content.title,
      body: content.body,
      data: {
        targetDate: content.targetDate,
      },
    });
  }
};
