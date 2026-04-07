import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Appearance } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { usePurchases } from "@/context/PurchaseContext";
import { AppLanguage } from "@/i18n/translations";
import { subscribeToUserSettings } from "@/services/firestore/userFirestore";
import {
  enqueueAllLocalFirstSettingsForSync,
  enqueueLocalFirstSettingChange,
  hydrateLocalFirstSettings,
  LocalFirstAppSettings,
  LocalFirstCurrencyOption,
  LocalFirstThemeOption,
  LocalFirstWeekStartOption,
  mergeRemoteLocalFirstSettings,
  retryPendingSettingsSync,
} from "@/services/settings/localFirstStore";
import { FREE_ACCENT_COLOR } from "@/services/purchases/constants";
import { canUseAccentColor, getSafeAccentColor } from "@/services/purchases/entitlements";
import { AccentColor } from "@/theme";
import { logFirestoreError } from "@/utils/firestoreDebug";

type LanguageOption = AppLanguage;
type CurrencyOption = LocalFirstCurrencyOption;
type ThemeOption = LocalFirstThemeOption;
type WeekStartOption = LocalFirstWeekStartOption;
type NotificationsOption = "enabled" | "disabled";

const FALLBACK_LANGUAGE: LanguageOption = "de";

const getSystemLanguage = (): LanguageOption => {
  const locale = Intl.NumberFormat().resolvedOptions().locale?.toLocaleLowerCase() ?? "";

  if (locale.startsWith("en")) {
    return "en";
  }

  if (locale.startsWith("de")) {
    return "de";
  }

  return FALLBACK_LANGUAGE;
};

const getSystemTheme = (): ThemeOption =>
  Appearance.getColorScheme() === "dark" ? "Dark" : "Light";

const normalizeStoredLanguage = (
  value?: LanguageOption | "DE" | "EN",
): LanguageOption | undefined => {
  if (!value) {
    return undefined;
  }

  if (value === "DE") {
    return "de";
  }

  if (value === "EN") {
    return "en";
  }

  return value;
};

const mapRemoteSettings = (settings: {
  language?: LanguageOption | "DE" | "EN";
  currency?: CurrencyOption;
  theme?: ThemeOption;
  weekStart?: WeekStartOption;
  notificationsEnabled?: boolean;
  accentColor?: AccentColor;
} | null): Partial<LocalFirstAppSettings> | null => {
  if (!settings) {
    return null;
  }

  const language = normalizeStoredLanguage(settings.language);

  return {
    language,
    currency: settings.currency,
    theme: settings.theme,
    weekStart: settings.weekStart,
    notificationsEnabled: settings.notificationsEnabled,
    accentColor: settings.accentColor,
  };
};

const getSafeSettings = (
  settings: LocalFirstAppSettings,
  hasPremiumAccents: boolean,
): LocalFirstAppSettings => ({
  ...settings,
  accentColor: getSafeAccentColor(settings.accentColor, hasPremiumAccents),
});

interface AppSettingsContextValue {
  language: LanguageOption;
  currency: CurrencyOption;
  theme: ThemeOption;
  weekStart: WeekStartOption;
  notifications: NotificationsOption;
  notificationsEnabled: boolean;
  accentColor: AccentColor;
  isHydrated: boolean;
  setLanguage: (value: LanguageOption) => void;
  setCurrency: (value: CurrencyOption) => void;
  setTheme: (value: ThemeOption) => void;
  setWeekStart: (value: WeekStartOption) => void;
  setNotifications: (value: NotificationsOption) => void;
  setAccentColor: (value: AccentColor) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export const AppSettingsProvider = ({ children }: PropsWithChildren) => {
  const { currentUser, authIsReady } = useAuth();
  const { hasPremiumAccents } = usePurchases();
  const defaultSettingsRef = useRef<LocalFirstAppSettings>({
    language: getSystemLanguage(),
    currency: "EUR",
    theme: getSystemTheme(),
    weekStart: "monday",
    notificationsEnabled: true,
    accentColor: FREE_ACCENT_COLOR,
  });
  const missingRemoteSyncStartedRef = useRef<Record<string, boolean>>({});
  const settingsRef = useRef<LocalFirstAppSettings>(defaultSettingsRef.current);
  const [settings, setSettings] = useState<LocalFirstAppSettings>(defaultSettingsRef.current);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    let isActive = true;

    hydrateLocalFirstSettings(defaultSettingsRef.current)
      .then((nextSettings) => {
        if (!isActive) {
          return;
        }

        setSettings(getSafeSettings(nextSettings, hasPremiumAccents));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setSettings(getSafeSettings(defaultSettingsRef.current, hasPremiumAccents));
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsHydrated(true);
      });

    return () => {
      isActive = false;
    };
  }, [hasPremiumAccents]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (canUseAccentColor(settings.accentColor, hasPremiumAccents)) {
      return;
    }

