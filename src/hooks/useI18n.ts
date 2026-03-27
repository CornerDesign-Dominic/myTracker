import { useAppSettings } from "@/context/AppSettingsContext";
import { AppLanguage, TranslationKey, translations } from "@/i18n/translations";

const getNestedValue = (language: AppLanguage, key: TranslationKey) => {
  const path = key.split(".");
  let current: unknown = translations[language];

  for (const segment of path) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" ? current : undefined;
};

export const useI18n = () => {
  const { language } = useAppSettings();
  const locale = language;

  const t = (key: TranslationKey, variables?: Record<string, string | number>) => {
    const template =
      getNestedValue(locale, key) ??
      getNestedValue("de", key) ??
      getNestedValue("en", key) ??
      key;

    return Object.entries(variables ?? {}).reduce((result, [name, value]) => {
      return result.replaceAll(`{{${name}}}`, String(value));
    }, template);
  };

  return {
    language: locale,
    t,
  } as const;
};
