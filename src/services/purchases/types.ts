export interface PurchaseEntitlements {
  hasPremiumAccents: boolean;
  hasLifetimePremium: boolean;
  isPremium: boolean;
  state: "unknown" | "inactive" | "active" | "pending-verification";
  source: "none" | "google-play" | "firebase-sync" | "backend-override";
}

export interface PurchaseSnapshot {
  entitlements: PurchaseEntitlements;
  lastValidatedAt: string | null;
  lastSyncedAt: string | null;
  acknowledgedAt: string | null;
  platform: "android" | "ios" | "web" | "unknown";
  productId: string | null;
  purchaseToken: string | null;
  transactionId: string | null;
  purchaseState: "idle" | "purchased" | "restored" | "failed" | "cancelled";
  premiumSource: PurchaseEntitlements["source"];
  verificationSource: "local-cache" | "play-store" | "server-verified";
  lastErrorCode: string | null;
}

export interface PurchaseProductDetails {
  id: string;
  marketingName: string;
  title: string;
  description: string;
  displayPrice: string;
  currencyCode: string | null;
}
