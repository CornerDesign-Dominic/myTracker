import { TextStyle, ViewStyle } from "react-native";

export type AppThemeMode = "light" | "dark";
export type AccentColor =
  | "indigo"
  | "blue"
  | "teal"
  | "green"
  | "purple"
  | "orange"
  | "slate"
  | "sage"
  | "olive"
  | "forest"
  | "sand"
  | "clay"
  | "amber"
  | "coral"
  | "peach"
  | "rose"
  | "violet"
  | "lavender"
  | "cyan"
  | "gold"
  | "graphite"
  | "mint"
  | "terracotta"
  | "ruby"
  | "steel";

type AccentPalette = {
  accent: string;
  accentSoft: string;
};

type ThemeBaseTokens = {
  background: string;
  surface: string;
  surfaceSoft: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentText: string;
  success: string;
  warning: string;
  danger: string;
  shadow: string;
  overlay: string;
};

const lightThemeBase: ThemeBaseTokens = {
  background: "#F8FAFD",
  surface: "#FFFFFF",
  surfaceSoft: "#F3F6FB",
  surfaceMuted: "#EEF2F8",
  border: "#E6EBF3",
  borderStrong: "#D7DFEA",
  textPrimary: "#121722",
  textSecondary: "#6B7280",
  textMuted: "#8A94A6",
  accentText: "#FFFFFF",
  success: "#34C38F",
  warning: "#F4B740",
  danger: "#F87171",
  shadow: "rgba(15, 23, 42, 0.08)",
  overlay: "rgba(15, 23, 42, 0.14)",
};

const darkThemeBase: ThemeBaseTokens = {
  background: "#090B0E",
  surface: "#111418",
  surfaceSoft: "#171B20",
  surfaceMuted: "#1D2229",
  border: "#232A32",
  borderStrong: "#2E3743",
  textPrimary: "#F5F7FA",
  textSecondary: "#98A2AD",
  textMuted: "#7D8793",
  accentText: "#FFFFFF",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#F87171",
  shadow: "rgba(0,0,0,0.42)",
  overlay: "rgba(0,0,0,0.56)",
};

