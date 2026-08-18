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

type FeedbackItem = {
  id: number;
  user_id: number;
  rating: number;
  message: string;
  created_at: string;
  name?: string;
  email?: string;
};

export default function AdminFeedback() {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);

      const data = await apiFetch<{
        ok: boolean;
        feedback: FeedbackItem[];
        error?: string;
      }>("/api/admin/feedback");

      if (!data.ok) {
        throw new Error(data.error || "Unable to load feedback.");
      }

      setFeedback(data.feedback || []);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not load feedback.");
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

      <Text style={styles.title}>User Feedback</Text>
      <Text style={styles.subtitle}>Read feedback submitted inside the app.</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#0f7a43" />
          <Text style={styles.loadingText}>Loading feedback...</Text>
        </View>
      ) : feedback.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No feedback yet</Text>
          <Text style={styles.emptyText}>User feedback will appear here.</Text>
        </View>
      ) : (
        feedback.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name || "Unknown User"}</Text>
              <Text style={styles.rating}>⭐ {item.rating || 0}/5</Text>
            </View>

            <Text style={styles.email}>{item.email || "No email"}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.date}>{item.created_at}</Text>
          </View>
        ))
      )}
    </ScrollView>
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
    justifyContent: "space-between",
    marginBottom: 4,
  },

  name: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 16,
  },

  rating: {
    color: "#15803d",
    fontWeight: "900",
  },

  email: {
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 12,
  },

  message: {
    color: "#0f172a",
    fontWeight: "700",
    lineHeight: 22,
  },

  date: {
    color: "#94a3b8",
    fontWeight: "700",
    marginTop: 12,
    fontSize: 12,
  },
});