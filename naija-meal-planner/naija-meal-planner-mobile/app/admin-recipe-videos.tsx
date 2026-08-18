import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { apiFetch } from "../utils/api";

const ADMIN_EMAILS = ["amufutau@unilag.edu.ng"];

export default function AdminRecipeVideos() {
  const { user, token } = useAppContext();

  const [mealName, setMealName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(
    String(user?.email || "").toLowerCase()
  );

  const loadVideos = async () => {
    try {
      setLoading(true);

      const data = await apiFetch<{
        ok: boolean;
        videos: any[];
        error?: string;
      }>("/api/admin/recipe-videos", {
        token,
      });

      if (!data.ok) {
        throw new Error(data.error || "Could not load recipe videos.");
      }

      setVideos(data.videos || []);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not load recipe videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && token) loadVideos();
  }, [isAdmin, token]);

  const saveVideo = async () => {
    if (!mealName.trim() || !youtubeUrl.trim()) {
      Alert.alert("Missing information", "Meal name and YouTube URL are required.");
      return;
    }

    try {
      setSaving(true);

      const data = await apiFetch<{ ok: boolean; error?: string }>(
        "/api/admin/recipe-videos",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            mealName: mealName.trim(),
            youtubeUrl: youtubeUrl.trim(),
          }),
        }
      );

      if (!data.ok) {
        throw new Error(data.error || "Could not save recipe video.");
      }

      setMealName("");
      setYoutubeUrl("");
      await loadVideos();

      Alert.alert("Saved", "Recipe video link saved.");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not save recipe video.");
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (item: any) => {
    Alert.alert("Delete Video", `Remove video for ${item.meal_name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const data = await apiFetch<{ ok: boolean; error?: string }>(
            `/api/admin/recipe-videos/${item.id}`,
            {
              method: "DELETE",
              token,
            }
          );

          if (!data.ok) {
            Alert.alert("Error", data.error || "Could not delete video.");
            return;
          }

          setVideos((prev) => prev.filter((v) => v.id !== item.id));
        },
      },
    ]);
  };

  const editVideo = (item: any) => {
    setMealName(item.meal_name || "");
    setYoutubeUrl(item.youtube_url || "");
  };

  if (!isAdmin) {
    return (
      <View style={styles.blockedScreen}>
        <Text style={styles.blockedTitle}>Access Restricted</Text>
        <Text style={styles.blockedText}>
          This page is only available to the app administrator.
        </Text>

        <Pressable style={styles.backHomeBtn} onPress={() => router.back()}>
          <Text style={styles.backHomeText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Recipe Videos</Text>
      <Text style={styles.subtitle}>
        Link meals to your official Naija Meal Planner YouTube videos.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Meal Name</Text>
        <TextInput
          value={mealName}
          onChangeText={setMealName}
          style={styles.input}
          placeholder="Egusi + Pounded Yam"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>YouTube URL</Text>
        <TextInput
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          style={styles.input}
          placeholder="https://www.youtube.com/watch?v=..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
        />

        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={saveVideo}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save Recipe Video</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Saved Videos</Text>

      {loading ? (
        <ActivityIndicator color="#15803d" />
      ) : videos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="logo-youtube" size={34} color="#94a3b8" />
          <Text style={styles.emptyText}>No recipe videos saved yet.</Text>
        </View>
      ) : (
        videos.map((item) => (
          <View key={item.id} style={styles.videoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.videoMeal}>{item.meal_name}</Text>
              <Text style={styles.videoUrl} numberOfLines={1}>
                {item.youtube_url}
              </Text>
            </View>

            <Pressable style={styles.iconBtn} onPress={() => editVideo(item)}>
              <Ionicons name="create-outline" size={20} color="#15803d" />
            </Pressable>

            <Pressable style={styles.iconBtn} onPress={() => deleteVideo(item)}>
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  backText: { color: "#0f172a", fontWeight: "900", fontSize: 16 },
  title: { fontSize: 30, fontWeight: "900", color: "#0f172a" },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 24,
  },
  label: {
    color: "#334155",
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 15,
    color: "#0f172a",
    fontWeight: "700",
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: "#0f7a43",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyText: {
    color: "#64748b",
    fontWeight: "700",
    marginTop: 8,
  },
  videoRow: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  videoMeal: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 15,
  },
  videoUrl: {
    color: "#64748b",
    marginTop: 4,
    fontSize: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  blockedScreen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  blockedTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  blockedText: {
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  backHomeBtn: {
    backgroundColor: "#0f7a43",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  backHomeText: {
    color: "#fff",
    fontWeight: "900",
  },
});