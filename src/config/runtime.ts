import Constants from "expo-constants";

type RuntimeExtra = {
  eas?: {
    projectId?: string;
  };
  octoVault?: {
    appName?: string;
    deepLinkScheme?: string;
    universalLinkHost?: string | null;
    analyticsDebugEnabled?: boolean;
    notificationDebugEnabled?: boolean;
  };
};

const extra = (Constants.expoConfig?.extra ?? {}) as RuntimeExtra;

export const runtimeConfig = {
  appName: extra.octoVault?.appName ?? "OctoVault",
  deepLinkScheme: extra.octoVault?.deepLinkScheme ?? "octovault",
  universalLinkHost: extra.octoVault?.universalLinkHost ?? null,
  analyticsDebugEnabled: Boolean(extra.octoVault?.analyticsDebugEnabled),
  notificationDebugEnabled: Boolean(extra.octoVault?.notificationDebugEnabled),
  easProjectId:
    Constants.easConfig?.projectId ??
    extra.eas?.projectId ??
    null,
} as const;
