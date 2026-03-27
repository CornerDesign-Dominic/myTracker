import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

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

export const useStoredCategories = (defaultCategories: readonly string[]) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateCategories = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedValue) {
          const seededCategories = dedupeCategories(defaultCategories);
          setCategories(seededCategories);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seededCategories));
          return;
        }

        const parsed = JSON.parse(storedValue) as string[];
        const nextCategories = dedupeCategories([...defaultCategories, ...(parsed ?? [])]);
        setCategories(nextCategories);
      } catch {
        setCategories(dedupeCategories(defaultCategories));
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateCategories();
  }, [defaultCategories]);

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
      const trimmed = value.trim();
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
    [categories, persistCategories],
  );

  const getSuggestions = useCallback(
    (query: string) => {
      const normalizedQuery = normalizeCategory(query);

      if (!normalizedQuery) {
        return categories.slice(0, 6);
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
