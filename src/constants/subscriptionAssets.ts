export type BrandVisualKey =
  | "adobeCreativeCloud"
  | "amazonMusic"
  | "amazonPrime"
  | "appleMusic"
  | "audible"
  | "canva"
  | "chatgpt"
  | "claude"
  | "disneyPlus"
  | "dropbox"
  | "duolingo"
  | "figma"
  | "github"
  | "googleOne"
  | "hulu"
  | "icloud"
  | "max"
  | "microsoft365"
  | "midjourney"
  | "netflix"
  | "nordvpn"
  | "notion"
  | "paramountPlus"
  | "patreon"
  | "peacock"
  | "perplexity"
  | "playstationPlus"
  | "proton"
  | "spotify"
  | "twitch"
  | "xboxGamePass"
  | "youtube";

export type CategoryVisualKey =
  | "cloud"
  | "default"
  | "education"
  | "entertainment"
  | "finance"
  | "fitness"
  | "gaming"
  | "music"
  | "productivity"
  | "shopping"
  | "software"
  | "video";

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

type BrandMatcher = {
  key: BrandVisualKey;
  aliases: string[];
};

type CategoryMatcher = {
  key: CategoryVisualKey;
  iconName: string;
  patterns: string[];
};

type NormalizedValue = {
  compact: string;
  normalized: string;
};

const normalizeValue = (value: string): NormalizedValue => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    normalized,
    compact: normalized.replace(/\s+/g, ""),
  };
};

const matchesPattern = (value: NormalizedValue, pattern: string) => {
  const normalizedPattern = normalizeValue(pattern);

  if (!normalizedPattern.normalized) {
    return false;
  }

  return (
    value.normalized.includes(normalizedPattern.normalized) ||
    value.compact.includes(normalizedPattern.compact)
  );
};

const brandMatchers: BrandMatcher[] = [
  {
    key: "netflix",
    aliases: ["netflix"],
  },
  {
    key: "amazonPrime",
    aliases: [
      "amazon prime",
      "amazon prime video",
      "prime video",
      "prime membership",
      "prime abo",
    ],
  },
  {
    key: "disneyPlus",
    aliases: ["disney plus", "disney+"],
  },
  {
    key: "hulu",
    aliases: ["hulu"],
  },
  {
    key: "max",
    aliases: ["hbo max", "hbomax", "max streaming", "max abo", "max subscription"],
  },
  {
    key: "paramountPlus",
    aliases: ["paramount plus", "paramount+"],
  },
  {
    key: "peacock",
    aliases: ["peacock", "peacock premium"],
  },
  {
    key: "youtube",
    aliases: [
      "youtube",
      "youtube premium",
      "youtube music",
      "youtube family",
      "youtube membership",
      "yt premium",
      "yt music",
    ],
  },
  {
    key: "spotify",
    aliases: ["spotify", "spotify premium", "spotify family"],
  },
  {
    key: "amazonMusic",
    aliases: ["amazon music", "amazonmusic", "prime music"],
  },
  {
    key: "appleMusic",
    aliases: ["apple music", "applemusic"],
  },
  {
    key: "audible",
    aliases: ["audible"],
  },
  {
    key: "icloud",
    aliases: ["icloud", "i cloud", "icloud plus", "icloud+"],
  },
  {
    key: "dropbox",
    aliases: ["dropbox", "drop box"],
  },
  {
    key: "googleOne",
    aliases: ["google one", "googleone"],
  },
  {
    key: "microsoft365",
    aliases: [
      "microsoft 365",
      "microsoft365",
      "office 365",
      "office365",
      "m365",
      "ms 365",
    ],
  },
  {
    key: "notion",
    aliases: ["notion", "notion ai"],
  },
  {
    key: "github",
    aliases: [
      "github",
      "git hub",
      "github copilot",
      "git hub copilot",
    ],
  },
  {
    key: "figma",
    aliases: ["figma"],
  },
  {
    key: "adobeCreativeCloud",
    aliases: [
      "adobe creative cloud",
      "creative cloud",
      "adobe cc",
      "adobe",
    ],
  },
  {
    key: "canva",
    aliases: ["canva", "canva pro"],
  },
  {
    key: "chatgpt",
    aliases: ["chatgpt", "chat gpt", "chatgpt plus", "openai", "open ai"],
  },
  {
    key: "claude",
    aliases: ["claude", "claude pro"],
  },
  {
    key: "midjourney",
    aliases: ["midjourney", "mid journey"],
  },
  {
    key: "perplexity",
    aliases: ["perplexity", "perplexity pro"],
  },
  {
    key: "nordvpn",
    aliases: ["nordvpn", "nord vpn"],
  },
  {
    key: "proton",
    aliases: [
      "proton",
      "proton vpn",
      "protonvpn",
      "proton mail",
      "protonmail",
      "proton unlimited",
    ],
  },
  {
    key: "twitch",
    aliases: ["twitch", "twitch turbo", "twitch sub", "twitch subscription"],
  },
  {
    key: "patreon",
    aliases: ["patreon"],
  },
  {
    key: "duolingo",
    aliases: ["duolingo", "duolingo plus", "duolingo max"],
  },
  {
    key: "playstationPlus",
    aliases: [
      "playstation plus",
      "playstationplus",
      "ps plus",
      "ps+",
      "psplus",
    ],
  },
  {
    key: "xboxGamePass",
    aliases: [
      "xbox game pass",
      "xboxgamepass",
      "game pass",
      "gamepass",
      "pc game pass",
      "xbox live gold",
    ],
  },
];

