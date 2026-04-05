import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const secureStorage = {
  isAvailable() {
    return Platform.OS !== "web";
  },
  async getItem(key: string) {
    if (!this.isAvailable()) {
      return null;
    }

    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (!this.isAvailable()) {
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    if (!this.isAvailable()) {
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};
