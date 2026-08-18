import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { apiFetch } from "../utils/api";
import { formatAgeSeconds } from "../utils/time";
import { useAppContext } from "../context/AppContext";

function ProfileVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
    player.volume = 1;
  });

  return (
    <VideoView
      player={player}
      style={styles.postImage}
      nativeControls
      allowsFullscreen
    />
  );
}

export default function CommunityUserProfile() {
  const { id } = useLocalSearchParams();
  const userId = Array.isArray(id) ? id[0] : id;
   const { user, token } = useAppContext();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStats, setFollowStats] = useState<any>(null);
const [isFollowing, setIsFollowing] = useState(false);
  

  const loadProfile = async () => {
    try {
      const data = await apiFetch<any>(
 `/api/community/users/${userId}/profile`,
   { token }
);

      if (data.ok) {
        setProfile(data.user);
        setStats(data.stats);
        setFollowStats(data.followStats);
        setIsFollowing(data.isFollowing);
        setPosts(data.posts || []);
      }
    } finally {
      setLoading(false);
    }
  };
 const toggleFollow = async () => {
  const data = await apiFetch<any>(
    `/api/community/users/${userId}/follow`,
    {
      method: "POST",
     token,
body: JSON.stringify({}),
    }
  );

  if (!data.ok) return;

  const following = data.following;

  setIsFollowing(following);

  setFollowStats((prev: any) => ({
    ...prev,
    followers_count: following
      ? Number(prev?.followers_count || 0) + 1
      : Math.max(Number(prev?.followers_count || 0) - 1, 0),
  }));
};
  useEffect(() => {
    if (userId) loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#15803d" size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingBox}>
        <Text>User not found.</Text>
      </View>
    );
  }

  const location =
    [profile.city, profile.country_code || profile.region]
      .filter(Boolean)
      .join(", ") || "Community member";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.profileCard}>
        <View style={styles.bigAvatar}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.bigAvatarImg} />
          ) : (
            <Ionicons name="person" size={50} color="#15803d" />
          )}
        </View>

        <Text style={styles.name}>{profile.name || "Naija User"}</Text>
        <Text style={styles.location}>{location}</Text>
  {Number(user?.id) !== Number(userId) && (
  <Pressable
    style={[
      styles.followBtn,
      isFollowing && styles.followingBtn,
    ]}
    onPress={toggleFollow}
  >
    <Text
      style={[
        styles.followBtnText,
        isFollowing && styles.followingBtnText,
      ]}
    >
      {isFollowing ? "Following" : "Follow"}
    </Text>
  </Pressable>
)}
        <View style={styles.statsRow}>
  <View style={styles.statBox}>
    <Text style={styles.statValue}>
      {stats?.posts_count || 0}
    </Text>
    <Text style={styles.statLabel}>Posts</Text>
  </View>

  <View style={styles.statBox}>
    <Text style={styles.statValue}>
      {followStats?.followers_count || 0}
    </Text>
    <Text style={styles.statLabel}>Followers</Text>
  </View>

  <View style={styles.statBox}>
    <Text style={styles.statValue}>
      {followStats?.following_count || 0}
    </Text>
    <Text style={styles.statLabel}>Following</Text>
  </View>
</View>
      </View>

      <Text style={styles.sectionTitle}>Posts</Text>

      {posts.length === 0 ? (
        <Text style={styles.emptyText}>No posts yet.</Text>
      ) : (
        posts.map((post) => (
          <Pressable
            key={post.id}
            style={styles.postCard}
            onPress={() =>
              router.push({
                pathname: "/community-post-detail",
                params: { id: String(post.id) },
              })
            }
          >
            <Text style={styles.postTime}>
              {formatAgeSeconds(post.age_seconds) || post.created_at}
            </Text>

            {!!post.title && <Text style={styles.postTitle}>{post.title}</Text>}

            {!!post.content && (
              <Text style={styles.postContent}>{post.content}</Text>
            )}

            {!!post.media_url && post.media_type === "image" && (
              <Image source={{ uri: post.media_url }} style={styles.postImage} />
            )}

            {!!post.media_url && post.media_type === "video" && (
              <ProfileVideo uri={post.media_url} />
            )}

            <View style={styles.postStats}>
              <Text style={styles.postStatText}>❤️ {post.likes_count || 0}</Text>
              <Text style={styles.postStatText}>💬 {post.comments_count || 0}</Text>
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

  loadingBox: {
    flex: 1,
    backgroundColor: "#eef7f0",
    justifyContent: "center",
    alignItems: "center",
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backText: {
    color: "#0f172a",
    fontWeight: "900",
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 22,
    alignItems: "center",
    marginBottom: 22,
  },

  bigAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 14,
  },

  bigAvatarImg: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  name: {
    color: "#0f172a",
    fontSize: 26,
    fontWeight: "900",
  },

  location: {
    color: "#15803d",
    fontWeight: "800",
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },

  statBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 26,
    alignItems: "center",
  },

  statValue: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
  },

  statLabel: {
    color: "#64748b",
    fontWeight: "800",
    marginTop: 2,
  },

  sectionTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },

  emptyText: {
    color: "#64748b",
    fontWeight: "800",
  },

  postCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },

  postTime: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
  },

  postTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },

  postContent: {
    color: "#334155",
    lineHeight: 22,
  },

  postImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    marginTop: 14,
    backgroundColor: "#f1f5f9",
  },

  postStats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },

  postStatText: {
    color: "#64748b",
    fontWeight: "900",
  },
  followBtn: {
  backgroundColor: "#15803d",
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 22,
  marginTop: 14,
},

followBtnText: {
  color: "#fff",
  fontWeight: "900",
},

followingBtn: {
  backgroundColor: "#e2e8f0",
},

followingBtnText: {
  color: "#0f172a",
},
});