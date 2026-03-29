import AsyncStorage from "@react-native-async-storage/async-storage";

const getOnboardingSeenKey = (scopeKey: string) => `app:onboarding-seen:${scopeKey}`;

export const readHasSeenOnboarding = async (scopeKey: string) => {
  const value = await AsyncStorage.getItem(getOnboardingSeenKey(scopeKey));
  return value === "true";
};

export const writeHasSeenOnboarding = async (scopeKey: string) => {
  await AsyncStorage.setItem(getOnboardingSeenKey(scopeKey), "true");
};
