export const analyticsEventNames = {
  appOpen: "app_open",
  anonymousStart: "anonymous_start",
  pendingRegistrationStarted: "pending_registration_started",
  pendingRegistrationCompleted: "pending_registration_completed",
  loginSuccess: "login_success",
  passwordResetRequested: "password_reset_requested",
  premiumPurchaseStarted: "premium_purchase_started",
  premiumPurchaseSuccess: "premium_purchase_success",
  premiumPurchaseFailed: "premium_purchase_failed",
  notificationPermissionResult: "notification_permission_result",
  pushTokenRegistered: "push_token_registered",
  deepLinkOpened: "deep_link_opened",
} as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[keyof typeof analyticsEventNames];
