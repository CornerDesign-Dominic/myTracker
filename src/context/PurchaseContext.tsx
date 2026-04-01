import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { ErrorCode, Product, PurchaseError, useIAP } from "react-native-iap";

import { useAuth } from "@/context/AuthContext";
import { SUPPORT_COLORS_PRODUCT_ID } from "@/services/purchases/constants";
import { buildPurchaseSnapshot, buildSnapshotFromSinglePurchase } from "@/services/purchases/entitlements";
import {
  createEmptyPurchaseSnapshot,
  readCachedPurchaseSnapshot,
  writeCachedPurchaseSnapshot,
} from "@/services/purchases/storage";
import { PurchaseProductDetails, PurchaseSnapshot } from "@/services/purchases/types";

type PurchaseContextValue = {
  hasSupportColors: boolean;
  isPremium: boolean;
  isHydrated: boolean;
  isPurchasing: boolean;
  isRefreshing: boolean;
  isStoreConnected: boolean;
  purchaseError: string | null;
  supportColorsProduct: PurchaseProductDetails | null;
  purchaseSupportColors: () => Promise<void>;
  refreshPurchases: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearPurchaseError: () => void;
};

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

const DEFAULT_VALUE: PurchaseContextValue = {
  hasSupportColors: false,
  isPremium: false,
  isHydrated: true,
  isPurchasing: false,
  isRefreshing: false,
  isStoreConnected: false,
  purchaseError: null,
  supportColorsProduct: null,
  purchaseSupportColors: async () => undefined,
  refreshPurchases: async () => undefined,
  restorePurchases: async () => undefined,
  clearPurchaseError: () => undefined,
};

const getPurchaseScope = (userId?: string | null) => userId ?? "guest";

const mapProduct = (product: Product | null | undefined): PurchaseProductDetails | null => {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    title: product.displayName ?? product.title,
    description: product.description,
    displayPrice: product.displayPrice,
    currencyCode: "currency" in product ? product.currency : null,
  };
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
        await getAvailablePurchases({
          includeSuspendedAndroid: false,
        });
      } catch (error) {
        setPurchaseError(error instanceof Error ? error.message : "Purchase processing failed.");
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
      setIsPurchasing(false);
    },
    onError: (error) => {
      setPurchaseError(error.message);
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
      skus: [SUPPORT_COLORS_PRODUCT_ID],
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

  const supportColorsProduct = useMemo(
    () => mapProduct(products.find((product) => product.id === SUPPORT_COLORS_PRODUCT_ID)),
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

  const purchaseSupportColors = async () => {
    setPurchaseError(null);
    setIsPurchasing(true);

    try {
      await requestPurchase({
        type: "in-app",
        request: {
          android: {
            skus: [SUPPORT_COLORS_PRODUCT_ID],
          },
        },
      });
    } catch (error) {
      setIsPurchasing(false);
      setPurchaseError(error instanceof Error ? error.message : "Purchase failed.");
      throw error;
    }
  };

  const value = useMemo<PurchaseContextValue>(
    () => ({
      hasSupportColors: snapshot.entitlements.hasSupportColors,
      isPremium: snapshot.entitlements.isPremium,
      isHydrated,
      isPurchasing,
      isRefreshing,
      isStoreConnected: connected,
      purchaseError,
      supportColorsProduct,
      purchaseSupportColors,
      refreshPurchases,
      restorePurchases,
      clearPurchaseError: () => setPurchaseError(null),
    }),
    [connected, isHydrated, isPurchasing, isRefreshing, purchaseError, snapshot, supportColorsProduct],
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
