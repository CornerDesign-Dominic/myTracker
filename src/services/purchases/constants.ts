import type { AccentColor } from "@/theme";

export const LIFETIME_PREMIUM_PRODUCT_ID = "octovault_lifetime_premium";
// Legacy Google Play SKU kept for restore / entitlement recognition of older purchases.
export const LEGACY_LIFETIME_PREMIUM_PRODUCT_IDS = ["support_colors"] as const;
export const ALL_LIFETIME_PREMIUM_PRODUCT_IDS = [
  LIFETIME_PREMIUM_PRODUCT_ID,
  ...LEGACY_LIFETIME_PREMIUM_PRODUCT_IDS,
] as const;
export const LIFETIME_PREMIUM_MARKETING_NAME = "OctoVault Premium";
export const PURCHASES_CACHE_KEY_PREFIX = "octovault.billing";
export const LEGACY_PURCHASES_CACHE_KEY_PREFIX = "tracker.purchases";
export const FREE_ACCENT_COLOR: AccentColor = "green";
export const FREE_ACCENT_COLORS: readonly AccentColor[] = ["green"];
