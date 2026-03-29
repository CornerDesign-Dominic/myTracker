export type BrandVisualKey =
  | "netflix"
  | "spotify"
  | "amazonPrime"
  | "disneyPlus"
  | "youtubePremium"
  | "appleMusic"
  | "icloud"
  | "adobeCreativeCloud"
  | "dropbox"
  | "notion"
  | "canva"
  | "chatgpt"
  | "microsoft365"
  | "googleOne"
  | "playstationPlus"
  | "xboxGamePass";

export type CategoryVisualKey =
  | "entertainment"
  | "software"
  | "fitness"
  | "music"
  | "video"
  | "productivity"
  | "cloud"
  | "finance"
  | "shopping"
  | "education"
  | "gaming"
  | "default";

export type SubscriptionVisualMatch =
  | {
      type: "brand";
      key: BrandVisualKey;
    }
  | {
      type: "category";
      key: CategoryVisualKey;
      iconName: string;
    }
  | {
      type: "default";
      key: "default";
      iconName: string;
    };

const normalizeValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ");

const brandMatchers: Array<{
  key: BrandVisualKey;
  patterns: string[];
}> = [
  {
    key: "youtubePremium",
    patterns: ["youtube premium", "youtubepremium"],
  },
  {
    key: "appleMusic",
    patterns: ["apple music", "applemusic"],
  },
  {
    key: "adobeCreativeCloud",
    patterns: ["adobe creative cloud", "creative cloud", "adobe cc"],
  },
  {
    key: "amazonPrime",
    patterns: ["amazon prime video", "prime video", "amazon prime", "prime membership"],
  },
  {
    key: "disneyPlus",
    patterns: ["disney+", "disney plus", "disneyplus"],
  },
  {
    key: "googleOne",
    patterns: ["google one", "googleone"],
  },
  {
    key: "microsoft365",
    patterns: ["microsoft 365", "office 365", "m365"],
  },
  {
    key: "playstationPlus",
    patterns: ["playstation plus", "ps plus", "ps+", "playstationplus"],
  },
  {
    key: "xboxGamePass",
    patterns: ["xbox game pass", "game pass", "xboxgamepass"],
  },
  {
    key: "chatgpt",
    patterns: ["chatgpt", "chat gpt"],
  },
  {
    key: "netflix",
    patterns: ["netflix"],
  },
  {
    key: "spotify",
    patterns: ["spotify"],
  },
  {
    key: "icloud",
    patterns: ["icloud", "i cloud"],
  },
  {
    key: "dropbox",
    patterns: ["dropbox"],
  },
  {
    key: "notion",
    patterns: ["notion"],
  },
  {
    key: "canva",
    patterns: ["canva"],
  },
];

const categoryMatchers: Array<{
  key: CategoryVisualKey;
  patterns: string[];
  iconName: string;
}> = [
  { key: "entertainment", patterns: ["entertainment", "unterhaltung"], iconName: "sparkles-outline" },
  { key: "software", patterns: ["software"], iconName: "laptop-outline" },
  { key: "fitness", patterns: ["fitness", "health", "sport"], iconName: "fitness-outline" },
  { key: "music", patterns: ["music", "musik", "audio"], iconName: "musical-notes-outline" },
  { key: "video", patterns: ["video", "streaming"], iconName: "film-outline" },
  { key: "productivity", patterns: ["productivity", "produktivitat", "work"], iconName: "grid-outline" },
  { key: "cloud", patterns: ["cloud", "storage", "speicher"], iconName: "cloud-outline" },
  { key: "finance", patterns: ["finance", "finanzen", "bank"], iconName: "card-outline" },
  { key: "shopping", patterns: ["shopping", "shop"], iconName: "bag-handle-outline" },
  { key: "education", patterns: ["education", "bildung", "learning"], iconName: "school-outline" },
  { key: "gaming", patterns: ["gaming", "games", "spiele"], iconName: "game-controller-outline" },
];

export const resolveSubscriptionVisual = (
  subscriptionName: string,
  subscriptionCategory?: string,
): SubscriptionVisualMatch => {
  const normalizedName = normalizeValue(subscriptionName);
  const normalizedCategory = normalizeValue(subscriptionCategory ?? "");

  const brandMatch = brandMatchers.find((brand) =>
    brand.patterns.some((pattern) => normalizedName.includes(pattern)),
  );

  if (brandMatch) {
    return {
      type: "brand",
      key: brandMatch.key,
    };
  }

  const categoryMatch = categoryMatchers.find((category) =>
    category.patterns.some((pattern) => normalizedCategory.includes(pattern)),
  );

  if (categoryMatch) {
    return {
      type: "category",
      key: categoryMatch.key,
      iconName: categoryMatch.iconName,
    };
  }

  return {
    type: "default",
    key: "default",
    iconName: "apps-outline",
  };
};
