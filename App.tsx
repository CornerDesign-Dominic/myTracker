import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as ExpoLinking from "expo-linking";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { readHasSeenOnboarding, writeHasSeenOnboarding } from "./src/onboarding/storage";
import { runtimeConfig } from "./src/config/runtime";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AppSettingsProvider } from "./src/context/AppSettingsContext";
import { PurchaseProvider, usePurchases } from "./src/context/PurchaseContext";
import { useAppSettings } from "./src/context/AppSettingsContext";
import { UserStatsMirrorSync } from "./src/context/UserStatsMirrorSync";
import { useAppTheme } from "./src/hooks/useAppTheme";
import { trackDeepLinkOpen } from "./src/navigation/linking";
import { analyticsEventNames } from "./src/services/analytics/events";
import { analyticsService } from "./src/services/analytics/service";
import { notificationsService } from "./src/services/notifications/service";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { spacing } from "./src/theme";

function AppContent() {
  const { isHydrated } = useAppSettings();
  const { authIsReady, currentUser } = useAuth();
  const { isHydrated: purchasesHydrated } = usePurchases();
  const { colors, statusBarStyle } = useAppTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const onboardingScopeKey = currentUser?.uid ?? "guest";
  const hasTrackedAppOpenRef = useRef(false);

  useEffect(() => {
    analyticsService.setDebugEnabled(runtimeConfig.analyticsDebugEnabled);
    analyticsService.setConsentGranted(runtimeConfig.analyticsDebugEnabled);

    if (!hasTrackedAppOpenRef.current) {
      analyticsService.track(analyticsEventNames.appOpen, {
        authState: currentUser
          ? (currentUser.isAnonymous ? "anonymous" : "authenticated")
          : "unknown",
      });
      hasTrackedAppOpenRef.current = true;
    }

    notificationsService.initializeAsync().catch(() => undefined);

    ExpoLinking.getInitialURL()
      .then((url) => {
        if (url) {
          trackDeepLinkOpen(url);
        }
      })
      .catch(() => undefined);

    const subscription = ExpoLinking.addEventListener("url", ({ url }) => {
      trackDeepLinkOpen(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    setHasSeenOnboarding(null);

    readHasSeenOnboarding(onboardingScopeKey)
      .then((value) => {
        if (!isActive) {
          return;
        }

        setHasSeenOnboarding(value);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setHasSeenOnboarding(false);
      });

    return () => {
      isActive = false;
    };
  }, [onboardingScopeKey]);

  if (!authIsReady || !isHydrated || !purchasesHydrated || hasSeenOnboarding === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.lg,
        }}
      >
        <StatusBar style={statusBarStyle} />
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <AppNavigator
        key={`navigator:${onboardingScopeKey}:${hasSeenOnboarding ? "seen" : "new"}`}
        showOnboarding={!hasSeenOnboarding}
        onCompleteOnboarding={async () => {
          await writeHasSeenOnboarding(onboardingScopeKey);
          setHasSeenOnboarding(true);
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <KeyboardProvider navigationBarTranslucent preserveEdgeToEdge statusBarTranslucent>
      <SafeAreaProvider>
        <AuthProvider>
          <PurchaseProvider>
            <AppSettingsProvider>
              <UserStatsMirrorSync />
              <AppContent />
            </AppSettingsProvider>
          </PurchaseProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
