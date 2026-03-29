import test from "node:test";
import assert from "node:assert/strict";

import {
  GLOBAL_SYNC_COOLDOWN_MS,
  getGlobalSyncStorageKey,
  shouldRunGlobalSync,
} from "../../src/presentation/subscriptions/historySync.ts";

test("global sync runs when there has never been a previous sync", () => {
  assert.equal(
    shouldRunGlobalSync({
      lastSyncedAt: null,
      now: 1000,
    }),
    true,
  );
});

test("global sync respects the 8 hour cooldown", () => {
  assert.equal(
    shouldRunGlobalSync({
      lastSyncedAt: 0,
      now: GLOBAL_SYNC_COOLDOWN_MS - 1,
    }),
    false,
  );

  assert.equal(
    shouldRunGlobalSync({
      lastSyncedAt: 0,
      now: GLOBAL_SYNC_COOLDOWN_MS,
    }),
    true,
  );
});

test("global sync storage key is user specific", () => {
  assert.equal(
    getGlobalSyncStorageKey("user-1"),
    "subscription-history:last-global-sync:user-1",
  );
});
