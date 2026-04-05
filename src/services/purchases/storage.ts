import AsyncStorage from "@react-native-async-storage/async-storage";

import { LEGACY_PURCHASES_CACHE_KEY_PREFIX, PURCHASES_CACHE_KEY_PREFIX } from "./constants";
import { getDefaultEntitlements } from "./entitlements";
import { PurchaseSnapshot } from "./types";

const getStorageKey = (scope: string) => `${PURCHASES_CACHE_KEY_PREFIX}.${scope}`;
const getLegacyStorageKey = (scope: string) => `${LEGACY_PURCHASES_CACHE_KEY_PREFIX}.${scope}`;

export const createEmptyPurchaseSnapshot = (
  platform: PurchaseSnapshot["platform"] = "unknown",
): PurchaseSnapshot => ({
  entitlements: getDefaultEntitlements(),
  lastValidatedAt: null,
  lastSyncedAt: null,
  acknowledgedAt: null,
  platform,
  productId: null,
  purchaseToken: null,
  transactionId: null,
  purchaseState: "idle",
  premiumSource: "none",
  verificationSource: "local-cache",
  lastErrorCode: null,
});

export const readCachedPurchaseSnapshot = async (scope: string): Promise<PurchaseSnapshot | null> => {
  const raw =
    (await AsyncStorage.getItem(getStorageKey(scope))) ??
    (await AsyncStorage.getItem(getLegacyStorageKey(scope)));

  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as Partial<PurchaseSnapshot>;

  return {
    ...createEmptyPurchaseSnapshot(parsed.platform ?? "unknown"),
    ...parsed,
    entitlements: {
      ...getDefaultEntitlements(),
      ...(parsed.entitlements ?? {}),
    },
    premiumSource: parsed.premiumSource ?? "none",
    verificationSource: parsed.verificationSource ?? "local-cache",
    lastErrorCode: parsed.lastErrorCode ?? null,
  };
};

export const writeCachedPurchaseSnapshot = async (scope: string, snapshot: PurchaseSnapshot) => {
  await AsyncStorage.setItem(getStorageKey(scope), JSON.stringify(snapshot));
};
