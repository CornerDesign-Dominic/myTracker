import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

type SubscriptionTemplate = {
  name: string;
  category: string;
};

const STORAGE_KEY = "tracker.subscription-templates";

const normalizeValue = (value: string) => value.trim().toLocaleLowerCase();

const dedupeTemplates = (templates: readonly SubscriptionTemplate[]) => {
  const seen = new Set<string>();

  return templates.filter((template) => {
    const normalized = normalizeValue(template.name);

    if (!normalized || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
};

export const useStoredSubscriptionTemplates = (
  defaultTemplates: readonly SubscriptionTemplate[],
) => {
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const hydrateTemplates = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!storedValue) {
          const seededTemplates = dedupeTemplates(defaultTemplates);
          setTemplates(seededTemplates);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seededTemplates));
          return;
        }

        const parsed = JSON.parse(storedValue) as SubscriptionTemplate[];
        const nextTemplates = dedupeTemplates([...(parsed ?? []), ...defaultTemplates]);
        setTemplates(nextTemplates);
      } catch {
        setTemplates(dedupeTemplates(defaultTemplates));
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateTemplates();
  }, [defaultTemplates]);

  const persistTemplates = useCallback(async (nextTemplates: SubscriptionTemplate[]) => {
    setTemplates(nextTemplates);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTemplates));
    } catch {
      // Keep in-memory templates even if persistence fails.
    }
  }, []);

  const addTemplate = useCallback(
    async (template: SubscriptionTemplate) => {
      const trimmedName = template.name.trim();
      if (!trimmedName) {
        return;
      }

      const alreadyExists = templates.some(
        (entry) => normalizeValue(entry.name) === normalizeValue(trimmedName),
      );

      if (alreadyExists) {
        return;
      }

      await persistTemplates([
        ...templates,
        {
          name: trimmedName,
          category: template.category.trim(),
        },
      ]);
    },
    [persistTemplates, templates],
  );

  const getSuggestions = useCallback(
    (query: string) => {
      const normalizedQuery = normalizeValue(query);

      if (!normalizedQuery) {
        return templates.slice(0, 8);
      }

      return templates
        .filter((template) => normalizeValue(template.name).startsWith(normalizedQuery))
        .slice(0, 6);
    },
    [templates],
  );

  return useMemo(
    () => ({
      templates,
      isHydrated,
      addTemplate,
      getSuggestions,
    }),
    [addTemplate, getSuggestions, isHydrated, templates],
  );
};
