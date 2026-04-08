import type { ConfigContext, ExpoConfig } from "expo/config";

const APP_NAME = "OctoVault";
const APP_SCHEME = "octovault";
const APP_LINK_HOST = process.env.EXPO_PUBLIC_APP_LINK_HOST?.trim().toLowerCase() ?? "";
const HAS_UNIVERSAL_LINK_HOST = APP_LINK_HOST.length > 0;

const associatedDomains = HAS_UNIVERSAL_LINK_HOST ? [`applinks:${APP_LINK_HOST}`] : [];

const androidIntentFilters = HAS_UNIVERSAL_LINK_HOST
  ? [
      {
        action: "VIEW",
        autoVerify: false,
        category: ["BROWSABLE", "DEFAULT"],
        data: [
          {
            scheme: "https",
            host: APP_LINK_HOST,
            pathPrefix: "/",
          },
        ],
      },
    ]
  : [];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: "subscription-tracker-mvp",
  version: "1.1.1",
  orientation: "portrait",
  userInterfaceStyle: "light",
  scheme: APP_SCHEME,
  icon: "./assets/app/icon.png",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    associatedDomains,
  },
  android: {
    package: "com.cornerdesign.mytracker",
    googleServicesFile: "./google-services.json",
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      foregroundImage: "./assets/app/icon.png",
      backgroundColor: "#ffffff",
    },
    intentFilters: androidIntentFilters,
  },
  web: {
    bundler: "metro",
  },
  plugins: [
    "@react-native-community/datetimepicker",
    "@react-native-firebase/app",
    "@react-native-firebase/crashlytics",
    "react-native-iap",
    "./plugins/withReactNativeIapAndroid",
    [
      "expo-build-properties",
      {},
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/app/octovault-notification-icon.png",
        color: "#0F766E",
      },
    ],
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#F4F7F2",
        image: "./assets/app/octovault-splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "4ede4e45-de83-4081-bfe5-ae4d812d6256",
    },
    octoVault: {
      appName: APP_NAME,
      deepLinkScheme: APP_SCHEME,
      universalLinkHost: HAS_UNIVERSAL_LINK_HOST ? APP_LINK_HOST : null,
      assetsReadyForRelease: true,
      analyticsDebugEnabled: process.env.EXPO_PUBLIC_ANALYTICS_DEBUG === "1",
      notificationDebugEnabled: process.env.EXPO_PUBLIC_NOTIFICATIONS_DEBUG === "1",
    },
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/4ede4e45-de83-4081-bfe5-ae4d812d6256",
  },
});
