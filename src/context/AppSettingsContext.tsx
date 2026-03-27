import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "@/context/AuthContext";
import { AppLanguage } from "@/i18n/translations";
import {
  ensureSettingsDocument,
  subscribeToUserSettings,
  updateUserSettings,
} from "@/services/firestore/userFirestore";

type LanguageOption = AppLanguage;
type CurrencyOption = "EUR" | "Dollar";
type ThemeOption = "Dark" | "Light";

const STORAGE_KEY = "tracker.app-settings";

interface AppSettingsContextValue {
  language: LanguageOption;
  currency: CurrencyOption;
  theme: ThemeOption;
  isHydrated: boolean;
  setLanguage: (value: LanguageOption) => void;
  setCurrency: (value: CurrencyOption) => void;
  setTheme: (value: ThemeOption) => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export const AppSettingsProvider = ({ children }: PropsWithChildren) => {
  const { currentUser, authIsReady } = useAuth();
  const [language, setLanguageState] = useState<LanguageOption>("de");
  const [currency, setCurrencyState] = useState<CurrencyOption>("EUR");
  const [theme, setThemeState] = useState<ThemeOption>("Light");
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
        }>;

        if (parsedSettings.language) {
          setLanguageState(
            parsedSettings.language === "DE"
              ? "de"
              : parsedSettings.language === "EN"
                ? "en"
                : parsedSettings.language,
          );
        }

        if (parsedSettings.currency) {
          setCurrencyState(parsedSettings.currency);
        }

        if (parsedSettings.theme) {
          setThemeState(parsedSettings.theme);
        }
      } catch {
        // Keep defaults if local hydration fails.
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateLocalSettings();
  }, []);

  useEffect(() => {
    if (!authIsReady || !isHydrated || !currentUser) {
      return;
    }

    let isActive = true;

    const defaults = { language, currency, theme };

    const syncInitialSettings = async () => {
      await ensureSettingsDocument(currentUser.uid, defaults);
    };

    syncInitialSettings().catch(() => {
      // Keep current in-memory settings if Firestore bootstrap fails.
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
      () => {
        // Keep local settings usable if Firestore rules are not deployed yet.
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [authIsReady, currentUser, currency, isHydrated, language, theme]);

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
      }),
    ).catch(() => {
      // Ignore persistence errors and keep the in-memory app state usable.
    });
  }, [currency, isHydrated, language, theme]);

  const setLanguage = (value: LanguageOption) => {
    setLanguageState(value);
    if (currentUser) {
      updateUserSettings(currentUser.uid, { language: value }).catch(() => undefined);
    }
  };

  const setCurrency = (value: CurrencyOption) => {
    setCurrencyState(value);
    if (currentUser) {
      updateUserSettings(currentUser.uid, { currency: value }).catch(() => undefined);
    }
  };

  const setTheme = (value: ThemeOption) => {
    setThemeState(value);
    if (currentUser) {
      updateUserSettings(currentUser.uid, { theme: value }).catch(() => undefined);
    }
  };

  const value = useMemo(
    () => ({
      language,
      currency,
      theme,
      isHydrated,
      setLanguage,
      setCurrency,
      setTheme,
    }),
    [currency, isHydrated, language, theme],
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
