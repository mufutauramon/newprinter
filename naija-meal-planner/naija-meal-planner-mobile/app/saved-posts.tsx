import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

export default function SavedPosts() {
  const { user, token } = useAppContext();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    try {
      const data = await apiFetch<any>(
  "/api/community/saved-posts",
  { token }
);

      if (data.ok) {
        setPosts(data.posts || []);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Pressable
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={22} />
        <Text>Back</Text>
      </Pressable>

      <Text style={styles.title}>Saved Posts</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        posts.map((post) => (
          <Pressable
  key={post.id}
  style={styles.card}
  onPress={() =>
    router.push({
      pathname: "/community-post-detail",
      params: { id: String(post.id) },
    })
  }
>
  <Text style={styles.postTitle}>{post.title}</Text>
  <Text>{post.content}</Text>
</Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7f0" },
  content: { padding: 20, paddingTop: 60 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  postTitle: {
    fontWeight: "900",
    marginBottom: 8,
  },
});