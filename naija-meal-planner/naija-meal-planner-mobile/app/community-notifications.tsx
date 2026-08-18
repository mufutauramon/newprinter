import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../utils/api";
import * as Notifications from "expo-notifications";
import { DeviceEventEmitter } from "react-native";
import { useAppContext } from "../context/AppContext";
import { formatAgeSeconds } from "../utils/time";

export default function CommunityNotifications() {
  const { user } = useAppContext();
  const { token } = useAppContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await apiFetch<any>(
  "/api/community/notifications",
  { token }
);

      if (data.ok) {
        setNotifications(data.notifications || []);
      }
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  const init = async () => {
    await loadNotifications();

    try {
      await apiFetch("/api/community/notifications/read", {
  method: "POST",
  token,
  body: JSON.stringify({}),
});

      await Notifications.setBadgeCountAsync(0);

      DeviceEventEmitter.emit("communityNotificationsRead");
    } catch (err) {
      console.log("Mark notifications read failed:", err);
    }
  };

  if (user?.id) {
    init();
  }
}, [user?.id]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Notifications</Text>

      {loading ? (
        <ActivityIndicator color="#15803d" />
      ) : notifications.length === 0 ? (
        <Text style={styles.emptyText}>No notifications yet.</Text>
      ) : (
        notifications.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.card, !item.is_read && styles.unreadCard]}
            onPress={() =>
              item.post_id
                ? router.push({
                    pathname: "/community-post-detail",
                    params: { id: String(item.post_id) },
                  })
                : null
            }
          >
            <View style={styles.iconBox}>
              <Ionicons
                name={
                  item.type === "follow"
                    ? "person-add-outline"
                    : item.type === "like"
                    ? "heart-outline"
                    : "chatbubble-outline"
                }
                size={22}
                color="#15803d"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>
                {formatAgeSeconds(item.age_seconds) || item.created_at}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7f0" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 120 },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backText: { fontWeight: "900", color: "#0f172a" },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 20,
  },
  emptyText: {
    color: "#64748b",
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: "#15803d",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    color: "#0f172a",
    fontWeight: "900",
    lineHeight: 20,
  },
  time: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 4,
  },
});