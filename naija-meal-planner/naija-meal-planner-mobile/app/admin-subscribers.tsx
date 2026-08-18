import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../utils/api";

type Subscriber = {
  id: number;
  user_id?: number;
  email?: string;
  revenuecat_app_user_id?: string;
  entitlement?: string;
  product_id?: string;
  store?: string;
  status?: string;
  purchased_at?: string;
  expires_at?: string;
  subscription_period?: string;
  event_type?: string;
  environment?: string;
  updated_at?: string;
};

export default function AdminSubscribers() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      setLoading(true);

      const data = await apiFetch<{
        ok: boolean;
        subscribers: Subscriber[];
        error?: string;
      }>("/api/admin/subscribers");

      if (!data.ok) {
        throw new Error(data.error || "Unable to load subscribers.");
      }

      setSubscribers(data.subscribers || []);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not load subscribers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Subscribers</Text>
      <Text style={styles.subtitle}>View active Pro subscriptions.</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0f7a43" />
          <Text style={styles.loadingText}>Loading subscribers...</Text>
        </View>
      ) : subscribers.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No active subscribers</Text>
          <Text style={styles.emptyText}>Active subscriptions will appear here.</Text>
        </View>
      ) : (
        subscribers.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.email}>
                {item.email || item.revenuecat_app_user_id || "Unknown Subscriber"}
              </Text>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.status || "unknown"}</Text>
              </View>
            </View>

            <InfoRow label="Store" value={item.store || "-"} />
            <InfoRow label="Product" value={item.product_id || "-"} />
            <InfoRow label="Plan" value={item.subscription_period || "-"} />
            <InfoRow label="Environment" value={item.environment || "UNKNOWN"} />
            <InfoRow label="Purchased" value={item.purchased_at || "-"} />
            <InfoRow label="Expires" value={item.expires_at || "-"} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7f0" },
  content: { padding: 22, paddingTop: 60, paddingBottom: 80 },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  backText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },

  title: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900",
  },

  subtitle: {
    color: "#64748b",
    marginTop: 10,
    marginBottom: 22,
    fontWeight: "700",
  },

  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "800",
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 22,
  },

  emptyTitle: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 18,
  },

  emptyText: {
    color: "#64748b",
    marginTop: 8,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 10,
  },

  email: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 15,
  },

  badge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeText: {
    color: "#15803d",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "capitalize",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
    marginTop: 10,
    gap: 10,
  },

  infoLabel: {
    color: "#64748b",
    fontWeight: "800",
    width: 95,
  },

  infoValue: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "700",
    textAlign: "right",
  },
});