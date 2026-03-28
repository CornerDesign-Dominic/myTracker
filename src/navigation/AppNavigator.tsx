import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { AllSubscriptionsScreen } from "@/screens/AllSubscriptionsScreen";
import { CalendarScreen } from "@/screens/CalendarScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { RegisterScreen } from "@/screens/RegisterScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { StatsScreen } from "@/screens/StatsScreen";
import { SubscriptionDetailsScreen } from "@/screens/SubscriptionDetailsScreen";
import { SubscriptionFormScreen } from "@/screens/SubscriptionFormScreen";

import { RootStackParamList, RootTabParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const TabsNavigator = () => {
  const { colors, typography, shadows } = useAppTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);
  const tabBarPaddingTop = 10;
  const tabBarPaddingBottom = bottomInset + 8;
  const tabBarHeight = 52 + tabBarPaddingTop + tabBarPaddingBottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarLabelStyle: {
          ...typography.meta,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: tabBarPaddingTop,
          paddingBottom: tabBarPaddingBottom,
          ...shadows.soft,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: t("tabs.calendar"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AllSubscriptions"
        component={AllSubscriptionsScreen}
        options={{
          tabBarLabel: t("tabs.allSubscriptions"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: t("tabs.stats"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { colors, navigationTheme, typography } = useAppTheme();
  const { language, t } = useI18n();

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.textPrimary,
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            ...typography.cardTitle,
            color: colors.textPrimary,
          },
          headerLargeTitleStyle: {
            ...typography.pageTitle,
            color: colors.textPrimary,
          },
        }}
      >
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: language === "de" ? "Login" : "Login" }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: language === "de" ? "Registrierung" : "Register" }}
        />
        <Stack.Screen
          name="SubscriptionForm"
          component={SubscriptionFormScreen}
          options={{
            title: t("common.subscriptions"),
          }}
        />
        <Stack.Screen
          name="SubscriptionDetails"
          component={SubscriptionDetailsScreen}
          options={{
            title: t("common.details"),
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: t("common.settings"),
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
