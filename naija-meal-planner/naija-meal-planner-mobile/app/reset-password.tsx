import { useState } from "react";
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
import { useLocalSearchParams, router } from "expo-router";
import { getErrorMessage } from "../utils/errorMessage";
import { apiFetch } from "../utils/api";

export default function ResetPassword() {
  const { token } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleResetPassword = async () => {
  const resetToken = Array.isArray(token) ? token[0] : token;

  if (!resetToken) {
    Alert.alert("Invalid link", "Reset token is missing. Please request a new reset link.");
    return;
  }

  if (!password || !confirmPassword) {
    Alert.alert("Missing fields", "Please complete all fields.");
    return;
  }

  if (password.length < 6) {
    Alert.alert("Weak password", "Password must be at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Mismatch", "Passwords do not match.");
    return;
  }

  try {
    setLoading(true);

    const data = await apiFetch<{
      ok: boolean;
      error?: string;
    }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: resetToken,
        password,
      }),
    });

    if (!data.ok) {
      throw new Error(data.error || "Could not reset password.");
    }

    Alert.alert(
      "Password reset successful",
      "You can now sign in with your new password.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/signin"),
        },
      ]
    );
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
        <Text style={styles.logo}>🔒</Text>

        <Text style={styles.title}>Reset Password</Text>

        <Text style={styles.subtitle}>Enter your new password below.</Text>

        <Text style={styles.label}>New password</Text>

        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            placeholder="New password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <Pressable onPress={() => setShowPassword((v) => !v)}>
            <Text style={styles.eyeText}>{showPassword ? "🙈" : "👁️"}</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Confirm password</Text>

        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            placeholder="Confirm password"
            placeholderTextColor="#94a3b8"
            editable={!loading}
          />

          <Pressable onPress={() => setShowConfirmPassword((v) => !v)}>
            <Text style={styles.eyeText}>
              {showConfirmPassword ? "🙈" : "👁️"}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Reset Password</Text>
          )}
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
  logo: {
    fontSize: 42,
    marginBottom: 18,
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
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "700",
  },
  eyeText: {
    fontSize: 20,
    marginLeft: 10,
  },
  primaryBtn: {
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 6,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
});