export interface PurchaseEntitlements {
  hasSupportColors: boolean;
}

export interface PurchaseSnapshot {
  entitlements: PurchaseEntitlements;
  lastValidatedAt: string | null;
  platform: "android" | "ios" | "web" | "unknown";
  productId: string | null;
  purchaseToken: string | null;
  transactionId: string | null;
  verificationSource: "local-cache";
}

export interface PurchaseProductDetails {
  id: string;
  title: string;
  description: string;
  displayPrice: string;
  currencyCode: string | null;
}
