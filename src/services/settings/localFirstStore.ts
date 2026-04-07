import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppLanguage } from "@/i18n/translations";
import { updateUserSettings } from "@/services/firestore/userFirestore";
import { FREE_ACCENT_COLOR } from "@/services/purchases/constants";
import { AccentColor } from "@/theme";
import { logFirestoreError } from "@/utils/firestoreDebug";

export type LocalFirstCurrencyOption = "EUR" | "Dollar";
export type LocalFirstThemeOption = "Dark" | "Light";
export type LocalFirstWeekStartOption = "monday" | "sunday";

export type LocalFirstAppSettings = {
  language: AppLanguage;
  currency: LocalFirstCurrencyOption;
  theme: LocalFirstThemeOption;
  weekStart: LocalFirstWeekStartOption;
  notificationsEnabled: boolean;
  accentColor: AccentColor;
};

export type LocalFirstSettingKey = keyof LocalFirstAppSettings;

type LocalFirstSettingOperationValue = LocalFirstAppSettings[LocalFirstSettingKey];

type LocalFirstSettingOperation = {
  id: string;
  key: LocalFirstSettingKey;
  value: LocalFirstSettingOperationValue;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
};

type PersistedSettingsState = {
  version: 1;
  settings: LocalFirstAppSettings;
  outboxByUser: Record<string, LocalFirstSettingOperation[]>;
};

const STORAGE_KEY = "tracker.app-settings.local-first.v1";

const createDefaultSettings = (): LocalFirstAppSettings => ({
  language: "de",
  currency: "EUR",
  theme: "Light",
  weekStart: "monday",
  notificationsEnabled: true,
  accentColor: FREE_ACCENT_COLOR,
});

const sanitizeSettings = (
  settings?: Partial<LocalFirstAppSettings> | null,
): LocalFirstAppSettings => {
  const defaults = createDefaultSettings();

  return {
    language: settings?.language === "en" ? "en" : settings?.language === "de" ? "de" : defaults.language,
    currency: settings?.currency === "Dollar" ? "Dollar" : "EUR",
    theme: settings?.theme === "Dark" ? "Dark" : settings?.theme === "Light" ? "Light" : defaults.theme,
    weekStart: settings?.weekStart === "sunday" ? "sunday" : "monday",
    notificationsEnabled:
      typeof settings?.notificationsEnabled === "boolean"
        ? settings.notificationsEnabled
        : defaults.notificationsEnabled,
    accentColor: settings?.accentColor ?? defaults.accentColor,
  };
};

const sanitizePartialSettings = (
  settings?: Partial<LocalFirstAppSettings> | null,
): Partial<LocalFirstAppSettings> => {
  if (!settings) {
    return {};
  }

  const nextSettings: Partial<LocalFirstAppSettings> = {};

  if (settings.language === "de" || settings.language === "en") {
    nextSettings.language = settings.language;
  }

  if (settings.currency === "EUR" || settings.currency === "Dollar") {
    nextSettings.currency = settings.currency;
  }

  if (settings.theme === "Light" || settings.theme === "Dark") {
    nextSettings.theme = settings.theme;
  }

  if (settings.weekStart === "monday" || settings.weekStart === "sunday") {
    nextSettings.weekStart = settings.weekStart;
  }

  if (typeof settings.notificationsEnabled === "boolean") {
    nextSettings.notificationsEnabled = settings.notificationsEnabled;
  }

  if (settings.accentColor) {
    nextSettings.accentColor = settings.accentColor;
  }

  return nextSettings;
};

const sanitizeOperation = (
  operation: Partial<LocalFirstSettingOperation> | null | undefined,
): LocalFirstSettingOperation | null => {
  if (!operation || !operation.key) {
    return null;
  }

  const defaults = createDefaultSettings();
  const key = operation.key;

  let value: LocalFirstSettingOperationValue;

  switch (key) {
    case "language":
      value = operation.value === "en" ? "en" : "de";
      break;
    case "currency":
      value = operation.value === "Dollar" ? "Dollar" : defaults.currency;
      break;
    case "theme":
      value = operation.value === "Dark" ? "Dark" : defaults.theme;
      break;
    case "weekStart":
      value = operation.value === "sunday" ? "sunday" : defaults.weekStart;
      break;
    case "notificationsEnabled":
      value = Boolean(operation.value);
      break;
    case "accentColor":
      value = (operation.value as AccentColor | undefined) ?? defaults.accentColor;
      break;
    default:
      return null;
  }

  return {
    id: typeof operation.id === "string" && operation.id.length > 0 ? operation.id : `${key}-${Date.now()}`,
    key,
    value,
    createdAt:
      typeof operation.createdAt === "string" && operation.createdAt.length > 0
        ? operation.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof operation.updatedAt === "string" && operation.updatedAt.length > 0
        ? operation.updatedAt
        : new Date().toISOString(),
    lastError: typeof operation.lastError === "string" ? operation.lastError : undefined,
  };
};

