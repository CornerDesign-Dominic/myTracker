import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

export type RootStackParamList = {
  Tabs: undefined;
  SubscriptionForm: { subscriptionId?: string } | undefined;
  SubscriptionDetails: { subscriptionId: string };
};

export type RootTabParamList = {
  Home: undefined;
  Stats: undefined;
};

export type HomeTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, "Home">,
  NativeStackScreenProps<RootStackParamList>
>;
