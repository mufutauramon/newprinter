import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { apiFetch } from "../utils/api";

const { width } = Dimensions.get("window");

function StoryVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
    player.volume = 1;
    player.play();
  });

  return <VideoView player={player} style={styles.media} nativeControls={false} />;
}

export default function CommunityStoryViewer() {
  const { id } = useLocalSearchParams();
  const storyId = Array.isArray(id) ? id[0] : id;

  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const progress = useRef(new Animated.Value(0)).current;

  const loadStory = async () => {
    try {
      setLoading(true);

      const data = await apiFetch<any>("/api/community/stories");

      if (data.ok) {
        const found = (data.stories || []).find(
          (item: any) => String(item.id) === String(storyId)
        );

        setStory(found || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStory();
  }, [storyId]);

  useEffect(() => {
    if (!story) return;

    progress.setValue(0);

    const duration = story.media_type === "video" ? 12000 : 7000;

    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) router.back();
    });
  }, [story]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.screen}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.notFound}>Story expired or not found.</Text>
      </View>
    );
  }

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - 28],
  });

  return (
    <View style={styles.screen}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <View style={styles.topBar}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            {story.author_avatar_url ? (
              <Image
                source={{ uri: story.author_avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={18} color="#15803d" />
            )}
          </View>

          <View>
            <Text style={styles.authorName}>{story.author_name || "Naija User"}</Text>
            <Text style={styles.meta}>Story</Text>
          </View>
        </View>

        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>

      {story.media_type === "video" ? (
        <StoryVideo uri={story.media_url} />
      ) : (
        <Image source={{ uri: story.media_url }} style={styles.media} />
      )}

      {!!story.caption && (
        <View style={styles.captionBox}>
          <Text style={styles.caption}>{story.caption}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },

  progressTrack: {
    position: "absolute",
    top: 52,
    left: 14,
    right: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    zIndex: 30,
    overflow: "hidden",
  },

  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#fff",
  },

  topBar: {
    position: "absolute",
    top: 62,
    left: 14,
    right: 14,
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  authorName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  meta: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  media: {
    width: "100%",
    height: "100%",
    backgroundColor: "#020617",
  },

  captionBox: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 44,
    backgroundColor: "rgba(15,23,42,0.58)",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  caption: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },

  notFound: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});