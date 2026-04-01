import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSnapshotFromSinglePurchase,
  deriveEntitlementsFromPurchases,
} from "../../src/services/purchases/entitlements.ts";

test("existing support colors purchase also unlocks premium", () => {
  const entitlements = deriveEntitlementsFromPurchases([
    {
      productId: "support_colors",
      purchaseState: "purchased",
      isSuspendedAndroid: false,
    } as never,
  ]);

  assert.equal(entitlements.hasSupportColors, true);
  assert.equal(entitlements.isPremium, true);
});

test("single purchase snapshot mirrors premium from the existing product", () => {
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

  assert.equal(snapshot.entitlements.hasSupportColors, true);
  assert.equal(snapshot.entitlements.isPremium, true);
});
