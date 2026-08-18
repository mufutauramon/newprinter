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
import { useAppContext } from "../context/AppContext";

export default function AdminCommunityReports() {
  const { user } = useAppContext();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      const data = await apiFetch<any>(
        `/api/admin/community-reports?adminEmail=${encodeURIComponent(
          user?.email || ""
        )}`
      );

      if (data.ok) setReports(data.reports || []);
    } finally {
      setLoading(false);
    }
  };
const updateReportStatus = async (reportId: number, status: string) => {
  const data = await apiFetch<any>(
    `/api/admin/community-reports/${reportId}/status`,
    {
      method: "POST",
      body: JSON.stringify({
        adminEmail: user?.email,
        status,
      }),
    }
  );

  if (data.ok) {
    setReports((prev) =>
      prev.map((item) =>
        item.id === reportId ? { ...item, status } : item
      )
    );
  }
};
const deleteReportedPost = async (postId: number) => {
  const data = await apiFetch<any>(
    `/api/admin/community/posts/${postId}`,
    {
      method: "DELETE",
      body: JSON.stringify({
        adminEmail: user?.email,
      }),
    }
  );

  if (data.ok) {
    setReports((prev) =>
      prev.filter((r) => r.post_id !== postId)
    );
  }
};
  useEffect(() => {
    loadReports();
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Community Reports</Text>

      {loading ? (
        <ActivityIndicator color="#15803d" />
      ) : reports.length === 0 ? (
        <Text style={styles.emptyText}>No reports yet.</Text>
      ) : (
        reports.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.reason}>{item.reason}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>

            <Text style={styles.label}>Reported Post</Text>
            <Text style={styles.postTitle}>{item.title || "Untitled"}</Text>
            <Text style={styles.postContent}>{item.content || ""}</Text>

            <Text style={styles.label}>Author</Text>
            <Text style={styles.meta}>
              {item.author_name} • {item.author_email}
            </Text>

            <Text style={styles.label}>Reporter</Text>
            <Text style={styles.meta}>{item.reporter_email || "Unknown"}</Text>

            <Pressable
              style={styles.viewBtn}
              onPress={() =>
                router.push({
                  pathname: "/community-post-detail",
                  params: { id: String(item.post_id) },
                })
              }
            >
              <Text style={styles.viewText}>View Post</Text>
            </Pressable>
            <Pressable
  style={styles.reviewBtn}
  onPress={() => updateReportStatus(item.id, "reviewed")}
>
  <Text style={styles.reviewText}>Mark as Reviewed</Text>
</Pressable>
<Pressable
  style={styles.deleteBtn}
  onPress={() => deleteReportedPost(item.post_id)}
>
  <Text style={styles.deleteText}>
    Delete Reported Post
  </Text>
</Pressable>
          </View>
          
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
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 20,
  },
  emptyText: { color: "#64748b", fontWeight: "800" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  reason: { color: "#be123c", fontSize: 18, fontWeight: "900" },
  status: { color: "#64748b", fontWeight: "800", marginTop: 4 },
  label: {
    color: "#15803d",
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 4,
  },
  postTitle: { color: "#0f172a", fontWeight: "900", fontSize: 16 },
  postContent: { color: "#475569", marginTop: 4, lineHeight: 20 },
  meta: { color: "#64748b", fontWeight: "700" },
  viewBtn: {
    backgroundColor: "#15803d",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  viewText: { color: "#fff", fontWeight: "900" },
  reviewBtn: {
  backgroundColor: "#f0fdf4",
  borderWidth: 1,
  borderColor: "#bbf7d0",
  borderRadius: 16,
  paddingVertical: 12,
  alignItems: "center",
  marginTop: 10,
},

reviewText: {
  color: "#15803d",
  fontWeight: "900",
},
deleteBtn: {
  backgroundColor: "#fff1f2",
  borderWidth: 1,
  borderColor: "#fecdd3",
  borderRadius: 16,
  paddingVertical: 12,
  alignItems: "center",
  marginTop: 10,
},

deleteText: {
  color: "#be123c",
  fontWeight: "900",
},
});