const accentPalettes: Record<AccentColor, Record<AppThemeMode, AccentPalette>> = {
  indigo: {
    light: {
      accent: "#6366F1",
      accentSoft: "#EEF0FF",
    },
    dark: {
      accent: "#818CF8",
      accentSoft: "rgba(129,140,248,0.18)",
    },
  },
  blue: {
    light: {
      accent: "#2563EB",
      accentSoft: "#EAF2FF",
    },
    dark: {
      accent: "#60A5FA",
      accentSoft: "rgba(96,165,250,0.2)",
    },
  },
  teal: {
    light: {
      accent: "#0F766E",
      accentSoft: "#E7F7F5",
    },
    dark: {
      accent: "#2DD4BF",
      accentSoft: "rgba(45,212,191,0.18)",
    },
  },
  green: {
    light: {
      accent: "#15803D",
      accentSoft: "#EAF8EE",
    },
    dark: {
      accent: "#4ADE80",
      accentSoft: "rgba(74,222,128,0.18)",
    },
  },
  purple: {
    light: {
      accent: "#7C3AED",
      accentSoft: "#F2EAFF",
    },
    dark: {
      accent: "#A78BFA",
      accentSoft: "rgba(167,139,250,0.2)",
    },
  },
  orange: {
    light: {
      accent: "#EA580C",
      accentSoft: "#FFF1E8",
    },
    dark: {
      accent: "#FB923C",
      accentSoft: "rgba(251,146,60,0.2)",
    },
  },
  slate: {
    light: {
      accent: "#475569",
      accentSoft: "#F0F4F8",
    },
    dark: {
      accent: "#94A3B8",
      accentSoft: "rgba(148,163,184,0.18)",
    },
  },
  sage: {
    light: {
      accent: "#6B8A7A",
      accentSoft: "#EEF4F0",
    },
    dark: {
      accent: "#9EC5AE",
      accentSoft: "rgba(158,197,174,0.18)",
    },
  },
  olive: {
    light: {
      accent: "#6B7A2F",
      accentSoft: "#F2F6E8",
    },
    dark: {
      accent: "#A3B85C",
      accentSoft: "rgba(163,184,92,0.18)",
    },
  },
  forest: {
    light: {
      accent: "#2F6B4F",
      accentSoft: "#EAF5EF",
    },
    dark: {
      accent: "#6FB08B",
      accentSoft: "rgba(111,176,139,0.18)",
    },
  },
  sand: {
    light: {
      accent: "#B08B57",
      accentSoft: "#FBF4EA",
    },
    dark: {
      accent: "#D7B27B",
      accentSoft: "rgba(215,178,123,0.18)",
    },
  },
  clay: {
    light: {
      accent: "#A56A5A",
      accentSoft: "#F9EEEA",
    },
    dark: {
      accent: "#CE9282",
      accentSoft: "rgba(206,146,130,0.18)",
    },
  },
  amber: {
    light: {
      accent: "#C48A2C",
      accentSoft: "#FCF5E8",
    },
    dark: {
      accent: "#E5B85B",
      accentSoft: "rgba(229,184,91,0.18)",
    },
  },
  coral: {
    light: {
      accent: "#D66B5F",
      accentSoft: "#FDEDEA",
    },
    dark: {
      accent: "#F09A8F",
      accentSoft: "rgba(240,154,143,0.18)",
    },
  },
  peach: {
    light: {
      accent: "#D88A6C",
      accentSoft: "#FEF1EB",
    },
    dark: {
      accent: "#F1B29A",
      accentSoft: "rgba(241,178,154,0.18)",
    },
  },
  rose: {
    light: {
      accent: "#C56A86",
      accentSoft: "#FBEFF3",
    },
    dark: {
      accent: "#E4A0B6",
      accentSoft: "rgba(228,160,182,0.18)",
    },
  },
  violet: {
    light: {
      accent: "#6E59C9",
      accentSoft: "#F1EEFC",
    },
    dark: {
      accent: "#A996F2",
      accentSoft: "rgba(169,150,242,0.18)",
    },
  },
  lavender: {
    light: {
      accent: "#8E7CC3",
      accentSoft: "#F4F1FB",
    },
    dark: {
      accent: "#C0B1E8",
      accentSoft: "rgba(192,177,232,0.18)",
    },
  },
  cyan: {
    light: {
      accent: "#2E8CA3",
      accentSoft: "#EAF7FA",
    },
    dark: {
      accent: "#6AC3D9",
      accentSoft: "rgba(106,195,217,0.18)",
    },
  },
  gold: {
    light: {
      accent: "#B68A2E",
      accentSoft: "#FAF4E6",
    },
    dark: {
      accent: "#D7B15A",
      accentSoft: "rgba(215,177,90,0.18)",
    },
  },
  graphite: {
    light: {
      accent: "#4B5563",
      accentSoft: "#F2F4F7",
    },
    dark: {
      accent: "#9AA4B2",
      accentSoft: "rgba(154,164,178,0.18)",
    },
  },
  mint: {
    light: {
      accent: "#4D9B8A",
      accentSoft: "#ECF8F4",
    },
    dark: {
      accent: "#7FD0BE",
      accentSoft: "rgba(127,208,190,0.18)",
    },
  },
  terracotta: {
    light: {
      accent: "#B76A4C",
      accentSoft: "#FBEEE8",
    },
    dark: {
      accent: "#D8987F",
      accentSoft: "rgba(216,152,127,0.18)",
    },
  },
  ruby: {
    light: {
      accent: "#B85C78",
      accentSoft: "#FAEDF2",
    },
    dark: {
      accent: "#DD8DA7",
      accentSoft: "rgba(221,141,167,0.18)",
    },
  },
  steel: {
    light: {
      accent: "#5E7696",
      accentSoft: "#EEF3F9",
    },
    dark: {
      accent: "#93AAC9",
      accentSoft: "rgba(147,170,201,0.18)",
    },
  },
};

export const getAccentPalette = (accentColor: AccentColor, mode: AppThemeMode) =>
  accentPalettes[accentColor][mode];

export const accentColorOptions = [
  "slate",
  "graphite",
  "steel",
  "indigo",
  "blue",
  "sage",
  "teal",
  "mint",
  "green",
  "cyan",
  "olive",
  "forest",
  "sand",
  "clay",
  "amber",
  "gold",
  "orange",
  "coral",
  "terracotta",
  "peach",
  "rose",
  "ruby",
  "lavender",
  "violet",
  "purple",
] as const satisfies readonly AccentColor[];

export const createTheme = (mode: AppThemeMode, accentColor: AccentColor = "indigo") => ({
  ...(mode === "dark" ? darkThemeBase : lightThemeBase),
  ...accentPalettes[accentColor][mode],
});

export const getThemeColors = (mode: AppThemeMode, accentColor: AccentColor = "indigo") =>
  createTheme(mode, accentColor);

export type AppThemeColors = ReturnType<typeof createTheme>;
export type AppTypography = typeof typography;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export const typography = {
  pageTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.7,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.3,
  } satisfies TextStyle,
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  } satisfies TextStyle,
  secondary: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  } satisfies TextStyle,
  meta: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    letterSpacing: 0.2,
  } satisfies TextStyle,
  metric: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.8,
  } satisfies TextStyle,
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  } satisfies TextStyle,
} as const;

export const shadowPresets = {
  card: (colors: AppThemeColors) =>
    ({
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 22,
      shadowOffset: {
        width: 0,
        height: 12,
      },
      elevation: 4,
    }) satisfies ViewStyle,
  soft: (colors: AppThemeColors) =>
    ({
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 2,
    }) satisfies ViewStyle,
} as const;
