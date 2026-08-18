import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { apiFetch } from "../utils/api";
import { getErrorMessage } from "../utils/errorMessage";

export default function FeedbackScreen() {
  const { user, token } = useAppContext();
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const submitFeedback = async () => {
    try {
      if (!message.trim()) {
        Alert.alert("Feedback required", "Please write your feedback before submitting.");
        return;
      }

      setSubmitting(true);

      const data = await apiFetch<{
        ok: boolean;
        error?: string;
        message?: string;
      }>("/api/feedback", {
        method: "POST",
        token,
        body: JSON.stringify({
          rating,
          message: message.trim(),
        }),
      });

      if (!data.ok) {
        throw new Error(data.error || "Unable to submit feedback.");
      }

      Alert.alert(
        "Thank you!",
        "Your feedback has been submitted.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Feedback failed", getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#0f172a" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Send Feedback</Text>

      <Text style={styles.subtitle}>
        Tell us what you like, what is confusing, or what you want improved.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>How would you rate the app?</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={36}
                color="#f59e0b"
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.ratingText}>{rating}/5</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Your feedback</Text>

        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Example: I like the meal plans, but I want more Yoruba breakfast options..."
          placeholderTextColor="#94a3b8"
          multiline
          textAlignVertical="top"
        />
      </View>

      <Pressable
        style={[styles.submitBtn, submitting && styles.disabledBtn]}
        onPress={submitFeedback}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Feedback</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },

  content: {
    padding: 22,
    paddingTop: 60,
    paddingBottom: 80,
  },

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
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900",
  },

  subtitle: {
    color: "#64748b",
    marginTop: 10,
    lineHeight: 22,
    marginBottom: 22,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
  },

  label: {
    color: "#0f172a",
    fontWeight: "900",
    fontSize: 17,
    marginBottom: 14,
  },

  stars: {
    flexDirection: "row",
    gap: 10,
  },

  ratingText: {
    color: "#64748b",
    marginTop: 10,
    fontWeight: "800",
  },

  input: {
    minHeight: 150,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 16,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },

  submitBtn: {
    backgroundColor: "#0f7a43",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
  },

  disabledBtn: {
    opacity: 0.6,
  },

  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});