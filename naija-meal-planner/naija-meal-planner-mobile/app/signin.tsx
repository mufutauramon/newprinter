import { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useAppContext } from "../context/AppContext";

const API_BASE = "http://10.0.2.2:8787";

export default function SignIn() {
  const { signIn } = useAppContext();

  const [email, setEmail] = useState("ramon@test.com");
  const [password, setPassword] = useState("password123");

  const handleSignIn = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Unable to sign in");
      }

      await signIn(data.token, data.user);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Sign in failed", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>N</Text>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue meal planning.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryBtn} onPress={handleSignIn}>
        <Text style={styles.primaryText}>Sign In</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/signup")}>
        <Text style={styles.linkText}>Create a new account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8f5",
    padding: 24,
    justifyContent: "center",
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "#0f7a43",
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
    marginTop: 8,
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: "#0f7a43",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  linkText: {
    marginTop: 18,
    textAlign: "center",
    fontWeight: "800",
    color: "#0f7a43",
  },
});