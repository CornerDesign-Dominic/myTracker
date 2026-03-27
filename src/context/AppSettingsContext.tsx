import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AppLanguage } from "@/i18n/translations";

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
  const [language, setLanguage] = useState<LanguageOption>("de");
  const [currency, setCurrency] = useState<CurrencyOption>("EUR");
  const [theme, setTheme] = useState<ThemeOption>("Light");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedSettings) {
          setIsHydrated(true);
          return;
        }

        const parsedSettings = JSON.parse(storedSettings) as Partial<{
          language: LanguageOption | "DE" | "EN";
          currency: CurrencyOption;
          theme: ThemeOption;
        }>;

        if (parsedSettings.language) {
          setLanguage(
            parsedSettings.language === "DE"
              ? "de"
              : parsedSettings.language === "EN"
                ? "en"
                : parsedSettings.language,
          );
        }

        if (parsedSettings.currency) {
          setCurrency(parsedSettings.currency);
        }

        if (parsedSettings.theme) {
          setTheme(parsedSettings.theme);
        }
      } catch {
        // Keep defaults if reading persisted settings fails.
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateSettings();
  }, []);

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

  return (
    <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider.");
  }

  return context;
};