const categoryMatchers: CategoryMatcher[] = [
  {
    key: "video",
    patterns: ["streaming", "video", "film", "tv", "serien", "movies"],
    iconName: "film-outline",
  },
  {
    key: "entertainment",
    patterns: ["entertainment", "unterhaltung"],
    iconName: "sparkles-outline",
  },
  {
    key: "music",
    patterns: ["music", "musik", "audio", "podcast", "hörbuch", "audiobook"],
    iconName: "musical-notes-outline",
  },
  {
    key: "cloud",
    patterns: ["cloud", "storage", "speicher", "backup", "drive"],
    iconName: "cloud-outline",
  },
  {
    key: "productivity",
    patterns: ["productivity", "produktivitat", "arbeit", "work", "office"],
    iconName: "grid-outline",
  },
  {
    key: "software",
    patterns: ["software", "app", "tools", "tool", "developer", "development"],
    iconName: "laptop-outline",
  },
  {
    key: "gaming",
    patterns: ["gaming", "games", "spiele", "konsole", "console"],
    iconName: "game-controller-outline",
  },
  {
    key: "education",
    patterns: ["education", "bildung", "learning", "lernen", "language"],
    iconName: "school-outline",
  },
  {
    key: "fitness",
    patterns: ["fitness", "health", "gesundheit", "sport", "wellness", "meditation"],
    iconName: "fitness-outline",
  },
  {
    key: "finance",
    patterns: ["finance", "finanzen", "bank", "banking", "wallet"],
    iconName: "card-outline",
  },
  {
    key: "shopping",
    patterns: ["shopping", "shop", "retail", "ecommerce", "delivery"],
    iconName: "bag-handle-outline",
  },
];

export const resolveSubscriptionVisual = (
  subscriptionName: string,
  subscriptionCategory?: string,
): SubscriptionVisualMatch => {
  const normalizedName = normalizeValue(subscriptionName);
  const normalizedCategory = normalizeValue(subscriptionCategory ?? "");

  const brandMatch = brandMatchers.find((brand) =>
    brand.aliases.some((alias) => matchesPattern(normalizedName, alias)),
  );

  if (brandMatch) {
    return {
      type: "brand",
      key: brandMatch.key,
    };
  }

  const categoryMatch = categoryMatchers.find((category) =>
    category.patterns.some((pattern) => matchesPattern(normalizedCategory, pattern)),
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
