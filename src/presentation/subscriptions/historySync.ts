import AsyncStorage from "@react-native-async-storage/async-storage";

export const GLOBAL_SYNC_COOLDOWN_MS = 8 * 60 * 60 * 1000;

export const getGlobalSyncStorageKey = (userId: string) =>
  `subscription-history:last-global-sync:${userId}`;

export const shouldRunGlobalSync = ({
  lastSyncedAt,
  now = Date.now(),
  cooldownMs = GLOBAL_SYNC_COOLDOWN_MS,
}: {
  lastSyncedAt: number | null;
  now?: number;
  cooldownMs?: number;
}) => lastSyncedAt === null || now - lastSyncedAt >= cooldownMs;

export const readLastGlobalSyncAt = async (userId: string) => {
  const rawValue = await AsyncStorage.getItem(getGlobalSyncStorageKey(userId));
  if (!rawValue) {
    return null;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const writeLastGlobalSyncAt = async (userId: string, timestamp: number) => {
  await AsyncStorage.setItem(getGlobalSyncStorageKey(userId), String(timestamp));
};
