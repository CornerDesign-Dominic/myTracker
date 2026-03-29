import test from "node:test";
import assert from "node:assert/strict";

import { resolveSubscriptionVisual } from "../../src/constants/subscriptionAssets.ts";

test("maps key brand subscriptions to dedicated local brand visuals", () => {
  assert.deepEqual(resolveSubscriptionVisual("Netflix", "Entertainment"), {
    type: "brand",
    key: "netflix",
  });
  assert.deepEqual(resolveSubscriptionVisual("Spotify", "Music"), {
    type: "brand",
    key: "spotify",
  });
  assert.deepEqual(resolveSubscriptionVisual("Amazon Prime", "Shopping"), {
    type: "brand",
    key: "amazonPrime",
  });
  assert.deepEqual(resolveSubscriptionVisual("Disney+", "Entertainment"), {
    type: "brand",
    key: "disneyPlus",
  });
  assert.deepEqual(resolveSubscriptionVisual("YouTube Premium", "Entertainment"), {
    type: "brand",
    key: "youtubePremium",
  });
  assert.deepEqual(resolveSubscriptionVisual("Apple Music", "Music"), {
    type: "brand",
    key: "appleMusic",
  });
  assert.deepEqual(resolveSubscriptionVisual("iCloud", "Cloud"), {
    type: "brand",
    key: "icloud",
  });
  assert.deepEqual(resolveSubscriptionVisual("Adobe Creative Cloud", "Software"), {
    type: "brand",
    key: "adobeCreativeCloud",
  });
  assert.deepEqual(resolveSubscriptionVisual("Dropbox", "Cloud"), {
    type: "brand",
    key: "dropbox",
  });
  assert.deepEqual(resolveSubscriptionVisual("Notion", "Productivity"), {
    type: "brand",
    key: "notion",
  });
  assert.deepEqual(resolveSubscriptionVisual("Canva", "Productivity"), {
    type: "brand",
    key: "canva",
  });
  assert.deepEqual(resolveSubscriptionVisual("ChatGPT Plus", "Productivity"), {
    type: "brand",
    key: "chatgpt",
  });
  assert.deepEqual(resolveSubscriptionVisual("Microsoft 365 Family", "Productivity"), {
    type: "brand",
    key: "microsoft365",
  });
  assert.deepEqual(resolveSubscriptionVisual("Google One", "Cloud"), {
    type: "brand",
    key: "googleOne",
  });
  assert.deepEqual(resolveSubscriptionVisual("PlayStation Plus", "Gaming"), {
    type: "brand",
    key: "playstationPlus",
  });
  assert.deepEqual(resolveSubscriptionVisual("Xbox Game Pass Ultimate", "Gaming"), {
    type: "brand",
    key: "xboxGamePass",
  });
});

test("matching stays case-insensitive and handles normalized category fallbacks", () => {
  assert.deepEqual(resolveSubscriptionVisual("sPoTiFy premium", "musik"), {
    type: "brand",
    key: "spotify",
  });
  assert.deepEqual(resolveSubscriptionVisual("Unknown Service", "Produktivität"), {
    type: "category",
    key: "productivity",
    iconName: "grid-outline",
  });
  assert.deepEqual(resolveSubscriptionVisual("Unknown Service", "Spiele"), {
    type: "category",
    key: "gaming",
    iconName: "game-controller-outline",
  });
});

test("unknown subscriptions fall back to default icons when name and category are not recognized", () => {
  assert.deepEqual(resolveSubscriptionVisual("My Custom Club", "Membership"), {
    type: "default",
    key: "default",
    iconName: "apps-outline",
  });
});
