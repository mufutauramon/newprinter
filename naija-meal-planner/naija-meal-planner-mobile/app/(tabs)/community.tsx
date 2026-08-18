import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Share,
  DeviceEventEmitter,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiFetch } from "../../utils/api";
import { useAppContext } from "../../context/AppContext";
import { formatAgeSeconds } from "../../utils/time";
import { VideoView, useVideoPlayer } from "expo-video";

function CommunityMedia({ uri, type }: { uri: string; type?: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
    player.volume = 1;
  });

  if (type === "video") {
    return (
      <VideoView
        player={player}
        style={styles.postMedia}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls
      />
    );
  }

  return <Image source={{ uri }} style={styles.postMedia} />;
}

export default function CommunityScreen() {

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likingId, setLikingId] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [stories, setStories] = useState<any[]>([]);
  const { user, token } = useAppContext();
  const openPost = (id: number) => {
    router.push({
      pathname: "../community-post-detail",
      params: { id: String(id) },
    });
  };

  const sharePost = async (post: any) => {
    try {
      await Share.share({
        message: `${post.title || "Naija Meal Planner"}\n\n${post.content || ""}`,
      });
    } catch (err) {
      console.log("Share error:", err);
    }
  };

  const loadNotificationCount = async () => {
    try {
      if (!user?.id) return;

      const data = await apiFetch<any>(
  `/api/community/notifications`,
  { token }
);

      if (data.ok) {
        const count = Number(data.unreadCount || 0);
        setUnreadCount(count);
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (err) {
      console.log("Notification count error:", err);
    }
  };
const loadStories = async () => {
  try {
    const data = await apiFetch<{ ok: boolean; stories: any[] }>(
      "/api/community/stories"
    );

    if (data.ok) {
      setStories(data.stories || []);
    }
  } catch (err) {
    console.log("Stories load error:", err);
  }
};
  const loadPosts = async () => {
    try {
      const params = new URLSearchParams();

      if (search.trim()) params.append("search", search.trim());
      if (category !== "all") params.append("category", category);

      const query = params.toString() ? `?${params.toString()}` : "";

     const data = await apiFetch<{ ok: boolean; posts: any[] }>(
  `/api/community/posts${query}`,
  { token }
);

      if (data.ok) {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.log("Community load error:", err);
      Alert.alert("Community Error", String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "communityNotificationsRead",
      () => setUnreadCount(0)
    );

    return () => sub.remove();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
loadStories();
loadNotificationCount();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, category]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const deletePost = async (postId: number) => {
    if (!user?.id) return;

    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
         const data = await apiFetch<{ ok: boolean; error?: string }>(
  `/api/community/posts/${postId}`,
  {
    method: "DELETE",
    token,
    body: JSON.stringify({}),
  }
);

          if (!data.ok) {
            Alert.alert("Error", data.error || "Could not delete post.");
            return;
          }

          setPosts((prev) => prev.filter((post) => post.id !== postId));
        },
      },
    ]);
  };

  const submitReport = async (postId: number, reason: string) => {
   const data = await apiFetch<{ ok: boolean; error?: string }>(
  `/api/community/posts/${postId}/report`,
  {
    method: "POST",
    token,
    body: JSON.stringify({
      reason,
      details: "",
    }),
  }
);

    if (!data.ok) {
      Alert.alert("Error", data.error || "Could not report post.");
      return;
    }

    Alert.alert("Report sent", "Thank you. We will review this post.");
  };

  const reportPost = (post: any) => {
    Alert.alert("Report Post", "Why are you reporting this post?", [
      { text: "Spam", onPress: () => submitReport(post.id, "Spam") },
      {
        text: "Inappropriate",
        onPress: () => submitReport(post.id, "Inappropriate"),
      },
      {
        text: "False information",
        onPress: () => submitReport(post.id, "False information"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const managePost = (post: any) => {
    const isOwner = Number(post.user_id) === Number(user?.id);

    if (isOwner) {
      Alert.alert("Manage Post", "", [
        {
          text: "Edit Post",
          onPress: () =>
            router.push({
              pathname: "/edit-community-post",
              params: { id: String(post.id) },
            }),
        },
        {
          text: "Delete Post",
          style: "destructive",
          onPress: () => deletePost(post.id),
        },
        { text: "Cancel", style: "cancel" },
      ]);

      return;
    }

    Alert.alert("Post Options", "", [
      {
        text: "Report Post",
        style: "destructive",
        onPress: () => reportPost(post),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const toggleFollowAuthor = async (authorId: number) => {
    if (!user?.id) return;

    const data = await apiFetch<any>(
  `/api/community/users/${authorId}/follow`,
  {
    method: "POST",
    token,
    body: JSON.stringify({}),
  }
);

    if (!data.ok) return;

    setPosts((prev) =>
      prev.map((p) =>
        Number(p.user_id) === Number(authorId)
          ? { ...p, is_following_author: data.following ? 1 : 0 }
          : p
      )
    );
  };

  const toggleSave = async (postId: number) => {
    if (!user?.id) return;

    const data = await apiFetch<{ ok: boolean; saved: boolean }>(
  `/api/community/posts/${postId}/save`,
  {
    method: "POST",
    token,
    body: JSON.stringify({}),
  }
);

    if (!data.ok) return;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, saved_by_me: data.saved ? 1 : 0 }
          : post
      )
    );
  };
useEffect(() => {
  loadPosts();
  loadStories();
}, []);
  const toggleLike = async (postId: number) => {
    if (!user?.id || likingId === postId) return;

    try {
      setLikingId(postId);

      const data = await apiFetch<{ ok: boolean; liked: boolean }>(
  `/api/community/posts/${postId}/like`,
  {
    method: "POST",
    token,
    body: JSON.stringify({}),
  }
);

      if (!data.ok) return;

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                liked_by_me: data.liked ? 1 : 0,
                likes_count: data.liked
                  ? Number(post.likes_count || 0) + 1
                  : Math.max(Number(post.likes_count || 0) - 1, 0),
              }
            : post
        )
      );
    } finally {
      setLikingId(null);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
  refreshing={refreshing}
  onRefresh={async () => {
    setRefreshing(true);

    await Promise.all([
      loadPosts(),
      loadStories(),
    ]);
  }}
/>
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.push("/create-community-post")}>
            <Ionicons name="add" size={28} color="#0f172a" />
          </Pressable>

          <Text style={styles.headerTitle}>Community</Text>

          <Pressable
            style={styles.bellBtn}
            onPress={() => router.push("/community-notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color="#0f172a" />

            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <Pressable
          style={styles.composer}
          onPress={() => router.push("/create-community-post")}
        >
          <View style={styles.smallAvatar}>
            <Ionicons name="person" size={15} color="#15803d" />
          </View>

          <Text style={styles.composerText}>What are you cooking today?</Text>

          <Ionicons name="image-outline" size={21} color="#15803d" />
        </Pressable>
        <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.storiesRow}
>
  <Pressable
    style={styles.storyItem}
    onPress={() => router.push("/create-community-story")}
  >
    <View style={styles.yourStoryCircle}>
      <Ionicons name="person" size={24} color="#15803d" />

      <View style={styles.storyPlus}>
        <Ionicons name="add" size={14} color="#fff" />
      </View>
    </View>

    <Text style={styles.storyName} numberOfLines={1}>
      Your story
    </Text>
  </Pressable>

  {stories.map((story) => (
    <Pressable
      key={story.id}
      style={styles.storyItem}
      onPress={() =>
        router.push({
          pathname: "/community-story-viewer",
          params: { id: String(story.id) },
        })
      }
    >
      <View style={styles.storyRing}>
        {story.author_avatar_url ? (
          <Image
            source={{ uri: story.author_avatar_url }}
            style={styles.storyAvatar}
          />
        ) : (
          <View style={styles.storyFallback}>
            <Ionicons name="person" size={24} color="#15803d" />
          </View>
        )}
      </View>

      <Text style={styles.storyName} numberOfLines={1}>
        {story.author_name || "User"}
      </Text>
    </Pressable>
  ))}
</ScrollView>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color="#64748b" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search recipes, rice, egusi..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterWrap}
        >
          {[
            { key: "all", label: "All" },
            { key: "following", label: "Following" },
            { key: "video", label: "Videos" },
            { key: "image", label: "Photos" },
          ].map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setCategory(item.key)}
              style={[
                styles.filterChip,
                category === item.key && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  category === item.key && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#15803d" style={{ marginTop: 45 }} />
        ) : (
          posts.map((post) => {
            const isOwner = Number(post.user_id) === Number(user?.id);
            const isFollowing = Number(post.is_following_author) === 1;
            const hasLongText = String(post.content || "").length > 150;

            return (
              <View key={post.id} style={styles.postCard}>
  <View style={styles.postHeader}>
    <Pressable
      style={styles.avatar}
      onPress={() =>
        router.push({
          pathname: "/community-user-profile",
          params: { id: String(post.user_id) },
        })
      }
    >
      {post.author_avatar_url ? (
        <Image source={{ uri: post.author_avatar_url }} style={styles.avatarImage} />
      ) : (
        <Ionicons name="person" size={18} color="#15803d" />
      )}
    </Pressable>

    <View style={{ flex: 1 }}>
      <Text style={styles.author}>{post.author_name}</Text>
      <Text style={styles.meta} numberOfLines={1}>
        {[post.city, post.country].filter(Boolean).join(", ") ||
          post.location ||
          "Community"}{" "}
        • {formatAgeSeconds(post.age_seconds + nowTick * 60) || post.created_at}
      </Text>
    </View>

    {!isOwner && !isFollowing && (
      <Pressable
        onPress={() => toggleFollowAuthor(post.user_id)}
        style={styles.followBtn}
      >
        <Text style={styles.followText}>Follow</Text>
      </Pressable>
    )}

    <Pressable onPress={() => managePost(post)} hitSlop={10}>
      <Ionicons name="ellipsis-horizontal" size={22} color="#64748b" />
    </Pressable>
  </View>

  <View style={styles.captionArea}>
    {!!post.title && (
      <Text style={styles.postTitle} numberOfLines={2}>
        {post.title}
      </Text>
    )}

    {!!post.content && (
      <>
        <Text style={styles.postContent} numberOfLines={3}>
          {post.content}
        </Text>

        {hasLongText && (
          <Pressable onPress={() => openPost(post.id)}>
            <Text style={styles.continueText}>Continue reading</Text>
          </Pressable>
        )}
      </>
    )}
  </View>

  {!!post.media_url && (
    <View style={styles.mediaWrap}>
      <CommunityMedia uri={post.media_url} type={post.media_type} />
    </View>
  )}

  {!post.media_url && (
    <View style={styles.bottomActions}>
      <Pressable style={styles.bottomActionBtn} onPress={() => toggleLike(post.id)}>
        <Ionicons
          name={post.liked_by_me ? "heart" : "heart-outline"}
          size={20}
          color={post.liked_by_me ? "#ef4444" : "#64748b"}
        />
        <Text style={styles.bottomActionText}>{post.likes_count || 0}</Text>
      </Pressable>

      <Pressable style={styles.bottomActionBtn} onPress={() => openPost(post.id)}>
        <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
        <Text style={styles.bottomActionText}>{post.comments_count || 0}</Text>
      </Pressable>

      <View style={{ flex: 1 }} />

      <Pressable onPress={() => toggleSave(post.id)} style={{ marginRight: 18 }}>
        <Ionicons
          name={post.saved_by_me ? "bookmark" : "bookmark-outline"}
          size={20}
          color={post.saved_by_me ? "#15803d" : "#64748b"}
        />
      </Pressable>

      <Pressable onPress={() => sharePost(post)}>
        <Ionicons name="share-social-outline" size={20} color="#64748b" />
      </Pressable>
    </View>
  )}
  <View style={styles.feedActionRow}>
  <Pressable style={styles.feedActionBtn} onPress={() => toggleLike(post.id)}>
    <Ionicons
      name={post.liked_by_me ? "heart" : "heart-outline"}
      size={23}
      color={post.liked_by_me ? "#ef4444" : "#0f172a"}
    />
    <Text style={styles.feedActionText}>{post.likes_count || 0}</Text>
  </Pressable>

  <Pressable style={styles.feedActionBtn} onPress={() => openPost(post.id)}>
    <Ionicons name="chatbubble-outline" size={23} color="#0f172a" />
    <Text style={styles.feedActionText}>{post.comments_count || 0}</Text>
  </Pressable>

  <Pressable style={styles.feedActionBtn} onPress={() => sharePost(post)}>
    <Ionicons name="paper-plane-outline" size={23} color="#0f172a" />
  </Pressable>

  <View style={{ flex: 1 }} />

  <Pressable onPress={() => toggleSave(post.id)}>
    <Ionicons
      name={post.saved_by_me ? "bookmark" : "bookmark-outline"}
      size={24}
      color={post.saved_by_me ? "#15803d" : "#0f172a"}
    />
  </Pressable>
</View>
</View> );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    paddingTop: 54,
    paddingBottom: 145,
  },

  header: {
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.4,
  },

  bellBtn: {
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -7,
    backgroundColor: "#dc2626",
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },

  composer: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  composerText: {
    flex: 1,
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },

  searchBox: {
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "600",
    paddingVertical: 0,
  },

  filterWrap: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: "#f8fafc",
  },

  filterChipActive: {
    backgroundColor: "#15803d",
  },

  filterChipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },

  filterChipTextActive: {
    color: "#fff",
  },

  postCard: {
    backgroundColor: "#fff",
    marginBottom: 14,
  },

  postHeader: {
    paddingHorizontal: 14,
    paddingBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  avatarImage: {
    width: 39,
    height: 39,
    borderRadius: 20,
  },

  author: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: -0.2,
  },

  meta: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },

  followBtn: {
    backgroundColor: "#15803d",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
  },

  followText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },

  mediaWrap: {
    position: "relative",
    backgroundColor: "#f1f5f9",
  },

  postMedia: {
  width: "100%",
  height: 320,
  backgroundColor: "#f1f5f9",
},

floatActions: {
  position: "absolute",
  right: 10,
  bottom: 18,
  alignItems: "flex-end",
  gap: 10,
},
floatPill: {
  minHeight: 40,
  borderRadius: 22,
  backgroundColor: "rgba(15, 23, 42, 0.62)",
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 11,
  paddingVertical: 8,
  gap: 6,
},
floatLabel: {
  color: "#fff",
  fontSize: 11,
  fontWeight: "900",
},
floatCount: {
  color: "#e2e8f0",
  fontSize: 10,
  fontWeight: "900",
},

 captionArea: {
  paddingHorizontal: 14,
  paddingTop: 8,
  paddingBottom: 12,
},

  postTitle: {
  color: "#0f172a",
  fontWeight: "700",
  fontSize: 15,
  marginBottom: 4,
},
  postContent: {
  color: "#475569",
  fontSize: 14,
  lineHeight: 21,
  fontWeight: "400",
},

  continueText: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },

  bottomActions: {
    paddingHorizontal: 14,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  bottomActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },

  bottomActionText: {
    color: "#64748b",
    fontWeight: "900",
    fontSize: 12,
    marginLeft: 5,
  },
  feedActionRow: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 14,
  paddingTop: 10,
  paddingBottom: 6,
},

feedActionBtn: {
  flexDirection: "row",
  alignItems: "center",
  marginRight: 18,
},

feedActionText: {
  color: "#0f172a",
  fontSize: 13,
  fontWeight: "900",
  marginLeft: 5,
},
storiesRow: {
  paddingHorizontal: 12,
  paddingBottom: 14,
  gap: 12,
},

storyItem: {
  width: 72,
  alignItems: "center",
},

storyRing: {
  width: 66,
  height: 66,
  borderRadius: 33,
  borderWidth: 3,
  borderColor: "#ec4899",
  padding: 2,
  alignItems: "center",
  justifyContent: "center",
},

yourStoryCircle: {
  width: 66,
  height: 66,
  borderRadius: 33,
  backgroundColor: "#dcfce7",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
},

storyAvatar: {
  width: 56,
  height: 56,
  borderRadius: 28,
},

storyFallback: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: "#dcfce7",
  alignItems: "center",
  justifyContent: "center",
},

storyPlus: {
  position: "absolute",
  right: 0,
  bottom: 0,
  width: 22,
  height: 22,
  borderRadius: 11,
  backgroundColor: "#15803d",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 2,
  borderColor: "#fff",
},

storyName: {
  marginTop: 5,
  color: "#0f172a",
  fontSize: 11,
  fontWeight: "800",
  maxWidth: 70,
},
});