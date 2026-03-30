import AsyncStorage from "@react-native-async-storage/async-storage";

import { PURCHASES_CACHE_KEY_PREFIX } from "./constants";
import { getDefaultEntitlements } from "./entitlements";
import { PurchaseSnapshot } from "./types";

const getStorageKey = (scope: string) => `${PURCHASES_CACHE_KEY_PREFIX}.${scope}`;

export const createEmptyPurchaseSnapshot = (
  platform: PurchaseSnapshot["platform"] = "unknown",
): PurchaseSnapshot => ({
  entitlements: getDefaultEntitlements(),
  lastValidatedAt: null,
  platform,
  productId: null,
  purchaseToken: null,
  transactionId: null,
  verificationSource: "local-cache",
});

export const readCachedPurchaseSnapshot = async (scope: string): Promise<PurchaseSnapshot | null> => {
  const raw = await AsyncStorage.getItem(getStorageKey(scope));

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
    verificationSource: "local-cache",
  };
};

export const writeCachedPurchaseSnapshot = async (scope: string, snapshot: PurchaseSnapshot) => {
  await AsyncStorage.setItem(getStorageKey(scope), JSON.stringify(snapshot));
};
