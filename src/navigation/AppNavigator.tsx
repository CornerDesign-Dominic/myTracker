import { NavigationContainer } from "@react-navigation/native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/useAppTheme";
import { useI18n } from "@/hooks/useI18n";
import { AllSubscriptionsScreen } from "@/screens/AllSubscriptionsScreen";
import { HomeScreen } from "@/screens/HomeScreen";
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
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>•</Text>,
        }}
      />
      <Tab.Screen
        name="AllSubscriptions"
        component={AllSubscriptionsScreen}
        options={{
          tabBarLabel: t("tabs.allSubscriptions"),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>•</Text>,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: t("tabs.stats"),
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>•</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { colors, navigationTheme, typography } = useAppTheme();
  const { t } = useI18n();

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
