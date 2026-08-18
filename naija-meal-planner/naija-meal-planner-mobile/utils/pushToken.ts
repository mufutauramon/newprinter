import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "./api";

export async function registerPushToken(authToken?: string | null) {
  if (!authToken) return;

  const permission = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  if (!permission.granted) return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const expoPushToken = tokenData.data;

  if (!expoPushToken) return;

  await apiFetch("/api/users/push-token", {
    method: "POST",
    token: authToken,
    body: JSON.stringify({
      expoPushToken,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("community", {
      name: "Community",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}