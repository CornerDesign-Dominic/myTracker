import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { ErrorCode, Product, PurchaseError, useIAP } from "react-native-iap";

import { useAuth } from "@/context/AuthContext";
import { analyticsEventNames } from "@/services/analytics/events";
import { analyticsService } from "@/services/analytics/service";
import {
  ALL_LIFETIME_PREMIUM_PRODUCT_IDS,
  LIFETIME_PREMIUM_PRODUCT_ID,
} from "@/services/purchases/constants";
import { buildPurchaseSnapshot, buildSnapshotFromSinglePurchase } from "@/services/purchases/entitlements";
import {
  buildPurchaseSyncPayload,
  buildPurchaseVerificationPlaceholder,
  getPreferredLifetimePremiumProduct,
  getPurchaseScope,
  mapProductToDetails,
} from "@/services/purchases/billingService";
import {
  createEmptyPurchaseSnapshot,
  readCachedPurchaseSnapshot,
  writeCachedPurchaseSnapshot,
} from "@/services/purchases/storage";
import { PurchaseProductDetails, PurchaseSnapshot } from "@/services/purchases/types";

type PurchaseContextValue = {
  hasPremiumAccents: boolean;
  hasLifetimePremium: boolean;
  isPremium: boolean;
  isHydrated: boolean;
  isPurchasing: boolean;
  isRefreshing: boolean;
  isStoreConnected: boolean;
  purchaseError: string | null;
  lifetimePremiumProduct: PurchaseProductDetails | null;
  purchaseLifetimePremium: () => Promise<void>;
  refreshPurchases: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearPurchaseError: () => void;
};

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

const DEFAULT_VALUE: PurchaseContextValue = {
  hasPremiumAccents: false,
  hasLifetimePremium: false,
  isPremium: false,
  isHydrated: true,
  isPurchasing: false,
  isRefreshing: false,
  isStoreConnected: false,
  purchaseError: null,
  lifetimePremiumProduct: null,
  purchaseLifetimePremium: async () => undefined,
  refreshPurchases: async () => undefined,
  restorePurchases: async () => undefined,
  clearPurchaseError: () => undefined,
};

