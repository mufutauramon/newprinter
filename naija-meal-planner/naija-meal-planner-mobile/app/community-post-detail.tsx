import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";
import { formatAgeSeconds } from "../utils/time";

function CommunityDetailVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
    player.volume = 1;
  });

  return (
    <VideoView
      player={player}
      style={styles.postMedia}
      nativeControls
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

export default function CommunityPostDetail() {
  const { id } = useLocalSearchParams();
 const { user, token, city, countryCode, region } = useAppContext();
const [nowTick, setNowTick] = useState(0);
  const postId = Array.isArray(id) ? id[0] : id;
  const country = countryCode || region || "";
  const location = [city, country].filter(Boolean).join(", ");

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const postData = await apiFetch<any>(`/api/community/posts/${postId}`);
      const commentsData = await apiFetch<any>(
        `/api/community/posts/${postId}/comments`
      );

      if (postData.ok) setPost(postData.post);
      if (commentsData.ok) setComments(commentsData.comments || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) loadData();
  }, [postId]);
useEffect(() => {
  const timer = setInterval(() => {
    setNowTick((prev) => prev + 1);
  }, 60000);

  return () => clearInterval(timer);
}, []);
  const submitComment = async () => {
    if (!comment.trim() || sending) return;

    try {
      setSending(true);

      const data = await apiFetch<any>(
        `/api/community/posts/${postId}/comments`,
        {
          method: "POST",
          body: JSON.stringify({
            comment: comment.trim(),
            location,
            city,
            country,
              parentCommentId: replyingTo?.id || null,
          }),
        }
      );

      if (!data.ok) throw new Error(data.error || "Could not add comment.");

      setComment("");
      setReplyingTo(null);
      await loadData();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not add comment.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#15803d" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingBox}>
        <Text style={styles.notFound}>Post not found.</Text>
      </View>
    );
  }

  const postLocation =
    [post.city, post.country].filter(Boolean).join(", ") ||
    post.location ||
    "Community";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </Pressable>

        <Text style={styles.topTitle}>Post</Text>

        <View style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#64748b" />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            {post.author_avatar_url ? (
              <Image
                source={{ uri: post.author_avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={18} color="#15803d" />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.author}>{post.author_name}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {postLocation} • {formatAgeSeconds(Number(post.age_seconds || 0) + nowTick * 60) ||
  post.created_at}
            </Text>
          </View>
        </View>

        {!!post.title && <Text style={styles.title}>{post.title}</Text>}

        {!!post.content && <Text style={styles.contentText}>{post.content}</Text>}

        {!!post.media_url && (
          <View style={styles.mediaWrap}>
            {post.media_type === "video" ? (
              <CommunityDetailVideo uri={post.media_url} />
            ) : (
              <Image source={{ uri: post.media_url }} style={styles.postMedia} />
            )}
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Ionicons name="heart-outline" size={18} color="#ef4444" />
            <Text style={styles.statText}>{post.likes_count || 0} likes</Text>
          </View>
{replyingTo && (
  <View style={styles.replyPreview}>
    <Text style={styles.replyPreviewText}>
      Replying to {replyingTo.author_name}
    </Text>

    <Pressable onPress={() => setReplyingTo(null)}>
      <Ionicons name="close" size={18} color="#64748b" />
    </Pressable>
  </View>
)}
          <View style={styles.statPill}>
            <Ionicons name="chatbubble-outline" size={18} color="#15803d" />
            <Text style={styles.statText}>{comments.length} comments</Text>
          </View>
        </View>

        <View style={styles.commentsHeader}>
          <Text style={styles.sectionTitle}>Comments</Text>
          <Text style={styles.sectionCount}>{comments.length}</Text>
        </View>

        {comments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={30} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No comments yet</Text>
            <Text style={styles.emptyText}>Start the conversation.</Text>
          </View>
        ) : (
          comments.map((item) => {
            const commentLocation =
              [item.city, item.country].filter(Boolean).join(", ") ||
              item.location ||
              "";

            return (
              <View key={item.id} style={styles.commentItem}>
                <View style={styles.commentAvatarWrap}>
                  {item.author_avatar_url ? (
                    <Image
                      source={{ uri: item.author_avatar_url }}
                      style={styles.commentAvatar}
                    />
                  ) : (
                    <Ionicons name="person" size={15} color="#15803d" />
                  )}
                </View>

                <View style={styles.commentBubble}>
                  <View style={styles.commentTop}>
                    <Text style={styles.commentAuthor}>{item.author_name}</Text>
                    <Text style={styles.commentTime}>
                     {formatAgeSeconds(Number(item.age_seconds || 0) + nowTick * 60) ||
  item.created_at}
                    </Text>
                  </View>

                  {!!commentLocation && (
                    <Text style={styles.commentMeta} numberOfLines={1}>
                      {commentLocation}
                    </Text>
                  )}

                  <Text style={styles.commentText}>{item.comment}</Text>
                </View>
                <Pressable
  style={styles.replyBtn}
  onPress={() => {
    setReplyingTo(item);
    setComment("");
  }}
>
  <Text style={styles.replyText}>Reply</Text>
</Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.commentComposerWrap}>
        <View style={styles.commentComposer}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Write a thoughtful comment..."
            placeholderTextColor="#94a3b8"
            style={styles.commentInput}
            multiline
          />

          <Pressable
            style={[
              styles.sendCircle,
              (!comment.trim() || sending) && styles.sendCircleDisabled,
            ]}
            onPress={submitComment}
            disabled={!comment.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 96,
    paddingBottom: 130,
  },

  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  notFound: {
    color: "#64748b",
    fontWeight: "800",
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: 54,
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
replyBtn: {
  marginTop: 7,
  alignSelf: "flex-start",
},

replyText: {
  color: "#15803d",
  fontSize: 12,
  fontWeight: "900",
},

replyPreview: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#f0fdf4",
  paddingHorizontal: 14,
  paddingVertical: 9,
  borderRadius: 16,
  marginBottom: 8,
},

replyPreviewText: {
  color: "#15803d",
  fontSize: 12,
  fontWeight: "900",
},
  topTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.3,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  author: {
    fontWeight: "900",
    color: "#0f172a",
    fontSize: 15,
    letterSpacing: -0.2,
  },

  meta: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  title: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.6,
    marginBottom: 10,
  },

  contentText: {
    color: "#334155",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
    marginBottom: 16,
  },

  mediaWrap: {
    marginHorizontal: -16,
    backgroundColor: "#f1f5f9",
    marginBottom: 14,
  },

  postMedia: {
    width: "100%",
    height: 410,
    backgroundColor: "#f1f5f9",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },

  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    gap: 6,
  },

  statText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
  },

  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    color: "#0f172a",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sectionCount: {
    marginLeft: 8,
    backgroundColor: "#dcfce7",
    color: "#15803d",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: "900",
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    backgroundColor: "#f8fafc",
    borderRadius: 24,
  },

  emptyTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
  },

  emptyText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },

  commentItem: {
    flexDirection: "row",
    marginBottom: 14,
  },

  commentAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
    marginTop: 2,
  },

  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  commentBubble: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  commentTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  commentAuthor: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
  },

  commentTime: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 8,
  },

  commentMeta: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
    marginBottom: 5,
  },

  commentText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  commentComposerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },

  commentComposer: {
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 16,
    paddingRight: 7,
    paddingVertical: 7,
  },

  commentInput: {
    flex: 1,
    maxHeight: 110,
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
  },

  sendCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#15803d",
    alignItems: "center",
    justifyContent: "center",
  },

  sendCircleDisabled: {
    backgroundColor: "#94a3b8",
  },
});