const sanitizePersistedState = (
  value: Partial<PersistedSettingsState> | null | undefined,
): PersistedSettingsState => {
  const outboxByUserEntries = Object.entries(value?.outboxByUser ?? {}).map(([userId, operations]) => [
    userId,
    Array.isArray(operations)
      ? operations
          .map((operation) => sanitizeOperation(operation))
          .filter((operation): operation is LocalFirstSettingOperation => Boolean(operation))
      : [],
  ]);

  return {
    version: 1,
    settings: sanitizeSettings(value?.settings),
    outboxByUser: Object.fromEntries(outboxByUserEntries),
  };
};

const settingsEqual = <T extends LocalFirstSettingKey>(
  left: LocalFirstAppSettings[T],
  right: LocalFirstAppSettings[T],
) => left === right;

class LocalFirstSettingsStore {
  private state: PersistedSettingsState = sanitizePersistedState(null);

  private hydrated = false;

  private async persistState() {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  private async ensureHydrated(defaultSettings?: LocalFirstAppSettings) {
    if (this.hydrated) {
      if (defaultSettings) {
        this.state = {
          ...this.state,
          settings: sanitizeSettings({
            ...defaultSettings,
            ...this.state.settings,
          }),
        };
      }

      return;
    }

    try {
      const rawState = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedState = rawState ? (JSON.parse(rawState) as Partial<PersistedSettingsState>) : null;
      this.state = sanitizePersistedState(parsedState);
    } catch {
      this.state = sanitizePersistedState(null);
    }

    if (defaultSettings) {
      this.state = {
        ...this.state,
        settings: sanitizeSettings({
          ...defaultSettings,
          ...this.state.settings,
        }),
      };
      await this.persistState();
    }

    this.hydrated = true;
  }

  async hydrate(defaultSettings: LocalFirstAppSettings) {
    await this.ensureHydrated(defaultSettings);
    return this.getSettings();
  }

  getSettings() {
    return { ...this.state.settings };
  }

  getPendingOperations(userId?: string | null) {
    if (!userId) {
      return [];
    }

    return [...(this.state.outboxByUser[userId] ?? [])];
  }

  hasPendingOperation(userId: string | null | undefined, key: LocalFirstSettingKey) {
    if (!userId) {
      return false;
    }

    return (this.state.outboxByUser[userId] ?? []).some((operation) => operation.key === key);
  }

  async enqueueChange<T extends LocalFirstSettingKey>(
    userId: string | null | undefined,
    key: T,
    value: LocalFirstAppSettings[T],
  ) {
    await this.ensureHydrated();

    const nextSettings = sanitizeSettings({
      ...this.state.settings,
      [key]: value,
    });

    const currentValue = this.state.settings[key];
    const hasFachlicheChange = !settingsEqual(currentValue, nextSettings[key]);

    this.state = {
      ...this.state,
      settings: nextSettings,
    };

    if (!userId) {
      await this.persistState();
      return this.getSettings();
    }

    const operations = this.state.outboxByUser[userId] ?? [];
    const lastPendingForKey = [...operations].reverse().find((operation) => operation.key === key);

    if (
      hasFachlicheChange ||
      !lastPendingForKey ||
      !settingsEqual(lastPendingForKey.value as LocalFirstAppSettings[T], nextSettings[key])
    ) {
      const now = new Date().toISOString();
      const nextOperation: LocalFirstSettingOperation = {
        id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        key,
        value: nextSettings[key],
        createdAt: now,
        updatedAt: now,
      };

      this.state = {
        ...this.state,
        outboxByUser: {
          ...this.state.outboxByUser,
          [userId]: [...operations, nextOperation],
        },
      };
    }

    await this.persistState();
    return this.getSettings();
  }

  async enqueueAll(userId: string, settings: LocalFirstAppSettings) {
    await this.ensureHydrated();

    const nextSettings = sanitizeSettings(settings);

    this.state = {
      ...this.state,
      settings: nextSettings,
    };

    const operations = [...(this.state.outboxByUser[userId] ?? [])];
    const now = new Date().toISOString();

    (Object.entries(nextSettings) as [LocalFirstSettingKey, LocalFirstSettingOperationValue][]).forEach(
      ([key, value]) => {
        const hasSamePending = [...operations]
          .reverse()
          .find((operation) => operation.key === key && settingsEqual(operation.value, value));

        if (hasSamePending) {
          return;
        }

        operations.push({
          id: `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          key,
          value,
          createdAt: now,
          updatedAt: now,
        });
      },
    );

    this.state = {
      ...this.state,
      outboxByUser: {
        ...this.state.outboxByUser,
        [userId]: operations,
      },
    };

    await this.persistState();
    return this.getSettings();
  }

  async mergeRemoteSettings(userId: string, settings: Partial<LocalFirstAppSettings> | null) {
    await this.ensureHydrated();

    const nextSettings = { ...this.state.settings };
    const pendingKeys = new Set((this.state.outboxByUser[userId] ?? []).map((operation) => operation.key));
    const sanitizedSettings = sanitizePartialSettings(settings);

    (Object.entries(sanitizedSettings) as [LocalFirstSettingKey, LocalFirstSettingOperationValue][])
      .forEach(([key, value]) => {
      if (pendingKeys.has(key)) {
        return;
      }

      nextSettings[key] = value as never;
    });

    this.state = {
      ...this.state,
      settings: sanitizeSettings(nextSettings),
    };

    await this.persistState();
    return this.getSettings();
  }

  async retryPending(userId: string) {
    await this.ensureHydrated();

    while (true) {
      const operations = this.state.outboxByUser[userId] ?? [];
      const nextOperation = operations[0];

      if (!nextOperation) {
        return;
      }

      try {
        await updateUserSettings(userId, {
          [nextOperation.key]: nextOperation.value,
        });

        this.state = {
          ...this.state,
          outboxByUser: {
            ...this.state.outboxByUser,
            [userId]: operations.slice(1),
          },
        };

        await this.persistState();
      } catch (error) {
        const lastError = error instanceof Error ? error.message : "settings-sync-failed";
        const failedOperation: LocalFirstSettingOperation = {
          ...nextOperation,
          lastError,
          updatedAt: new Date().toISOString(),
        };

        this.state = {
          ...this.state,
          outboxByUser: {
            ...this.state.outboxByUser,
            [userId]: [failedOperation, ...operations.slice(1)],
          },
        };

        await this.persistState();
        logFirestoreError("localFirstSettingsStore.retryPending", error, {
          userId,
          key: nextOperation.key,
          value: nextOperation.value,
        });
        return;
      }
    }
  }
}

const localFirstSettingsStore = new LocalFirstSettingsStore();

export const hydrateLocalFirstSettings = async (defaultSettings: LocalFirstAppSettings) =>
  localFirstSettingsStore.hydrate(defaultSettings);

export const enqueueLocalFirstSettingChange = async <T extends LocalFirstSettingKey>(
  userId: string | null | undefined,
  key: T,
  value: LocalFirstAppSettings[T],
) => localFirstSettingsStore.enqueueChange(userId, key, value);

export const enqueueAllLocalFirstSettingsForSync = async (
  userId: string,
  settings: LocalFirstAppSettings,
) => localFirstSettingsStore.enqueueAll(userId, settings);

export const mergeRemoteLocalFirstSettings = async (
  userId: string,
  settings: Partial<LocalFirstAppSettings> | null,
) => localFirstSettingsStore.mergeRemoteSettings(userId, settings);

export const retryPendingSettingsSync = async (userId: string) =>
  localFirstSettingsStore.retryPending(userId);

export const getLocalFirstSettingsSnapshot = () => localFirstSettingsStore.getSettings();

export const getPendingLocalFirstSettingsOperations = (userId?: string | null) =>
  localFirstSettingsStore.getPendingOperations(userId);

export const hasPendingLocalFirstSetting = (
  userId: string | null | undefined,
  key: LocalFirstSettingKey,
) => localFirstSettingsStore.hasPendingOperation(userId, key);
