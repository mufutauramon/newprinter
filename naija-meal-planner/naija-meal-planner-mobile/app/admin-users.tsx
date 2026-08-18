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

type AdminUser = {
  id: number;
  name?: string;
  email?: string;
  city?: string;
  state?: string;
  country_code?: string;
  region?: string;
  auth_provider?: string;
  onboarding_completed?: number;
  created_at?: string;
};

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const data = await apiFetch<{
        ok: boolean;
        users: AdminUser[];
        error?: string;
      }>("/api/admin/users");

      if (!data.ok) {
        throw new Error(data.error || "Unable to load users.");
      }

      setUsers(data.users || []);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not load users.");
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

      <Text style={styles.title}>Users</Text>
      <Text style={styles.subtitle}>View registered app users.</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0f7a43" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No users yet</Text>
          <Text style={styles.emptyText}>Registered users will appear here.</Text>
        </View>
      ) : (
        users.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name || "Unknown User"}</Text>

              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.region || "us"}</Text>
              </View>
            </View>

            <Text style={styles.email}>{item.email || "No email"}</Text>

            <InfoRow label="Provider" value={item.auth_provider || "-"} />
            <InfoRow label="Country" value={item.country_code || "-"} />
            <InfoRow label="City" value={item.city || "-"} />
            <InfoRow
              label="Onboarding"
              value={Number(item.onboarding_completed || 0) === 1 ? "Done" : "Pending"}
            />
            <InfoRow label="Created" value={item.created_at || "-"} />
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
    marginBottom: 6,
  },

  name: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },

  email: {
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 12,
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
    textTransform: "uppercase",
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