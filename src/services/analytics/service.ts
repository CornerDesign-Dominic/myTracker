import { crashlyticsService } from "@/services/crashlytics/crashlytics";
import { runtimeConfig } from "@/config/runtime";

import type { AnalyticsEventName } from "./events";

type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsAdapter = {
  setCollectionEnabled?: (enabled: boolean) => void | Promise<void>;
  setUserId?: (userId: string | null) => void | Promise<void>;
  track?: (
    eventName: AnalyticsEventName,
    params?: Record<string, AnalyticsValue>,
  ) => void | Promise<void>;
};

const adapters = new Set<AnalyticsAdapter>();

let analyticsConsentGranted = false;
let analyticsDebugEnabled = runtimeConfig.analyticsDebugEnabled;

const sanitizeParams = (params?: Record<string, AnalyticsValue>) =>
  Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined),
  );

const consoleAdapter: AnalyticsAdapter = {
  setCollectionEnabled(enabled) {
    if (analyticsDebugEnabled) {
      console.log("[Analytics] collection", { enabled });
    }
  },
  setUserId(userId) {
    if (analyticsDebugEnabled) {
      console.log("[Analytics] user", { userId });
    }
  },
  track(eventName, params) {
    if (analyticsDebugEnabled) {
      console.log("[Analytics] event", { eventName, params: sanitizeParams(params) });
    }
  },
};

adapters.add(consoleAdapter);

export const analyticsService = {
  registerAdapter(adapter: AnalyticsAdapter) {
    adapters.add(adapter);

    return () => {
      adapters.delete(adapter);
    };
  },
  setConsentGranted(granted: boolean) {
    analyticsConsentGranted = granted;
    adapters.forEach((adapter) => {
      adapter.setCollectionEnabled?.(granted);
    });
  },
  setDebugEnabled(enabled: boolean) {
    analyticsDebugEnabled = enabled;
  },
  setUserId(userId: string | null) {
    adapters.forEach((adapter) => {
      adapter.setUserId?.(userId);
    });
  },
  track(eventName: AnalyticsEventName, params?: Record<string, AnalyticsValue>) {
    if (!analyticsConsentGranted && !runtimeConfig.analyticsDebugEnabled) {
      return;
    }

    const sanitizedParams = sanitizeParams(params);

    adapters.forEach((adapter) => {
      adapter.track?.(eventName, sanitizedParams);
    });

    crashlyticsService.log(
      `[Analytics] ${eventName} ${JSON.stringify(sanitizedParams)}`,
    );
  },
};