    void enqueueLocalFirstSettingChange(currentUser?.uid, "accentColor", FREE_ACCENT_COLOR)
      .then((nextSettings) => {
        setSettings(getSafeSettings(nextSettings, hasPremiumAccents));
        if (currentUser?.uid) {
          void retryPendingSettingsSync(currentUser.uid);
        }
      })
      .catch((error) => {
        logFirestoreError("Settings.enqueue.accentColor.fallback", error, {
          userId: currentUser?.uid ?? null,
          accentColor: FREE_ACCENT_COLOR,
        });
      });
  }, [currentUser?.uid, hasPremiumAccents, isHydrated, settings.accentColor]);

  useEffect(() => {
    if (!authIsReady || !isHydrated || !currentUser?.uid) {
      return;
    }

    let isActive = true;

    const unsubscribe = subscribeToUserSettings(
      currentUser.uid,
      (remoteSettings) => {
        if (!isActive) {
          return;
        }

        if (!remoteSettings) {
          if (missingRemoteSyncStartedRef.current[currentUser.uid]) {
            return;
          }

          missingRemoteSyncStartedRef.current[currentUser.uid] = true;

          void enqueueAllLocalFirstSettingsForSync(currentUser.uid, settingsRef.current)
            .then((nextSettings) => {
              if (!isActive) {
                return;
              }

              setSettings(getSafeSettings(nextSettings, hasPremiumAccents));
              void retryPendingSettingsSync(currentUser.uid);
            })
            .catch((error) => {
              logFirestoreError("Settings.enqueueAllLocalFirstSettingsForSync", error, {
                userId: currentUser.uid,
              });
            });
          return;
        }

        void mergeRemoteLocalFirstSettings(currentUser.uid, mapRemoteSettings(remoteSettings))
          .then((nextSettings) => {
            if (!isActive) {
              return;
            }

            setSettings(getSafeSettings(nextSettings, hasPremiumAccents));
          })
          .catch((error) => {
            logFirestoreError("Settings.mergeRemoteLocalFirstSettings", error, {
              userId: currentUser.uid,
            });
          });
      },
      (error) => {
        logFirestoreError("Settings.subscribeToUserSettings", error, {
          userId: currentUser.uid,
        });
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [authIsReady, currentUser?.uid, hasPremiumAccents, isHydrated]);

  const applySettingChange = <T extends keyof LocalFirstAppSettings>(
    key: T,
    value: LocalFirstAppSettings[T],
  ) => {
    const activeUserId = currentUser?.uid;
    const optimisticSettings = getSafeSettings(
      {
        ...settingsRef.current,
        [key]: value,
      },
      hasPremiumAccents,
    );

    setSettings(optimisticSettings);

    void enqueueLocalFirstSettingChange(currentUser?.uid, key, value)
      .then((nextSettings) => {
        setSettings(getSafeSettings(nextSettings, hasPremiumAccents));

        if (activeUserId) {
          void retryPendingSettingsSync(activeUserId);
        }
      })
      .catch((error) => {
        logFirestoreError(`Settings.enqueue.${String(key)}`, error, {
          userId: activeUserId ?? null,
          key,
          value,
        });
      },
    );
  };

  const setLanguage = (value: LanguageOption) => {
    applySettingChange("language", value);
  };

  const setCurrency = (value: CurrencyOption) => {
    applySettingChange("currency", value);
  };

  const setTheme = (value: ThemeOption) => {
    applySettingChange("theme", value);
  };

  const setWeekStart = (value: WeekStartOption) => {
    applySettingChange("weekStart", value);
  };

  const setNotifications = (value: NotificationsOption) => {
    applySettingChange("notificationsEnabled", value === "enabled");
  };

  const setAccentColor = (value: AccentColor) => {
    if (!canUseAccentColor(value, hasPremiumAccents)) {
      return;
    }

    applySettingChange("accentColor", value);
  };

  const value = useMemo(
    () => ({
      language: settings.language,
      currency: settings.currency,
      theme: settings.theme,
      weekStart: settings.weekStart,
      notifications: (settings.notificationsEnabled ? "enabled" : "disabled") as NotificationsOption,
      notificationsEnabled: settings.notificationsEnabled,
      accentColor: settings.accentColor,
      isHydrated,
      setLanguage,
      setCurrency,
      setTheme,
      setWeekStart,
      setNotifications,
      setAccentColor,
    }),
    [isHydrated, settings],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider.");
  }

  return context;
};
