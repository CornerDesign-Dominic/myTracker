import type { Product, Purchase } from "react-native-iap";

import {
  ALL_LIFETIME_PREMIUM_PRODUCT_IDS,
  LIFETIME_PREMIUM_MARKETING_NAME,
  LIFETIME_PREMIUM_PRODUCT_ID,
} from "./constants";
import { isPurchaseEligibleForEntitlement } from "./entitlements";
import type { PurchaseProductDetails, PurchaseSnapshot } from "./types";

export const getPurchaseScope = (userId?: string | null) => userId ?? "guest";

export const getPreferredLifetimePremiumProduct = (products: Product[]) =>
  products.find((product) => product.id === LIFETIME_PREMIUM_PRODUCT_ID) ??
  products.find((product) =>
    ALL_LIFETIME_PREMIUM_PRODUCT_IDS.includes(product.id as (typeof ALL_LIFETIME_PREMIUM_PRODUCT_IDS)[number]),
  ) ??
  null;

export const mapProductToDetails = (
  product: Product | null | undefined,
): PurchaseProductDetails | null => {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    marketingName: LIFETIME_PREMIUM_MARKETING_NAME,
    title: product.displayName ?? product.title,
    description: product.description,
    displayPrice: product.displayPrice,
    currencyCode: "currency" in product ? product.currency : null,
  };
};

export const buildPurchaseSyncPayload = (
  snapshot: PurchaseSnapshot,
  userId?: string | null,
) => ({
  userId: userId ?? null,
  productId: snapshot.productId,
  purchaseToken: snapshot.purchaseToken,
  transactionId: snapshot.transactionId,
  premiumSource: snapshot.premiumSource,
  verificationSource: snapshot.verificationSource,
});

export const buildPurchaseVerificationPlaceholder = (purchase: Purchase) => ({
  productId: purchase.productId,
  purchaseToken: purchase.purchaseToken ?? null,
  transactionId: purchase.transactionId ?? null,
  purchaseState: purchase.purchaseState,
  eligibleForEntitlement: isPurchaseEligibleForEntitlement(purchase),
  // TODO: Send this payload to a trusted backend endpoint and persist the verified entitlement in Firebase.
});
