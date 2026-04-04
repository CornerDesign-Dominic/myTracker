export type BrandVisualKey =
  | "adobeCreativeCloud"
  | "amazonMusic"
  | "amazonPrime"
  | "appleMusic"
  | "appleFitnessPlus"
  | "appleOne"
  | "appleTvPlus"
  | "audible"
  | "blinkist"
  | "canva"
  | "chatgpt"
  | "claude"
  | "crunchyroll"
  | "cursor"
  | "dazn"
  | "deezer"
  | "disneyPlus"
  | "dropbox"
  | "duolingo"
  | "ebayPlus"
  | "evernote"
  | "expressvpn"
  | "figma"
  | "freeletics"
  | "gemini"
  | "googleDrive"
  | "github"
  | "googleOne"
  | "hulu"
  | "icloud"
  | "linkedin"
  | "max"
  | "masterclass"
  | "microsoft365"
  | "midjourney"
  | "n26"
  | "netflix"
  | "nintendoSwitchOnline"
  | "nordvpn"
  | "notion"
  | "oneDrive"
  | "ottoUp"
  | "paramountPlus"
  | "patreon"
  | "paypal"
  | "peacock"
  | "perplexity"
  | "playstationPlus"
  | "proton"
  | "revolut"
  | "skillshare"
  | "sky"
  | "slack"
  | "soundcloud"
  | "spotify"
  | "tiktok"
  | "twitch"
  | "udemy"
  | "urbanSportsClub"
  | "xboxGamePass"
  | "youtube"
  | "zalandoPlus"
  | "zoom";

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

  const isShortSingleToken =
    !normalizedPattern.normalized.includes(" ") && normalizedPattern.compact.length <= 4;

  if (isShortSingleToken) {
    return (
      value.normalized === normalizedPattern.normalized ||
      value.normalized.startsWith(`${normalizedPattern.normalized} `) ||
      value.normalized.endsWith(` ${normalizedPattern.normalized}`) ||
      value.normalized.includes(` ${normalizedPattern.normalized} `)
    );
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
    key: "appleOne",
    aliases: ["apple one", "appleone"],
  },
  {
    key: "appleFitnessPlus",
    aliases: ["apple fitness plus", "apple fitness+", "applefitnessplus"],
  },
  {
    key: "appleTvPlus",
    aliases: ["apple tv plus", "apple tv+", "appletvplus", "apple tv"],
  },
  {
    key: "disneyPlus",
    aliases: ["disney plus", "disney+"],
  },
  {
    key: "crunchyroll",
    aliases: ["crunchyroll", "crunchy roll"],
  },
  {
    key: "dazn",
    aliases: ["dazn"],
  },
  {
    key: "sky",
    aliases: ["wow sky", "wow by sky", "wow tv", "wow", "sky ticket", "sky"],
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
    key: "deezer",
    aliases: ["deezer", "deezer premium", "deezer family"],
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
    key: "soundcloud",
    aliases: ["soundcloud", "sound cloud", "soundcloud go", "sound cloud go"],
  },
  {
    key: "icloud",
    aliases: ["icloud", "i cloud", "icloud plus", "icloud+"],
  },
  {
    key: "googleDrive",
    aliases: ["google drive", "googledrive", "g drive", "gdrive"],
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
    key: "oneDrive",
    aliases: ["onedrive", "one drive", "microsoft onedrive"],
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
    key: "evernote",
    aliases: ["evernote", "ever note"],
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
    key: "blinkist",
    aliases: ["blinkist"],
  },
  {
    key: "expressvpn",
    aliases: ["expressvpn", "express vpn"],
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
  {
    key: "linkedin",
    aliases: ["linkedin", "linked in", "linkedin premium", "linkedin learning"],
  },
  {
    key: "paypal",
    aliases: ["paypal", "pay pal"],
  },
  {
    key: "revolut",
    aliases: ["revolut"],
  },
  {
    key: "n26",
    aliases: ["n26"],
  },
  {
    key: "ebayPlus",
    aliases: ["ebay plus", "ebay+", "ebayplus"],
  },
  {
    key: "ottoUp",
    aliases: ["otto up", "ottoup"],
  },
  {
    key: "zalandoPlus",
    aliases: ["zalando plus", "zalando+", "zalandoplus"],
  },
  {
    key: "slack",
    aliases: ["slack"],
  },
  {
    key: "tiktok",
    aliases: ["tiktok", "tik tok", "tiktok live", "tiktok shop"],
  },
  {
    key: "zoom",
    aliases: ["zoom", "zoom pro", "zoom workplace"],
  },
  {
    key: "gemini",
    aliases: ["google gemini", "gemini advanced", "gemini ai", "gemini"],
  },
  {
    key: "cursor",
    aliases: ["cursor ai", "cursor editor", "cursor.sh", "cursor pro", "cursor"],
  },
  {
    key: "freeletics",
    aliases: ["freeletics"],
  },
  {
    key: "urbanSportsClub",
    aliases: [
      "urban sports club",
      "urbansportsclub",
      "usc fitness",
      "usc membership",
    ],
  },
  {
    key: "udemy",
    aliases: ["udemy"],
  },
  {
    key: "masterclass",
    aliases: ["masterclass", "master class"],
  },
  {
    key: "skillshare",
    aliases: ["skillshare", "skill share"],
  },
  {
    key: "nintendoSwitchOnline",
    aliases: [
      "nintendo switch online",
      "nintendoswitchonline",
      "switch online",
      "nso",
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
