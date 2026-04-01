import test from "node:test";
import assert from "node:assert/strict";

import {
  FREE_SUBSCRIPTION_LIMIT,
  canCreateSubscription,
  getSubscriptionCount,
} from "../../src/services/purchases/freemium.ts";

test("free users can create subscriptions only below the free limit", () => {
  assert.equal(
    canCreateSubscription({
      subscriptionCount: FREE_SUBSCRIPTION_LIMIT - 1,
      isPremium: false,
    }),
    true,
  );

  assert.equal(
    canCreateSubscription({
      subscriptionCount: FREE_SUBSCRIPTION_LIMIT,
      isPremium: false,
    }),
    false,
  );
});

test("premium users can create subscriptions above the free limit", () => {
  assert.equal(
    canCreateSubscription({
      subscriptionCount: FREE_SUBSCRIPTION_LIMIT,
      isPremium: true,
    }),
    true,
  );
});

test("subscription count uses all non-archived subscriptions from the active collection", () => {
  assert.equal(
    getSubscriptionCount([
      { id: "1" } as never,
      { id: "2" } as never,
      { id: "3" } as never,
    ]),
    3,
  );
});
