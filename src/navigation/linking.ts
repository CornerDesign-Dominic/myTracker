import * as ExpoLinking from "expo-linking";
import type { LinkingOptions } from "@react-navigation/native";

import { analyticsEventNames } from "@/services/analytics/events";
import { analyticsService } from "@/services/analytics/service";
import { runtimeConfig } from "@/config/runtime";

import { deepLinkPaths, ResolvedDeepLink } from "./deepLinks";
import type { RootStackParamList } from "./types";

const appLinkPrefixes = [
  ExpoLinking.createURL("/"),
  `${runtimeConfig.deepLinkScheme}://`,
  ...(runtimeConfig.universalLinkHost ? [`https://${runtimeConfig.universalLinkHost}`] : []),
];

const normalizePath = (value: string | null | undefined) =>
  value?.replace(/^\/+/, "").replace(/\/+$/, "") ?? "";

export const resolveDeepLink = (url: string): ResolvedDeepLink | null => {
  const parsed = ExpoLinking.parse(url);
  const path = normalizePath(parsed.path);

  if (path === deepLinkPaths.resetPassword) {
    return {
      kind: "reset-password",
      url,
      params: {
        oobCode: typeof parsed.queryParams?.oobCode === "string" ? parsed.queryParams.oobCode : null,
        mode: typeof parsed.queryParams?.mode === "string" ? parsed.queryParams.mode : null,
      },
    };
  }

  if (path === deepLinkPaths.confirmEmail) {
    return {
      kind: "confirm-email",
      url,
      params: {
        oobCode: typeof parsed.queryParams?.oobCode === "string" ? parsed.queryParams.oobCode : null,
        mode: typeof parsed.queryParams?.mode === "string" ? parsed.queryParams.mode : null,
      },
    };
  }

  if (path === deepLinkPaths.purchaseSuccess) {
    return {
      kind: "purchase-success",
      url,
      params: {
        productId:
          typeof parsed.queryParams?.productId === "string" ? parsed.queryParams.productId : null,
        orderId: typeof parsed.queryParams?.orderId === "string" ? parsed.queryParams.orderId : null,
      },
    };
  }

  if (path === deepLinkPaths.purchaseCancelled) {
    return {
      kind: "purchase-cancelled",
      url,
      params: {
        productId:
          typeof parsed.queryParams?.productId === "string" ? parsed.queryParams.productId : null,
      },
    };
  }

  const openSubscriptionMatch = path.match(/^open-subscription\/([^/]+)$/);

  if (openSubscriptionMatch) {
    return {
      kind: "open-subscription",
      url,
      params: {
        subscriptionId: decodeURIComponent(openSubscriptionMatch[1] ?? ""),
      },
    };
  }

  return null;
};

export const trackDeepLinkOpen = (url: string) => {
  const resolved = resolveDeepLink(url);

  if (!resolved) {
    return;
  }

  analyticsService.track(analyticsEventNames.deepLinkOpened, {
    kind: resolved.kind,
    url,
    ...resolved.params,
  });
};

export const appLinking: LinkingOptions<RootStackParamList> = {
  prefixes: appLinkPrefixes,
  config: {
    screens: {
      ResetPasswordLink: deepLinkPaths.resetPassword,
      ConfirmEmailLink: deepLinkPaths.confirmEmail,
      PurchaseSuccessLink: deepLinkPaths.purchaseSuccess,
      PurchaseCancelledLink: deepLinkPaths.purchaseCancelled,
      OpenSubscriptionLink: deepLinkPaths.openSubscription,
    },
  },
};
