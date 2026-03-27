import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import { useAppTheme } from "@/hooks/useAppTheme";
import { HomeScreen } from "@/screens/HomeScreen";
import { StatsScreen } from "@/screens/StatsScreen";
import { SubscriptionDetailsScreen } from "@/screens/SubscriptionDetailsScreen";
import { SubscriptionFormScreen } from "@/screens/SubscriptionFormScreen";

import { RootStackParamList, RootTabParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const TabsNavigator = () => {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>•</Text>,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: "Statistik",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>•</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { colors, navigationTheme } = useAppTheme();

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
            color: colors.textPrimary,
          },
        }}
      >
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="SubscriptionForm"
          component={SubscriptionFormScreen}
          options={{
            title: "Abo",
          }}
        />
        <Stack.Screen
          name="SubscriptionDetails"
          component={SubscriptionDetailsScreen}
          options={{
            title: "Details",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
