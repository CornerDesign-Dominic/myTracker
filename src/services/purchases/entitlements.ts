import type { Purchase } from "react-native-iap";

import type { AccentColor } from "@/theme";

import {
  ALL_LIFETIME_PREMIUM_PRODUCT_IDS,
  FREE_ACCENT_COLOR,
  FREE_ACCENT_COLORS,
} from "./constants.ts";
import type { PurchaseEntitlements, PurchaseSnapshot } from "./types.ts";

export const getDefaultEntitlements = (): PurchaseEntitlements => ({
  hasPremiumAccents: false,
  hasLifetimePremium: false,
  isPremium: false,
  state: "inactive",
  source: "none",
});

export const isLifetimePremiumPurchase = (purchase: Pick<Purchase, "productId" | "purchaseState">) =>
  ALL_LIFETIME_PREMIUM_PRODUCT_IDS.includes(
    purchase.productId as (typeof ALL_LIFETIME_PREMIUM_PRODUCT_IDS)[number],
  ) && purchase.purchaseState === "purchased";

export const isPurchaseEligibleForEntitlement = (
  purchase: Pick<Purchase, "productId" | "purchaseState"> & {
    isSuspendedAndroid?: boolean | null;
  },
) => isLifetimePremiumPurchase(purchase) && !purchase.isSuspendedAndroid;

export const deriveEntitlementsFromPurchases = (purchases: Purchase[]): PurchaseEntitlements => ({
  hasPremiumAccents: purchases.some(isPurchaseEligibleForEntitlement),
  hasLifetimePremium: purchases.some(isPurchaseEligibleForEntitlement),
  isPremium: purchases.some(isPurchaseEligibleForEntitlement),
  state: purchases.some(isPurchaseEligibleForEntitlement) ? "active" : "inactive",
  source: purchases.some(isPurchaseEligibleForEntitlement) ? "google-play" : "none",
});

export const buildPurchaseSnapshot = (
  purchases: Purchase[],
  platform: PurchaseSnapshot["platform"],
): PurchaseSnapshot => {
  const matchingPurchase = purchases.find(isPurchaseEligibleForEntitlement) ?? null;

  return {
    entitlements: deriveEntitlementsFromPurchases(purchases),
    lastValidatedAt: new Date().toISOString(),
    lastSyncedAt: null,
    acknowledgedAt: matchingPurchase ? new Date().toISOString() : null,
    platform,
    productId: matchingPurchase?.productId ?? null,
    purchaseToken: matchingPurchase?.purchaseToken ?? null,
    transactionId: matchingPurchase?.transactionId ?? null,
    purchaseState: matchingPurchase ? "restored" : "idle",
    premiumSource: matchingPurchase ? "google-play" : "none",
    verificationSource: matchingPurchase ? "play-store" : "local-cache",
    lastErrorCode: null,
  };
};

export const buildSnapshotFromSinglePurchase = (
  purchase: Purchase,
  platform: PurchaseSnapshot["platform"],
): PurchaseSnapshot => ({
  entitlements: {
    hasPremiumAccents: isPurchaseEligibleForEntitlement(purchase),
    hasLifetimePremium: isPurchaseEligibleForEntitlement(purchase),
    isPremium: isPurchaseEligibleForEntitlement(purchase),
    state: isPurchaseEligibleForEntitlement(purchase) ? "active" : "inactive",
    source: isPurchaseEligibleForEntitlement(purchase) ? "google-play" : "none",
  },
  lastValidatedAt: new Date().toISOString(),
  lastSyncedAt: null,
  acknowledgedAt: new Date().toISOString(),
  platform,
  productId: purchase.productId,
  purchaseToken: purchase.purchaseToken ?? null,
  transactionId: purchase.transactionId ?? null,
  purchaseState: "purchased",
  premiumSource: isPurchaseEligibleForEntitlement(purchase) ? "google-play" : "none",
  verificationSource: "play-store",
  lastErrorCode: null,
});

export const canUseAccentColor = (
  accentColor: AccentColor,
  hasPremiumAccents: boolean,
) => true;

export const getSafeAccentColor = (
  accentColor: AccentColor,
  hasPremiumAccents: boolean,
) => (canUseAccentColor(accentColor, hasPremiumAccents) ? accentColor : FREE_ACCENT_COLOR);
