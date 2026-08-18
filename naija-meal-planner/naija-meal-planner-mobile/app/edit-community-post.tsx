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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../utils/api";
import { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useAppContext } from "../context/AppContext";


export default function EditCommunityPost() {
  const { user, token, city, state, countryCode, region } = useAppContext();
 const { id } = useLocalSearchParams();
const location = [city, state, countryCode || region]
  .filter(Boolean)
  .join(", ");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [saving, setSaving] = useState(false);
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
    allowsEditing: false,
  });

  if (result.canceled) return;

  try {
    setUploadingImage(true);

    const asset = result.assets[0];
    const formData = new FormData();

    formData.append("file", {
      uri: asset.uri,
      name: "community.jpg",
      type: "image/jpeg",
    } as any);

    const response = await fetch(
      "https://naija-meal-planner-api.ramonmufutau16.workers.dev/api/community/upload-image",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Image upload failed.");
    }

    setImageUrl(data.imageUrl);
  } catch (err: any) {
    Alert.alert("Upload Error", err?.message || "Could not upload image.");
  } finally {
    setUploadingImage(false);
  }
};
useEffect(() => {
  const loadPost = async () => {
    try {
      const data = await apiFetch<any>(
        `/api/community/posts/${id}`
      );

      if (!data.ok) return;

      const post = data.post;

      setTitle(post.title || "");
      setContent(post.content || "");
      setImageUrl(post.media_url || "");
    } catch (err) {
      console.log(err);
    }
  };

  if (id) {
    loadPost();
  }
}, [id]);
 const submitPost = async () => {
  if (!title.trim() && !content.trim()) {
    Alert.alert(
      "Missing post",
      "Please enter a title or message."
    );
    return;
  }

  try {
    setSaving(true);

    const data = await apiFetch<any>(
      `/api/community/posts/${id}`,
      {
        method: "PUT",
            token,
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      }
    );

    if (!data.ok) {
      throw new Error(data.error || "Could not update post.");
    }

    Alert.alert("Success", "Post updated.");

    router.replace("/(tabs)/community");
  } catch (err: any) {
    Alert.alert(
      "Error",
      err?.message || "Could not update post."
    );
  } finally {
    setSaving(false);
  }
};

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Edit Post</Text>
      <Text style={styles.subtitle}>
        Share a meal idea, recipe, cooking tip, or wellness experience.
      </Text>

    <View style={styles.card}>
  <Text style={styles.label}>Location</Text>

  <View style={styles.locationBox}>
    <Ionicons name="location-outline" size={18} color="#15803d" />
    <Text style={styles.locationText}>
      {location || "Location will be added from your app settings"}
    </Text>
  </View>

  <Text style={styles.label}>Title</Text>
  <TextInput
    value={title}
    onChangeText={setTitle}
    placeholder="Example: Healthy Egusi Soup"
    placeholderTextColor="#94a3b8"
    style={styles.input}
  />

  <Text style={styles.label}>Message</Text>
  <TextInput
    value={content}
    onChangeText={setContent}
    placeholder="Share your cooking tip, recipe, or experience..."
    placeholderTextColor="#94a3b8"
    style={styles.messageInput}
    multiline
    textAlignVertical="top"
  />
</View>
<Pressable style={styles.imageBtn} onPress={pickImage}>
  <Ionicons name="image-outline" size={20} color="#166534" />
  <Text style={styles.imageBtnText}>
    {uploadingImage
      ? "Uploading..."
      : imageUrl
      ? "Change Image"
      : "Upload Image"}
  </Text>
</Pressable>

{!!imageUrl && (
  <Image source={{ uri: imageUrl }} style={styles.previewImage} />
)}
      <Pressable
        style={[styles.submitBtn, saving && styles.disabledBtn]}
        onPress={submitPost}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send-outline" size={20} color="#fff" />
            <Text style={styles.submitText}>Save Changes</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#eef7f0" },
  content: { padding: 22, paddingTop: 60, paddingBottom: 100 },

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
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
  },

  subtitle: {
    color: "#64748b",
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 22,
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
  },

  label: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 10,
    marginTop: 12,
  },

  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  typeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  typeBtnActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#15803d",
  },

  typeText: {
    color: "#64748b",
    fontWeight: "900",
  },

  typeTextActive: {
    color: "#15803d",
  },

  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#0f172a",
    fontWeight: "800",
  },

  messageInput: {
    minHeight: 160,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#0f172a",
    fontWeight: "700",
    lineHeight: 22,
  },

  dropdownBtn: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#d1fae5",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 15,
  },

  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  dropdownItemText: {
    color: "#0f172a",
    fontWeight: "800",
  },

  submitBtn: {
    backgroundColor: "#0f7a43",
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  imageBtn: {
  backgroundColor: "#dcfce7",
  borderRadius: 18,
  paddingVertical: 14,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: 8,
  marginTop: 16,
},

imageBtnText: {
  color: "#166534",
  fontWeight: "900",
},

previewImage: {
  width: "100%",
  height: 220,
  borderRadius: 18,
  marginTop: 14,
},
locationBox: {
  backgroundColor: "#f0fdf4",
  borderWidth: 1,
  borderColor: "#bbf7d0",
  borderRadius: 18,
  paddingHorizontal: 16,
  paddingVertical: 14,
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginBottom: 10,
},

locationText: {
  color: "#166534",
  fontWeight: "900",
  flex: 1,
},
});