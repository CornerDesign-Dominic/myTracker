export type CategoryLanguage = "de" | "en";

type CategoryDefinition = {
  key: string;
  de: string;
  en: string;
  aliases?: string[];
};

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { key: "streaming", de: "Streaming", en: "Streaming" },
  { key: "entertainment", de: "Unterhaltung", en: "Entertainment" },
  { key: "music", de: "Musik", en: "Music" },
  {
    key: "productivity",
    de: "Produktivit\u00E4t",
    en: "Productivity",
    aliases: ["produktivitat", "Produktivit\u00C3\u00A4t"],
  },
  { key: "cloud", de: "Cloud", en: "Cloud" },
  { key: "fitness", de: "Fitness", en: "Fitness" },
  { key: "gaming", de: "Gaming", en: "Gaming" },
  { key: "software", de: "Software", en: "Software" },
  { key: "shopping", de: "Shopping", en: "Shopping" },
  { key: "storage", de: "Speicher", en: "Storage" },
];

const normalizeCategory = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const findCategoryDefinition = (value: string) => {
  const normalized = normalizeCategory(value);

  if (!normalized) {
    return null;
  }

  return (
    CATEGORY_DEFINITIONS.find((definition) =>
      [definition.de, definition.en, ...(definition.aliases ?? [])].some(
        (candidate) => normalizeCategory(candidate) === normalized,
      ),
    ) ?? null
  );
};

export const localizeCategory = (value: string, language: CategoryLanguage) => {
  const definition = findCategoryDefinition(value);
  return definition ? definition[language] : value;
};

export const getCategoryGroupKey = (value: string) => {
  const definition = findCategoryDefinition(value);
  return definition?.key ?? normalizeCategory(value);
};
