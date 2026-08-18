import { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { getErrorMessage } from "../utils/errorMessage";
import { apiFetch } from "../utils/api";



export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

 const handleForgotPassword = async () => {
     if (loading) return;
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    Alert.alert("Email required", "Please enter your email address.");
    return;
  }

  try {
    setLoading(true);

    const data = await apiFetch<{
      ok?: boolean;
      message?: string;
      error?: string;
    }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email: cleanEmail,
      }),
    });

    Alert.alert(
      "Check your email",
      data.message ||
        "If that email exists, a reset link has been sent."
    );

    router.replace("/signin");
  } catch (err: any) {
    Alert.alert("Reset failed", getErrorMessage(err));
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we’ll send a reset link.
        </Text>

        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <Pressable
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Send Reset Link</Text>
          )}
        </Pressable>

        <Pressable disabled={loading} onPress={() => router.push("/signin")}>
          <Text style={styles.linkText}>Back to sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "900",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 17,
    borderRadius: 20,
    marginBottom: 18,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "700",
  },
  primaryBtn: {
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.65,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  linkText: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "900",
    color: "#0f7a43",
  },
});