import { useState } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useAppContext } from "../context/AppContext";

const API_BASE = "http://10.0.2.2:8787";

export default function SignUp() {
const { signIn, city, state, countryCode, region, detectUserLocation } =
  useAppContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          city,
          state,
          country_code: countryCode,
          region,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Unable to create account");
      }

      await signIn(data.token, data.user);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Sign up failed", err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>N</Text>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Your meal planner will use your detected location.
      </Text>

      <View style={styles.locationBox}>
        <Text style={styles.locationLabel}>Detected Location</Text>
        <Text style={styles.locationValue}>
          {city && state ? `${city}, ${state}` : "Location not detected yet"}
        </Text>
      </View>
        <Pressable style={styles.detectBtn} onPress={detectUserLocation}>
        <Text style={styles.detectText}>📍 Detect My Location</Text>
        </Pressable>
      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
      />

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

      <Pressable style={styles.primaryBtn} onPress={handleSignUp}>
        <Text style={styles.primaryText}>Create Account</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/signin")}>
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
      </Pressable>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    marginBottom: 20,
  },
  locationBox: {
    backgroundColor: "#dcfce7",
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  locationLabel: {
    color: "#166534",
    fontWeight: "800",
  },
  locationValue: {
    marginTop: 4,
    color: "#052e16",
    fontWeight: "900",
    fontSize: 16,
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
  detectBtn: {
  backgroundColor: "#0f172a",
  padding: 15,
  borderRadius: 16,
  alignItems: "center",
  marginBottom: 16,
},

detectText: {
  color: "#fff",
  fontWeight: "900",
},
  linkText: {
    marginTop: 18,
    textAlign: "center",
    fontWeight: "800",
    color: "#0f7a43",
  },
});