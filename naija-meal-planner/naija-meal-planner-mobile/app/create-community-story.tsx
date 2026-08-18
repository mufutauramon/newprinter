import { useState } from "react";
import {
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
import { VideoView, useVideoPlayer } from "expo-video";
import { apiFetch } from "../utils/api";
import { useAppContext } from "../context/AppContext";

export default function CreateCommunityStory() {
  const { user, token, city, state, countryCode, region } = useAppContext();

  const location = [city, state, countryCode || region].filter(Boolean).join(", ");

  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "">("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const player = useVideoPlayer(mediaUrl || "", (player) => {
    player.loop = true;
    player.muted = true;
  });

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
      allowsEditing: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (asset.type === "video" && asset.duration && asset.duration > 60000) {
      Alert.alert("Video too long", "Stories should be 1 minute or less.");
      return;
    }

    try {
      setUploading(true);

      const isVideo = asset.type === "video";
      const formData = new FormData();

      formData.append("file", {
        uri: asset.uri,
        name: isVideo ? "community-story-video.mp4" : "community-story-image.jpg",
        type: isVideo ? "video/mp4" : "image/jpeg",
      } as any);

      const response = await fetch(
  "https://naija-meal-planner-api.ramonmufutau16.workers.dev/api/community/upload-media",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  }
);

      const data = await response.json();

      if (!data.ok) throw new Error(data.error || "Upload failed.");

      setMediaUrl(data.mediaUrl);
      setMediaType(data.mediaType);
    } catch (err: any) {
      Alert.alert("Upload Error", err?.message || "Could not upload story.");
    } finally {
      setUploading(false);
    }
  };

  const submitStory = async () => {
    if (!mediaUrl) {
      Alert.alert("Missing story", "Please add a photo or video first.");
      return;
    }

    try {
      setSaving(true);

      const data = await apiFetch<{ ok: boolean; error?: string }>(
        "/api/community/stories",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            mediaUrl,
            mediaType,
            caption: caption.trim(),
            location,
          }),
        }
      );

      if (!data.ok) {
        throw new Error(data.error || "Could not create story.");
      }

      router.replace("/(tabs)/community");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not create story.");
    } finally {
      setSaving(false);
    }
  };

  const canPost = !!mediaUrl && !saving && !uploading;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>

        <Text style={styles.topTitle}>New Story</Text>

        <Pressable
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={submitStory}
          disabled={!canPost}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postText}>Share</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.previewArea}>
        {mediaUrl ? (
          mediaType === "video" ? (
            <VideoView
              player={player}
              style={styles.previewMedia}
              nativeControls
              allowsFullscreen
            />
          ) : (
            <Image source={{ uri: mediaUrl }} style={styles.previewMedia} />
          )
        ) : (
          <Pressable style={styles.emptyPreview} onPress={pickMedia}>
            <Ionicons name="images-outline" size={42} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Add photo or video</Text>
            <Text style={styles.emptyText}>Stories disappear after 24 hours.</Text>
          </Pressable>
        )}

        {!!mediaUrl && (
          <Pressable style={styles.changeBtn} onPress={pickMedia}>
            <Ionicons name="image-outline" size={18} color="#fff" />
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.bottomBox}>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Add a caption..."
          placeholderTextColor="#94a3b8"
          style={styles.captionInput}
        />

        <Pressable
          style={styles.mediaBtn}
          onPress={pickMedia}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#15803d" />
          ) : (
            <Ionicons name="image-outline" size={22} color="#15803d" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  topTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },

  postBtn: {
    backgroundColor: "#15803d",
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  postBtnDisabled: {
    opacity: 0.45,
  },

  postText: {
    color: "#fff",
    fontWeight: "900",
  },

  previewArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  previewMedia: {
    width: "100%",
    height: "100%",
    backgroundColor: "#020617",
  },

  emptyPreview: {
    width: "86%",
    height: "62%",
    borderRadius: 32,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 14,
  },

  emptyText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },

  changeBtn: {
    position: "absolute",
    right: 18,
    bottom: 104,
    backgroundColor: "rgba(15,23,42,0.65)",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  changeText: {
    color: "#fff",
    fontWeight: "900",
  },

  bottomBox: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: Platform.OS === "ios" ? 28 : 18,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.96)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  captionInput: {
    flex: 1,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
    paddingVertical: 12,
  },

  mediaBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
});