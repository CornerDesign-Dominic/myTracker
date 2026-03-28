export type BrandVisualKey =
  | "netflix"
  | "spotify"
  | "amazon"
  | "apple"
  | "adobe"
  | "disney"
  | "youtube"
  | "dropbox"
  | "notion"
  | "canva";

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
  | "default";

export type SubscriptionVisualMatch =
  | {
      type: "brand";
      key: BrandVisualKey;
      mode: "icon" | "label";
      iconName?: string;
      label?: string;
      tintColor: string;
      backgroundColor: string;
      borderColor: string;
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
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ");

const brandMatchers: Array<{
  key: BrandVisualKey;
  patterns: string[];
  mode: "icon" | "label";
  iconName?: string;
  label?: string;
  tintColor: string;
  backgroundColor: string;
  borderColor: string;
}> = [
  {
    key: "netflix",
    patterns: ["netflix"],
    mode: "label",
    label: "N",
    tintColor: "#E50914",
    backgroundColor: "rgba(229, 9, 20, 0.10)",
    borderColor: "rgba(229, 9, 20, 0.18)",
  },
  {
    key: "spotify",
    patterns: ["spotify"],
    mode: "label",
    label: "S",
    tintColor: "#1DB954",
    backgroundColor: "rgba(29, 185, 84, 0.10)",
    borderColor: "rgba(29, 185, 84, 0.18)",
  },
  {
    key: "amazon",
    patterns: ["amazon", "prime video", "prime"],
    mode: "icon",
    iconName: "logo-amazon",
    tintColor: "#111827",
    backgroundColor: "rgba(17, 24, 39, 0.06)",
    borderColor: "rgba(17, 24, 39, 0.12)",
  },
  {
    key: "apple",
    patterns: ["apple", "icloud", "apple one", "apple music", "apple tv"],
    mode: "icon",
    iconName: "logo-apple",
    tintColor: "#111827",
    backgroundColor: "rgba(17, 24, 39, 0.06)",
    borderColor: "rgba(17, 24, 39, 0.12)",
  },
  {
    key: "adobe",
    patterns: ["adobe", "creative cloud"],
    mode: "label",
    label: "A",
    tintColor: "#FA0F00",
    backgroundColor: "rgba(250, 15, 0, 0.10)",
    borderColor: "rgba(250, 15, 0, 0.18)",
  },
  {
    key: "disney",
    patterns: ["disney+", "disney plus", "disney"],
    mode: "label",
    label: "D+",
    tintColor: "#113CCF",
    backgroundColor: "rgba(17, 60, 207, 0.10)",
    borderColor: "rgba(17, 60, 207, 0.18)",
  },
  {
    key: "youtube",
    patterns: ["youtube", "youtube premium"],
    mode: "icon",
    iconName: "logo-youtube",
    tintColor: "#FF0033",
    backgroundColor: "rgba(255, 0, 51, 0.10)",
    borderColor: "rgba(255, 0, 51, 0.18)",
  },
  {
    key: "dropbox",
    patterns: ["dropbox"],
    mode: "icon",
    iconName: "logo-dropbox",
    tintColor: "#0061FF",
    backgroundColor: "rgba(0, 97, 255, 0.10)",
    borderColor: "rgba(0, 97, 255, 0.18)",
  },
  {
    key: "notion",
    patterns: ["notion"],
    mode: "label",
    label: "N",
    tintColor: "#111111",
    backgroundColor: "rgba(17, 17, 17, 0.06)",
    borderColor: "rgba(17, 17, 17, 0.12)",
  },
  {
    key: "canva",
    patterns: ["canva"],
    mode: "label",
    label: "C",
    tintColor: "#00C4CC",
    backgroundColor: "rgba(0, 196, 204, 0.10)",
    borderColor: "rgba(0, 196, 204, 0.18)",
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
  { key: "productivity", patterns: ["productivity", "produktivität", "work"], iconName: "grid-outline" },
  { key: "cloud", patterns: ["cloud", "storage", "speicher"], iconName: "cloud-outline" },
  { key: "finance", patterns: ["finance", "finanzen", "bank"], iconName: "card-outline" },
  { key: "shopping", patterns: ["shopping", "shop"], iconName: "bag-handle-outline" },
  { key: "education", patterns: ["education", "bildung", "learning"], iconName: "school-outline" },
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
      mode: brandMatch.mode,
      iconName: brandMatch.iconName,
      label: brandMatch.label,
      tintColor: brandMatch.tintColor,
      backgroundColor: brandMatch.backgroundColor,
      borderColor: brandMatch.borderColor,
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