const AndroidPurchaseProvider = ({ children }: PropsWithChildren) => {
  const { currentUser } = useAuth();
  const scope = getPurchaseScope(currentUser?.uid);
  const [snapshot, setSnapshot] = useState<PurchaseSnapshot>(createEmptyPurchaseSnapshot("android"));
  const [isHydrated, setIsHydrated] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedStorePurchases, setHasLoadedStorePurchases] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const {
    connected,
    products,
    availablePurchases,
    fetchProducts,
    finishTransaction,
    getAvailablePurchases,
    requestPurchase,
    restorePurchases: restoreStorePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        setPurchaseError(null);
        await finishTransaction({
          purchase,
          isConsumable: false,
        });

        const nextSnapshot = buildSnapshotFromSinglePurchase(purchase, "android");
        setSnapshot(nextSnapshot);
        await writeCachedPurchaseSnapshot(scope, nextSnapshot);
        buildPurchaseVerificationPlaceholder(purchase);
        buildPurchaseSyncPayload(nextSnapshot, currentUser?.uid);
        analyticsService.track(analyticsEventNames.premiumPurchaseSuccess, {
          productId: purchase.productId,
          transactionId: purchase.transactionId ?? null,
        });
        await getAvailablePurchases({
          includeSuspendedAndroid: false,
        });
      } catch (error) {
        setPurchaseError(error instanceof Error ? error.message : "Purchase processing failed.");
        analyticsService.track(analyticsEventNames.premiumPurchaseFailed, {
          reason: error instanceof Error ? error.message : "processing_failed",
        });
      } finally {
        setIsPurchasing(false);
      }
    },
    onPurchaseError: (error: PurchaseError) => {
      if (error.code === ErrorCode.UserCancelled) {
        setPurchaseError("cancelled");
      } else {
        setPurchaseError(error.message);
      }
      analyticsService.track(analyticsEventNames.premiumPurchaseFailed, {
        code: error.code,
        reason: error.message,
      });
      setIsPurchasing(false);
    },
    onError: (error) => {
      setPurchaseError(error.message);
      analyticsService.track(analyticsEventNames.premiumPurchaseFailed, {
        reason: error.message,
      });
    },
  });

  useEffect(() => {
    let isActive = true;

    const hydrateCache = async () => {
      try {
        const cachedSnapshot = await readCachedPurchaseSnapshot(scope);

        if (!isActive) {
          return;
        }

        setSnapshot(cachedSnapshot ?? createEmptyPurchaseSnapshot("android"));
      } catch {
        if (!isActive) {
          return;
        }

        setSnapshot(createEmptyPurchaseSnapshot("android"));
      } finally {
        if (isActive) {
          setIsHydrated(true);
        }
      }
    };

    setIsHydrated(false);
    setHasLoadedStorePurchases(false);
    hydrateCache();

    return () => {
      isActive = false;
    };
  }, [scope]);

  useEffect(() => {
    if (!connected) {
      return;
    }

    fetchProducts({
      skus: [...ALL_LIFETIME_PREMIUM_PRODUCT_IDS],
      type: "in-app",
    }).catch(() => undefined);
  }, [connected, fetchProducts]);

  useEffect(() => {
    if (!connected || !isHydrated) {
      return;
    }

    setIsRefreshing(true);
    getAvailablePurchases({
      includeSuspendedAndroid: false,
    })
      .catch(() => undefined)
      .finally(() => {
        setHasLoadedStorePurchases(true);
        setIsRefreshing(false);
      });
  }, [connected, getAvailablePurchases, isHydrated, scope]);

  useEffect(() => {
    if (!isHydrated || !hasLoadedStorePurchases) {
      return;
    }

    const nextSnapshot = buildPurchaseSnapshot(availablePurchases, "android");
    setSnapshot(nextSnapshot);
    writeCachedPurchaseSnapshot(scope, nextSnapshot).catch(() => undefined);
  }, [availablePurchases, hasLoadedStorePurchases, isHydrated, scope]);

  const lifetimePremiumProduct = useMemo(
    () => mapProductToDetails(getPreferredLifetimePremiumProduct(products as Product[])),
    [products],
  );

  const refreshPurchases = async () => {
    setPurchaseError(null);
    setIsRefreshing(true);

    try {
      await getAvailablePurchases({
        includeSuspendedAndroid: false,
      });
    } finally {
      setHasLoadedStorePurchases(true);
      setIsRefreshing(false);
    }
  };

  const restorePurchases = async () => {
    setPurchaseError(null);
    setIsRefreshing(true);

    try {
      await restoreStorePurchases({
        includeSuspendedAndroid: false,
      });
    } finally {
      setHasLoadedStorePurchases(true);
      setIsRefreshing(false);
    }
  };

  const purchaseLifetimePremium = async () => {
    setPurchaseError(null);
    setIsPurchasing(true);
    analyticsService.track(analyticsEventNames.premiumPurchaseStarted, {
      platform: "android",
    });

    try {
      await requestPurchase({
        type: "in-app",
        request: {
          android: {
            skus: [LIFETIME_PREMIUM_PRODUCT_ID],
          },
        },
      });
    } catch (error) {
      setIsPurchasing(false);
      setPurchaseError(error instanceof Error ? error.message : "Purchase failed.");
      analyticsService.track(analyticsEventNames.premiumPurchaseFailed, {
        reason: error instanceof Error ? error.message : "request_failed",
      });
      throw error;
    }
  };

  const value = useMemo<PurchaseContextValue>(
    () => ({
      hasPremiumAccents: snapshot.entitlements.hasPremiumAccents,
      hasLifetimePremium: snapshot.entitlements.hasLifetimePremium,
      isPremium: snapshot.entitlements.isPremium,
      isHydrated,
      isPurchasing,
      isRefreshing,
      isStoreConnected: connected,
      purchaseError,
      lifetimePremiumProduct,
      purchaseLifetimePremium,
      refreshPurchases,
      restorePurchases,
      clearPurchaseError: () => setPurchaseError(null),
    }),
    [connected, isHydrated, isPurchasing, isRefreshing, purchaseError, snapshot, lifetimePremiumProduct],
  );

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
};

export const PurchaseProvider = ({ children }: PropsWithChildren) => {
  if (Platform.OS !== "android") {
    return <PurchaseContext.Provider value={DEFAULT_VALUE}>{children}</PurchaseContext.Provider>;
  }

  return <AndroidPurchaseProvider>{children}</AndroidPurchaseProvider>;
};

export const usePurchases = () => {
  const context = useContext(PurchaseContext);

  if (!context) {
    throw new Error("usePurchases must be used within PurchaseProvider.");
  }

  return context;
};
