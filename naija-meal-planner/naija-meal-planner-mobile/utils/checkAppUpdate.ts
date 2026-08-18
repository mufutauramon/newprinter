import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "./api";

const LAST_UPDATE_PROMPT_KEY = "last_update_prompt_time";
const ONE_DAY = 24 * 60 * 60 * 1000;

export async function checkAppUpdate() {
  try {
    const data = await apiFetch<{
      ok: boolean;
      forceUpdate?: boolean;
      ios: {
        latestBuild: number;
        minimumBuild: number;
        storeUrl: string;
      };
      android: {
        latestBuild: number;
        minimumBuild: number;
        storeUrl: string;
      };
      message?: string;
    }>("/api/app-version");

    if (!data.ok) return;

    const currentBuild = Number(
      Platform.OS === "ios"
        ? Constants.expoConfig?.ios?.buildNumber || 0
        : Constants.expoConfig?.android?.versionCode || 0
    );

    const info = Platform.OS === "ios" ? data.ios : data.android;

    const latestBuild = Number(info.latestBuild || 0);
    const minimumBuild = Number(info.minimumBuild || 0);

    if (!currentBuild || currentBuild >= latestBuild) return;

    const mustUpdate =
      data.forceUpdate === true || currentBuild < minimumBuild;

    if (!mustUpdate) {
      const lastShown = await SecureStore.getItemAsync(LAST_UPDATE_PROMPT_KEY);
      const lastShownTime = Number(lastShown || 0);

      if (lastShownTime && Date.now() - lastShownTime < ONE_DAY) {
        return;
      }
    }

    const openStore = () => {
      Linking.openURL(info.storeUrl);
    };

    if (mustUpdate) {
      Alert.alert(
        "Update Required",
        data.message ||
          "Please update Naija Meal Planner to continue using the app.",
        [
          {
            text: "Update Now",
            onPress: openStore,
          },
        ],
        { cancelable: false }
      );

      return;
    }

    Alert.alert(
      "Update Available",
      data.message || "A new version of Naija Meal Planner is available.",
      [
        {
          text: "Later",
          style: "cancel",
          onPress: async () => {
            await SecureStore.setItemAsync(
              LAST_UPDATE_PROMPT_KEY,
              String(Date.now())
            );
          },
        },
        {
          text: "Update Now",
          onPress: openStore,
        },
      ]
    );
  } catch (err) {
    console.log("App update check failed:", err);
  }
}