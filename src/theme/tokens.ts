import { TextStyle, ViewStyle } from "react-native";

export type AppThemeMode = "light" | "dark";
export type AccentColor =
  | "slate"
  | "graphite"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "sage"
  | "forest"
  | "sand"
  | "amber"
  | "orange"
  | "coral"
  | "gold"
  | "violet"
  | "rose";

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
  background: "#EFF2F5",
  surface: "#FFFFFF",
  surfaceSoft: "#EDF3F8",
  surfaceMuted: "#E8EEF6",
  border: "#D7E0EB",
  borderStrong: "#C5D1E0",
  textPrimary: "#121722",
  textSecondary: "#556171",
  textMuted: "#6D7A8C",
  accentText: "#FFFFFF",
  success: "#34C38F",
  warning: "#F4B740",
  danger: "#F87171",
  shadow: "rgba(15, 23, 42, 0.08)",
  overlay: "rgba(15, 23, 42, 0.14)",
};

const darkThemeBase: ThemeBaseTokens = {
  background: "#090B0E",
  surface: "#151B23",
  surfaceSoft: "#1C242E",
  surfaceMuted: "#252F3B",
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.12)",
  textPrimary: "#F4F7FB",
  textSecondary: "#A8B1BB",
  textMuted: "#909BA8",
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
      accent: "#7C86E8",
      accentSoft: "rgba(124,134,232,0.16)",
    },
  },
  blue: {
    light: {
      accent: "#2563EB",
      accentSoft: "#EAF2FF",
    },
    dark: {
      accent: "#5A97E3",
      accentSoft: "rgba(90,151,227,0.17)",
    },
  },
  teal: {
    light: {
      accent: "#0F766E",
      accentSoft: "#E7F7F5",
    },
    dark: {
      accent: "#39B7A8",
      accentSoft: "rgba(57,183,168,0.16)",
    },
  },
  green: {
    light: {
      accent: "#15803D",
      accentSoft: "#EAF8EE",
    },
    dark: {
      accent: "#57C87D",
      accentSoft: "rgba(87,200,125,0.16)",
    },
  },
  orange: {
    light: {
      accent: "#EA580C",
      accentSoft: "#FFF1E8",
    },
    dark: {
      accent: "#E38A4A",
      accentSoft: "rgba(227,138,74,0.17)",
    },
  },
  slate: {
    light: {
      accent: "#475569",
      accentSoft: "#F0F4F8",
    },
    dark: {
      accent: "#8997AB",
      accentSoft: "rgba(137,151,171,0.16)",
    },
  },
  sage: {
    light: {
      accent: "#6B8A7A",
      accentSoft: "#EEF4F0",
    },
    dark: {
      accent: "#93B59F",
      accentSoft: "rgba(147,181,159,0.16)",
    },
  },
  forest: {
    light: {
      accent: "#2F6B4F",
      accentSoft: "#EAF5EF",
    },
    dark: {
      accent: "#69A07F",
      accentSoft: "rgba(105,160,127,0.16)",
    },
  },
  sand: {
    light: {
      accent: "#B08B57",
      accentSoft: "#FBF4EA",
    },
    dark: {
      accent: "#C8A874",
      accentSoft: "rgba(200,168,116,0.16)",
    },
  },
  amber: {
    light: {
      accent: "#EAB308",
      accentSoft: "#FEF3C7",
    },
    dark: {
      accent: "#D9AD1F",
      accentSoft: "rgba(217,173,31,0.16)",
    },
  },
  coral: {
    light: {
      accent: "#D66B5F",
      accentSoft: "#FDEDEA",
    },
    dark: {
      accent: "#DD9388",
      accentSoft: "rgba(221,147,136,0.16)",
    },
  },
  rose: {
    light: {
      accent: "#C56A86",
      accentSoft: "#FBEFF3",
    },
    dark: {
      accent: "#D08EA5",
      accentSoft: "rgba(208,142,165,0.16)",
    },
  },
  violet: {
    light: {
      accent: "#6E59C9",
      accentSoft: "#F1EEFC",
    },
    dark: {
      accent: "#8F7CDE",
      accentSoft: "rgba(143,124,222,0.16)",
    },
  },
  cyan: {
    light: {
      accent: "#2E8CA3",
      accentSoft: "#EAF7FA",
    },
    dark: {
      accent: "#5FAFC2",
      accentSoft: "rgba(95,175,194,0.16)",
    },
  },
  gold: {
    light: {
      accent: "#B68A2E",
      accentSoft: "#FAF4E6",
    },
    dark: {
      accent: "#C79F54",
      accentSoft: "rgba(199,159,84,0.16)",
    },
  },
  graphite: {
    light: {
      accent: "#4B5563",
      accentSoft: "#F2F4F7",
    },
    dark: {
      accent: "#8D97A4",
      accentSoft: "rgba(141,151,164,0.16)",
    },
  },
};

export const getAccentPalette = (accentColor: AccentColor, mode: AppThemeMode) =>
  accentPalettes[accentColor][mode];

export const accentColorOptions = [
  "green",
  "indigo",
  "cyan",
  "violet",
  "rose",
  "orange",
  "amber",
  "slate",
] as const satisfies readonly AccentColor[];

export const createTheme = (mode: AppThemeMode, accentColor: AccentColor = "green") => ({
  ...(mode === "dark" ? darkThemeBase : lightThemeBase),
  ...accentPalettes[accentColor][mode],
});

export const getThemeColors = (mode: AppThemeMode, accentColor: AccentColor = "green") =>
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
