import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { VideoView, useVideoPlayer } from "expo-video";
import { API_BASE, apiFetch } from "../utils/api";
export default function CreateCommunityPost() {
const { user, token, city, state, countryCode, region, isPro } = useAppContext();

  const location = [city, state, countryCode || region].filter(Boolean).join(", ");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | "">("");
  const [saving, setSaving] = useState(false);

  const player = useVideoPlayer(imageUrl || "", (player) => {
    player.loop = true;
    player.muted = true;
  });

  const canPost =
    (!!title.trim() || !!content.trim() || !!imageUrl) &&
    !saving &&
    !uploadingImage;

  const addPrompt = (text: string) => {
    if (content.trim()) {
      setContent((prev) => `${prev.trim()}\n\n${text}: `);
    } else {
      setContent(`${text}: `);
    }
  };

 const pickMedia = async () => {
  if (!token) {
    Alert.alert("Sign in required", "Please sign in before uploading media.");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    quality: 0.7,
    allowsEditing: false,
  });

  if (result.canceled) return;

  const asset = result.assets[0];
  const isVideo = asset.type === "video";
  const durationMs = Number(asset.duration || 0);

 if (isVideo && !isPro) {
    Alert.alert(
      "Pro Feature",
      "Video upload is available for Pro users only. Free users can upload images."
    );
    return;
  }

  if (isVideo && durationMs > 60000) {
    Alert.alert("Video too long", "Please select a video that is 60 seconds or less.");
    return;
  }

  try {
    setUploadingImage(true);

    const formData = new FormData();

    formData.append("file", {
      uri: asset.uri,
      name: isVideo ? "community-video.mp4" : "community-image.jpg",
      type: isVideo ? "video/mp4" : "image/jpeg",
    } as any);

    formData.append("durationMs", String(durationMs));

    const response = await fetch(`${API_BASE}/api/community/upload-media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Upload failed.");
    }

    setImageUrl(data.mediaUrl);
    setMediaType(data.mediaType);
  } catch (err: any) {
    Alert.alert("Upload Error", err?.message || "Could not upload media.");
  } finally {
    setUploadingImage(false);
  }
};

  const removeMedia = () => {
    setImageUrl("");
    setMediaType("");
  };

  const submitPost = async () => {
    if (!title.trim() && !content.trim() && !imageUrl) {
      Alert.alert("Missing post", "Please write something or add a photo/video.");
      return;
    }

    try {
      setSaving(true);

      const data = await apiFetch<{
        ok: boolean;
        postId?: number;
        error?: string;
      }>("/api/community/posts", {
        method: "POST",
         token,
        body: JSON.stringify({
          type: "post",
          title: title.trim(),
          content: content.trim(),
          location,
          mediaUrl: imageUrl,
          mediaType,
          videoUrl: mediaType === "video" ? imageUrl : "",
        }),
      });

      if (!data.ok) {
        throw new Error(data.error || "Could not create post.");
      }

      router.replace("/(tabs)/community");
    } catch (err: any) {
      console.log("Create post error:", err);
      Alert.alert("Error", err?.message || "Could not create post.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topBar}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#0f172a" />
        </Pressable>

        <Text style={styles.topTitle}>Create Post</Text>

        <Pressable
          style={[styles.postTopBtn, !canPost && styles.postTopBtnDisabled]}
          onPress={submitPost}
          disabled={!canPost}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postTopText}>Post</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color="#15803d" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{user?.name || "Naija User"}</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {location || "Location from app settings"}
              </Text>
            </View>

            <View style={styles.publicPill}>
              <Ionicons name="earth-outline" size={13} color="#15803d" />
              <Text style={styles.publicText}>Public</Text>
            </View>
          </View>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give your post a title"
            placeholderTextColor="#94a3b8"
            style={styles.titleInput}
            maxLength={80}
          />

          <TextInput
            value={content}
            onChangeText={(text) => {
              if (text.length <= 1000) setContent(text);
            }}
            placeholder="Share a recipe, cooking tip, market price update, or meal idea..."
            placeholderTextColor="#94a3b8"
            style={styles.messageInput}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.charCount}>{content.length}/1000</Text>

          <View style={styles.promptRow}>
            {["Recipe", "Cooking Tip", "Meal Review", "Market Price"].map((item) => (
              <Pressable
                key={item}
                style={styles.promptChip}
                onPress={() => addPrompt(item)}
              >
                <Text style={styles.promptText}>{item}</Text>
              </Pressable>
            ))}
          </View>

          {!!imageUrl && (
            <View style={styles.previewWrap}>
              {mediaType === "video" ? (
                <VideoView
                  player={player}
                  style={styles.previewMedia}
                  allowsFullscreen
                  allowsPictureInPicture
                  nativeControls
                />
              ) : (
                <Image source={{ uri: imageUrl }} style={styles.previewMedia} />
              )}

              <Pressable style={styles.removeMediaBtn} onPress={removeMedia}>
                <Ionicons name="close" size={18} color="#fff" />
              </Pressable>
            </View>
          )}

          <Pressable
            style={styles.mediaWideBtn}
            onPress={pickMedia}
            disabled={uploadingImage}
          >
            <View style={styles.actionIcon}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#15803d" />
              ) : (
                <Ionicons name="image-outline" size={22} color="#15803d" />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>
                {imageUrl ? "Change photo or video" : "Add photo or video"}
              </Text>
              <Text style={styles.actionSubtitle}>
                <Text style={styles.actionSubtitle}>
  Free users can upload photos. Pro users can upload videos up to 60 seconds.
</Text>
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f8f5",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 104,
    paddingBottom: 40,
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "rgba(243,248,245,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  topTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
  },

  postTopBtn: {
    backgroundColor: "#15803d",
    paddingHorizontal: 18,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    minWidth: 68,
    alignItems: "center",
  },

  postTopBtnDisabled: {
    backgroundColor: "#15803d",
    opacity: 0.5,
  },

  postTopText: {
    color: "#fff",
    fontWeight: "900",
  },

  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
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

  authorName: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
  },

  locationText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  publicPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
  },

  publicText: {
    color: "#15803d",
    fontSize: 11,
    fontWeight: "900",
  },

  titleInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingHorizontal: 14,
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    height: 54,
  },

  messageInput: {
    minHeight: 120,
    backgroundColor: "#f8fafc",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#334155",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
    textAlignVertical: "top",
  },

  charCount: {
    alignSelf: "flex-end",
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },

  promptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },

  promptChip: {
    backgroundColor: "#eef7f0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  promptText: {
    color: "#15803d",
    fontWeight: "800",
    fontSize: 12,
  },

  previewWrap: {
    marginTop: 16,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    position: "relative",
  },

  previewMedia: {
    width: "100%",
    height: 320,
    backgroundColor: "#f1f5f9",
  },

  removeMediaBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  mediaWideBtn: {
    marginTop: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  actionTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },

  actionSubtitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
});