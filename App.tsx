import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAppTheme } from "./src/hooks/useAppTheme";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  const { statusBarStyle } = useAppTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={statusBarStyle} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
