import { useState } from "react";
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

export default function AdminPushUpdate() {
  const { user, token } = useAppContext();

  const [title, setTitle] = useState("Update Available");
  const [message, setMessage] = useState(
    "A new version of Naija Meal Planner is available. Please update now."
  );
  const [sending, setSending] = useState(false);

  const isAdmin = ADMIN_EMAILS.includes(
    String(user?.email || "").toLowerCase()
  );

  const sendPush = async () => {
    if (!token) {
      Alert.alert("Error", "You must be signed in.");
      return;
    }

    if (!title.trim() || !message.trim()) {
      Alert.alert("Missing information", "Title and message are required.");
      return;
    }

    try {
      setSending(true);

      const data = await apiFetch<{
        ok: boolean;
        sent?: number;
        totalTokens?: number;
        error?: string;
      }>("/api/admin/send-update-push", {
        method: "POST",
        token,
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
        }),
      });

      if (!data.ok) {
        throw new Error(data.error || "Could not send push notification.");
      }

      Alert.alert(
        "Push Sent",
        `Sent to ${data.sent || 0} of ${data.totalTokens || 0} devices.`
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not send update push.");
    } finally {
      setSending(false);
    }
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

      <Text style={styles.title}>Push Update Alert</Text>

      <Text style={styles.subtitle}>
        Send a push notification to users when a new app update is available.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Notification Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholder="Update Available"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          style={[styles.input, styles.textArea]}
          placeholder="Write update message..."
          placeholderTextColor="#94a3b8"
          multiline
        />

        <Pressable
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
          onPress={sendPush}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              <Text style={styles.sendText}>Send Update Push</Text>
            </>
          )}
        </Pressable>
      </View>
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
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  sendBtn: {
    marginTop: 20,
    backgroundColor: "#0f7a43",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
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