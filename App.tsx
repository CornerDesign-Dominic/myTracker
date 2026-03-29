import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { readHasSeenOnboarding, writeHasSeenOnboarding } from "./src/onboarding/storage";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AppSettingsProvider } from "./src/context/AppSettingsContext";
import { useAppSettings } from "./src/context/AppSettingsContext";
import { useAppTheme } from "./src/hooks/useAppTheme";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { spacing } from "./src/theme";

function AppContent() {
  const { isHydrated } = useAppSettings();
  const { authIsReady } = useAuth();
  const { colors, statusBarStyle } = useAppTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let isActive = true;

    readHasSeenOnboarding()
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
  }, []);

  if (!authIsReady || !isHydrated || hasSeenOnboarding === null) {
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
        showOnboarding={!hasSeenOnboarding}
        onCompleteOnboarding={async () => {
          await writeHasSeenOnboarding();
          setHasSeenOnboarding(true);
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppSettingsProvider>
          <AppContent />
        </AppSettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
