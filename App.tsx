import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppSettingsProvider } from "./src/context/AppSettingsContext";
import { useAppSettings } from "./src/context/AppSettingsContext";
import { useAppTheme } from "./src/hooks/useAppTheme";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { spacing } from "./src/theme";

function AppContent() {
  const { isHydrated } = useAppSettings();
  const { colors, statusBarStyle } = useAppTheme();

  if (!isHydrated) {
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
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <AppContent />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );
}
