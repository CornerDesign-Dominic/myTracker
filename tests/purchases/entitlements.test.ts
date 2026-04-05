import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSnapshotFromSinglePurchase,
  deriveEntitlementsFromPurchases,
} from "../../src/services/purchases/entitlements.ts";

test("existing legacy purchase still unlocks lifetime premium", () => {
  const entitlements = deriveEntitlementsFromPurchases([
    {
      productId: "support_colors",
      purchaseState: "purchased",
      isSuspendedAndroid: false,
    } as never,
  ]);

  assert.equal(entitlements.hasPremiumAccents, true);
  assert.equal(entitlements.hasLifetimePremium, true);
  assert.equal(entitlements.isPremium, true);
});

test("single purchase snapshot mirrors premium from the legacy product", () => {
  const snapshot = buildSnapshotFromSinglePurchase(
    {
      productId: "support_colors",
      purchaseState: "purchased",
      purchaseToken: "token-1",
      transactionId: "tx-1",
      isSuspendedAndroid: false,
    } as never,
    "android",
  );

  assert.equal(snapshot.entitlements.hasPremiumAccents, true);
  assert.equal(snapshot.entitlements.hasLifetimePremium, true);
  assert.equal(snapshot.entitlements.isPremium, true);
});
