import type { Purchase } from "react-native-iap";

import type { AccentColor } from "@/theme";

import { FREE_ACCENT_COLOR, FREE_ACCENT_COLORS, SUPPORT_COLORS_PRODUCT_ID } from "./constants.ts";
import type { PurchaseEntitlements, PurchaseSnapshot } from "./types.ts";

export const getDefaultEntitlements = (): PurchaseEntitlements => ({
  hasSupportColors: false,
  isPremium: false,
});

export const isSupportColorsPurchase = (purchase: Pick<Purchase, "productId" | "purchaseState">) =>
  purchase.productId === SUPPORT_COLORS_PRODUCT_ID && purchase.purchaseState === "purchased";

export const isPurchaseEligibleForEntitlement = (
  purchase: Pick<Purchase, "productId" | "purchaseState"> & {
    isSuspendedAndroid?: boolean | null;
  },
) => isSupportColorsPurchase(purchase) && !purchase.isSuspendedAndroid;

export const deriveEntitlementsFromPurchases = (purchases: Purchase[]): PurchaseEntitlements => ({
  hasSupportColors: purchases.some(isPurchaseEligibleForEntitlement),
  isPremium: purchases.some(isPurchaseEligibleForEntitlement),
});

export const buildPurchaseSnapshot = (
  purchases: Purchase[],
  platform: PurchaseSnapshot["platform"],
): PurchaseSnapshot => {
  const matchingPurchase = purchases.find(isPurchaseEligibleForEntitlement) ?? null;

  return {
    entitlements: deriveEntitlementsFromPurchases(purchases),
    lastValidatedAt: new Date().toISOString(),
    platform,
    productId: matchingPurchase?.productId ?? null,
    purchaseToken: matchingPurchase?.purchaseToken ?? null,
    transactionId: matchingPurchase?.transactionId ?? null,
    verificationSource: "local-cache",
  };
};

export const buildSnapshotFromSinglePurchase = (
  purchase: Purchase,
  platform: PurchaseSnapshot["platform"],
): PurchaseSnapshot => ({
  entitlements: {
    hasSupportColors: isPurchaseEligibleForEntitlement(purchase),
    isPremium: isPurchaseEligibleForEntitlement(purchase),
  },
  lastValidatedAt: new Date().toISOString(),
  platform,
  productId: purchase.productId,
  purchaseToken: purchase.purchaseToken ?? null,
  transactionId: purchase.transactionId ?? null,
  verificationSource: "local-cache",
});

export const canUseAccentColor = (
  accentColor: AccentColor,
  hasSupportColors: boolean,
) => FREE_ACCENT_COLORS.includes(accentColor) || hasSupportColors;

export const getSafeAccentColor = (
  accentColor: AccentColor,
  hasSupportColors: boolean,
) => (canUseAccentColor(accentColor, hasSupportColors) ? accentColor : FREE_ACCENT_COLOR);
