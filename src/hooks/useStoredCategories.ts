import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CategoryLanguage, localizeCategory } from "@/utils/categories";

const STORAGE_KEY = "tracker.subscription-categories";

const normalizeCategory = (value: string) => value.trim().toLocaleLowerCase();

const dedupeCategories = (categories: readonly string[]) => {
  const seen = new Set<string>();

  return categories.filter((category) => {
    const normalized = normalizeCategory(category);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
};

const localizeCategories = (categories: readonly string[], language: CategoryLanguage) =>
  dedupeCategories(categories.map((category) => localizeCategory(category, language)));

export const useStoredCategories = (
  defaultCategories: readonly string[],
  language: CategoryLanguage,
) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateCategories = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedValue) {
          const seededCategories = localizeCategories(defaultCategories, language);
          setCategories(seededCategories);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seededCategories));
          return;
        }

        const parsed = JSON.parse(storedValue) as string[];
        const nextCategories = localizeCategories(
          [...defaultCategories, ...(parsed ?? [])],
          language,
        );
        setCategories(nextCategories);
      } catch {
        setCategories(localizeCategories(defaultCategories, language));
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateCategories();
  }, [defaultCategories, language]);

  const persistCategories = useCallback(async (nextCategories: string[]) => {
    setCategories(nextCategories);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextCategories));
    } catch {
      // Keep in-memory categories even if persistence fails.
    }
  }, []);

  const addCategory = useCallback(
    async (value: string) => {
      const trimmed = localizeCategory(value.trim(), language);
      if (!trimmed) {
        return;
      }

      const alreadyExists = categories.some(
        (category) => normalizeCategory(category) === normalizeCategory(trimmed),
      );

      if (alreadyExists) {
        return;
      }

      await persistCategories([...categories, trimmed]);
    },
    [categories, language, persistCategories],
  );

  const getSuggestions = useCallback(
    (query: string) => {
      const normalizedQuery = normalizeCategory(query);

      if (!normalizedQuery) {
        return categories.slice(0, 8);
      }

      return categories
        .filter((category) => normalizeCategory(category).startsWith(normalizedQuery))
        .slice(0, 6);
    },
    [categories],
  );

  return useMemo(
    () => ({
      categories,
      isHydrated,
      addCategory,
      getSuggestions,
    }),
    [addCategory, categories, getSuggestions, isHydrated],
  );
};
