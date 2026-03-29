import test from "node:test";
import assert from "node:assert/strict";

import { shouldSyncSubscriptionHistory } from "../../src/presentation/subscriptions/syncRules.ts";

test("sync runs only when auth is ready, a user scope exists and subscriptions are loaded", () => {
  assert.equal(
    shouldSyncSubscriptionHistory({
      authIsReady: true,
      userId: "user-1",
      subscriptionCount: 2,
    }),
    true,
  );

  assert.equal(
    shouldSyncSubscriptionHistory({
      authIsReady: false,
      userId: "user-1",
      subscriptionCount: 2,
    }),
    false,
  );

  assert.equal(
    shouldSyncSubscriptionHistory({
      authIsReady: true,
      userId: null,
      subscriptionCount: 2,
    }),
    false,
  );

  assert.equal(
    shouldSyncSubscriptionHistory({
      authIsReady: true,
      userId: "user-1",
      subscriptionCount: 0,
    }),
    false,
  );
});
