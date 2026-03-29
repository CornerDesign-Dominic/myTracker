import { Platform } from "react-native";

type CrashlyticsAttributeValue = string | number | boolean | null | undefined;

type CrashlyticsLike = {
  recordError: (error: Error) => void;
  log: (message: string) => void;
  setUserId: (userId: string) => void;
  setAttribute: (name: string, value: string) => void;
};

const normalizeAttributeValue = (value: CrashlyticsAttributeValue) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === "string" ? error : JSON.stringify(error));
};

let cachedCrashlytics: CrashlyticsLike | null | undefined;

const getCrashlyticsInstance = (): CrashlyticsLike | null => {
  if (cachedCrashlytics !== undefined) {
    return cachedCrashlytics ?? null;
  }

  if (Platform.OS === "web") {
    cachedCrashlytics = null;
    return cachedCrashlytics;
  }

  try {
    const crashlyticsModule = require("@react-native-firebase/crashlytics").default;
    cachedCrashlytics = crashlyticsModule();
    return cachedCrashlytics ?? null;
  } catch {
    cachedCrashlytics = null;
    return cachedCrashlytics ?? null;
  }
};

export const crashlyticsService = {
  isAvailable() {
    return getCrashlyticsInstance() !== null;
  },
  log(message: string) {
    const instance = getCrashlyticsInstance();
    instance?.log(message);
  },
  setUserId(userId?: string | null) {
    const instance = getCrashlyticsInstance();

    if (!instance) {
      return;
    }

    instance.setUserId(userId ? String(userId) : "");
  },
  setAttribute(name: string, value: CrashlyticsAttributeValue) {
    const instance = getCrashlyticsInstance();

    if (!instance) {
      return;
    }

    instance.setAttribute(name, normalizeAttributeValue(value));
  },
  recordError(error: unknown, context?: Record<string, CrashlyticsAttributeValue>) {
    const instance = getCrashlyticsInstance();

    if (!instance) {
      return;
    }

    const normalizedError = normalizeError(error);

    Object.entries(context ?? {}).forEach(([key, value]) => {
      instance.setAttribute(key, normalizeAttributeValue(value));
    });

    instance.recordError(normalizedError);
  },
};
