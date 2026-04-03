import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  Login: undefined;
  Register: undefined;
  SubscriptionForm: { subscriptionId?: string } | undefined;
  SubscriptionDetails: { subscriptionId: string };
  SubscriptionHistory: { subscriptionId: string };
  AddPayment: { subscriptionId: string; eventId?: string };
  Savings: undefined;
  BillingFrequency: undefined;
  MonthlyPreview: undefined;
  Settings: undefined;
  Account: undefined;
  Terms: undefined;
  Privacy: undefined;
  Imprint: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Calendar: undefined;
  AllSubscriptions: undefined;
  Stats: undefined;
};

export type HomeTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;

export type AllSubscriptionsTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "AllSubscriptions">,
  NativeStackScreenProps<RootStackParamList>
>;

export type CalendarTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "Calendar">,
  NativeStackScreenProps<RootStackParamList>
>;

export type StatsTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "Stats">,
  NativeStackScreenProps<RootStackParamList>
>;
