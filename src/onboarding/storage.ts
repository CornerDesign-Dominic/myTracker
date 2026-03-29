import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_SEEN_KEY = "app:onboarding-seen";

export const readHasSeenOnboarding = async () => {
  const value = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
  return value === "true";
};

export const writeHasSeenOnboarding = async () => {
  await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
};
