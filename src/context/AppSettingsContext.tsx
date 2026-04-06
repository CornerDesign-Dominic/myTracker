import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { usePurchases } from "@/context/PurchaseContext";
import { AppLanguage } from "@/i18n/translations";
import {
  ensureSettingsDocument,
  subscribeToUserSettings,
  updateUserSettings,
} from "@/services/firestore/userFirestore";
import { FREE_ACCENT_COLOR } from "@/services/purchases/constants";
import { canUseAccentColor, getSafeAccentColor } from "@/services/purchases/entitlements";
import { AccentColor } from "@/theme";
import { logFirestoreError } from "@/utils/firestoreDebug";

type LanguageOption = AppLanguage;
type CurrencyOption = "EUR" | "Dollar";
type ThemeOption = "Dark" | "Light";
type WeekStartOption = "monday" | "sunday";
type NotificationsOption = "enabled" | "disabled";

const STORAGE_KEY = "tracker.app-settings";
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
  const [language, setLanguageState] = useState<LanguageOption>(() => getSystemLanguage());
  const [currency, setCurrencyState] = useState<CurrencyOption>("EUR");
  const [theme, setThemeState] = useState<ThemeOption>(() => getSystemTheme());
  const [weekStart, setWeekStartState] = useState<WeekStartOption>("monday");
  const [notifications, setNotificationsState] = useState<NotificationsOption>("enabled");
  const [accentColor, setAccentColorState] = useState<AccentColor>(FREE_ACCENT_COLOR);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateLocalSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedSettings) {
          return;
        }

        const parsedSettings = JSON.parse(storedSettings) as Partial<{
          language: LanguageOption | "DE" | "EN";
          currency: CurrencyOption;
          theme: ThemeOption;
          weekStart: WeekStartOption;
          notificationsEnabled: boolean;
          accentColor: AccentColor;
        }>;

        const storedLanguage = normalizeStoredLanguage(parsedSettings.language);

        if (storedLanguage) {
          setLanguageState(storedLanguage);
        }

        if (parsedSettings.currency) {
          setCurrencyState(parsedSettings.currency);
        }

        if (parsedSettings.theme) {
          setThemeState(parsedSettings.theme);
        }

        if (parsedSettings.weekStart) {
          setWeekStartState(parsedSettings.weekStart);
        }

        if (typeof parsedSettings.notificationsEnabled === "boolean") {
          setNotificationsState(parsedSettings.notificationsEnabled ? "enabled" : "disabled");
        }

        if (parsedSettings.accentColor) {
          setAccentColorState(getSafeAccentColor(parsedSettings.accentColor, hasPremiumAccents));
        }
      } catch {
        // Keep defaults if local hydration fails.
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateLocalSettings();
  }, [hasPremiumAccents]);

  useEffect(() => {
    if (canUseAccentColor(accentColor, hasPremiumAccents)) {
      return;
    }

    setAccentColorState(FREE_ACCENT_COLOR);
  }, [accentColor, hasPremiumAccents]);

  useEffect(() => {
    if (!authIsReady || !isHydrated || !currentUser) {
      return;
    }

    console.log("[Settings] currentUser:available", {
      uid: currentUser.uid,
      isAnonymous: currentUser.isAnonymous,
      email: currentUser.email,
    });

    let isActive = true;

    const defaults = {
      language,
      currency,
      theme,
      weekStart,
      notificationsEnabled: notifications === "enabled",
    };

    const syncInitialSettings = async () => {
      console.log("[Settings] ensureSettingsDocument:start", {
        userId: currentUser.uid,
        settings: defaults,
      });
      await ensureSettingsDocument(currentUser.uid, defaults);
      console.log("[Settings] ensureSettingsDocument:success", {
        userId: currentUser.uid,
        settings: defaults,
      });
    };

    syncInitialSettings().catch((error) => {
      logFirestoreError("Settings.ensureSettingsDocument", error, {
        userId: currentUser.uid,
        settings: defaults,
      });
    });

    const unsubscribe = subscribeToUserSettings(
      currentUser.uid,
      (settings) => {
        if (!isActive || !settings) {
          return;
        }

        if (settings.language) {
          setLanguageState(settings.language);
        }

        if (settings.currency) {
          setCurrencyState(settings.currency);
        }

        if (settings.theme) {
          setThemeState(settings.theme);
        }

        if (settings.weekStart) {
          setWeekStartState(settings.weekStart);
        }

        if (typeof settings.notificationsEnabled === "boolean") {
          setNotificationsState(settings.notificationsEnabled ? "enabled" : "disabled");
        }
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
  }, [authIsReady, currentUser, currency, isHydrated, language, notifications, theme, weekStart]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        language,
        currency,
        theme,
        weekStart,
        notificationsEnabled: notifications === "enabled",
        accentColor,
      }),
    ).catch(() => {
      // Ignore persistence errors and keep the in-memory app state usable.
    });
  }, [accentColor, currency, isHydrated, language, notifications, theme, weekStart]);

  const setLanguage = (value: LanguageOption) => {
    setLanguageState(value);
    if (currentUser) {
      updateUserSettings(currentUser.uid, { language: value }).catch((error) => {
        logFirestoreError("Settings.updateUserSettings.language", error, {
          userId: currentUser.uid,
          language: value,
        });
      });
    }
  };

  const setCurrency = (value: CurrencyOption) => {
    setCurrencyState(value);
    if (currentUser) {
      updateUserSettings(currentUser.uid, { currency: value }).catch((error) => {
        logFirestoreError("Settings.updateUserSettings.currency", error, {
          userId: currentUser.uid,
          currency: value,
        });
      });
    }
  };

  const setTheme = (value: ThemeOption) => {
    setThemeState(value);
    if (currentUser) {
      updateUserSettings(currentUser.uid, { theme: value }).catch((error) => {
        logFirestoreError("Settings.updateUserSettings.theme", error, {
          userId: currentUser.uid,
          theme: value,
        });
      });
    }
  };

  const setWeekStart = (value: WeekStartOption) => {
    setWeekStartState(value);
    if (currentUser) {
      updateUserSettings(currentUser.uid, { weekStart: value }).catch((error) => {
        logFirestoreError("Settings.updateUserSettings.weekStart", error, {
          userId: currentUser.uid,
          weekStart: value,
        });
      });
    }
  };

  const setNotifications = (value: NotificationsOption) => {
    setNotificationsState(value);
    if (currentUser) {
      updateUserSettings(currentUser.uid, { notificationsEnabled: value === "enabled" }).catch((error) => {
        logFirestoreError("Settings.updateUserSettings.notificationsEnabled", error, {
          userId: currentUser.uid,
          notificationsEnabled: value === "enabled",
        });
      });
    }
  };

  const setAccentColor = (value: AccentColor) => {
    if (!canUseAccentColor(value, hasPremiumAccents)) {
      return;
    }

    setAccentColorState(value);
  };

  const value = useMemo(
    () => ({
      language,
      currency,
      theme,
      weekStart,
      notifications,
      notificationsEnabled: notifications === "enabled",
      accentColor,
      isHydrated,
      setLanguage,
      setCurrency,
      setTheme,
      setWeekStart,
      setNotifications,
      setAccentColor,
    }),
    [accentColor, currency, isHydrated, language, notifications, theme, weekStart],
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
