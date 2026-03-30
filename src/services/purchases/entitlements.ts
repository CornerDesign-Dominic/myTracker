import { Purchase } from "react-native-iap";

import { AccentColor } from "@/theme";

import { FREE_ACCENT_COLOR, SUPPORT_COLORS_PRODUCT_ID } from "./constants";
import { PurchaseEntitlements, PurchaseSnapshot } from "./types";

export const getDefaultEntitlements = (): PurchaseEntitlements => ({
  hasSupportColors: false,
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
) => accentColor === FREE_ACCENT_COLOR || hasSupportColors;

export const getSafeAccentColor = (
  accentColor: AccentColor,
  hasSupportColors: boolean,
) => (canUseAccentColor(accentColor, hasSupportColors) ? accentColor : FREE_ACCENT_COLOR);
