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
  accentColor: AccentColor;
  isHydrated: boolean;
  setLanguage: (value: LanguageOption) => void;
  setCurrency: (value: CurrencyOption) => void;
  setTheme: (value: ThemeOption) => void;
  setAccentColor: (value: AccentColor) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export const AppSettingsProvider = ({ children }: PropsWithChildren) => {
  const { currentUser, authIsReady } = useAuth();
  const { hasSupportColors } = usePurchases();
  const [language, setLanguageState] = useState<LanguageOption>(() => getSystemLanguage());
  const [currency, setCurrencyState] = useState<CurrencyOption>("EUR");
  const [theme, setThemeState] = useState<ThemeOption>(() => getSystemTheme());
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

        if (parsedSettings.accentColor) {
          setAccentColorState(getSafeAccentColor(parsedSettings.accentColor, hasSupportColors));
        }
      } catch {
        // Keep defaults if local hydration fails.
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateLocalSettings();
  }, [hasSupportColors]);

  useEffect(() => {
    if (canUseAccentColor(accentColor, hasSupportColors)) {
      return;
    }

    setAccentColorState(FREE_ACCENT_COLOR);
  }, [accentColor, hasSupportColors]);

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

    const defaults = { language, currency, theme };

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
  }, [authIsReady, currentUser, isHydrated]);

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
        accentColor,
      }),
    ).catch(() => {
      // Ignore persistence errors and keep the in-memory app state usable.
    });
  }, [accentColor, currency, isHydrated, language, theme]);

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

  const setAccentColor = (value: AccentColor) => {
    if (!canUseAccentColor(value, hasSupportColors)) {
      return;
    }

    setAccentColorState(value);
  };

  const value = useMemo(
    () => ({
      language,
      currency,
      theme,
      accentColor,
      isHydrated,
      setLanguage,
      setCurrency,
      setTheme,
      setAccentColor,
    }),
    [accentColor, currency, isHydrated, language, theme],
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
