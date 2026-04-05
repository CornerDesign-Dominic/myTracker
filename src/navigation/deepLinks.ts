export const deepLinkRouteNames = {
  resetPassword: "ResetPasswordLink",
  confirmEmail: "ConfirmEmailLink",
  purchaseSuccess: "PurchaseSuccessLink",
  purchaseCancelled: "PurchaseCancelledLink",
  openSubscription: "OpenSubscriptionLink",
} as const;

export const deepLinkPaths = {
  resetPassword: "reset-password",
  confirmEmail: "confirm-email",
  purchaseSuccess: "purchase-success",
  purchaseCancelled: "purchase-cancelled",
  openSubscription: "open-subscription/:subscriptionId",
} as const;

export type DeepLinkPathKey = keyof typeof deepLinkPaths;
export type DeepLinkRouteName = (typeof deepLinkRouteNames)[DeepLinkPathKey];

export type ResolvedDeepLink =
  | {
      kind: "reset-password";
      url: string;
      params: {
        oobCode?: string | null;
        mode?: string | null;
      };
    }
  | {
      kind: "confirm-email";
      url: string;
      params: {
        hasToken?: boolean;
        oobCode?: string | null;
        mode?: string | null;
      };
    }
  | {
      kind: "purchase-success";
      url: string;
      params: {
        productId?: string | null;
        orderId?: string | null;
      };
    }
  | {
      kind: "purchase-cancelled";
      url: string;
      params: {
        productId?: string | null;
      };
    }
  | {
      kind: "open-subscription";
      url: string;
      params: {
        subscriptionId?: string | null;
      };
    };
