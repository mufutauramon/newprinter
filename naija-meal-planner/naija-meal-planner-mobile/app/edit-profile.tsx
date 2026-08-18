import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";

export default function EditProfile() {
  const { user, token } = useAppContext();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [uploading, setUploading] = useState(false);

const uploadAvatar = async () => {
  if (!user?.id) {
    Alert.alert("Sign in required", "Please sign in before uploading a profile photo.");
    return;
  }

 const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ["images"],
  quality: 0.7,
  allowsEditing: false,
});

  if (result.canceled) return;

  try {
    setUploading(true);

    const asset = result.assets[0];

    const formData = new FormData();

    formData.append("file", {
      uri: asset.uri,
      name: "avatar.jpg",
      type: asset.mimeType || "image/jpeg",
    } as any);

    const res = await fetch(
      "https://naija-meal-planner-api.ramonmufutau16.workers.dev/api/users/avatar",
      {
        method: "POST",
         headers: {
    Authorization: `Bearer ${token}`,
    },
        body: formData,
      }
    );

    const text = await res.text();

    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("Server returned an invalid response.");
    }

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error || "Could not upload avatar.");
    }

    setAvatarUrl(data.avatarUrl);

    Alert.alert("Updated", "Your profile photo has been updated.", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  } catch (err: any) {
    console.log("Avatar upload error:", err);
    Alert.alert("Upload failed", err?.message || "Could not upload photo.");
  } finally {
    setUploading(false);
  }
};
  

  return (
    <View style={styles.screen}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Profile Photo</Text>

      <View style={styles.avatarBox}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person" size={54} color="#15803d" />
        )}
      </View>

      <Pressable
        style={styles.btn}
        onPress={uploadAvatar}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Upload Profile Photo</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
    padding: 22,
    paddingTop: 60,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backText: {
    fontWeight: "900",
    color: "#0f172a",
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 30,
  },
  avatarBox: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 30,
    overflow: "hidden",
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  btn: {
    backgroundColor: "#15803d",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});