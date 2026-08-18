import { useState } from "react";
import { router } from "expo-router";
import { getErrorMessage } from "../utils/errorMessage";
import * as AppleAuthentication from "expo-apple-authentication";
import Purchases from "react-native-purchases";
import { initPurchases, checkIsPro } from "../lib/purchases";
import { registerPushToken } from "../utils/pushToken";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { apiFetch } from "../utils/api";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAppContext } from "../context/AppContext";


export default function SignUp() {
 const { signIn, region } = useAppContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const regionLabel =
  region === "ng"
    ? "🇳🇬 Nigeria"
    : region === "ca"
    ? "🇨🇦 Canada"
    : region === "uk"
    ? "🇬🇧 United Kingdom"
    : region === "au"
    ? "🇦🇺 Australia"
    : region === "us"
    ? "🇺🇸 United States"
    : "🌍 Auto detect";

 const handleSignUp = async () => {
  const cleanName = name.trim();
   if (loading) return;
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || !cleanEmail || !password) {
    Alert.alert("Missing information", "Please enter name, email and password.");
    return;
  }

  if (password.length < 6) {
    Alert.alert("Weak password", "Password must be at least 6 characters.");
    return;
  }

  try {
    setLoading(true);

    const data = await apiFetch<{
      ok: boolean;
      message?: string;
      error?: string;
    }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        password,
        city: "",
        state: "",
        country_code: "",
        region,
      }),
    });

    if (!data.ok) {
      throw new Error(data.error || "Unable to create account.");
    }

    Alert.alert(
      "Check your email",
      data.message || "Account created. Please verify your email before signing in.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/signin"),
        },
      ]
    );
  } catch (err: any) {
    Alert.alert("Sign up failed", getErrorMessage(err));
  } finally {
    setLoading(false);
  }
};
const handleAppleSignIn = async () => {
  try {
    setLoading(true);

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const fullName = [
      credential.fullName?.givenName,
      credential.fullName?.familyName,
    ]
      .filter(Boolean)
      .join(" ");

    const data = await apiFetch<{
      ok: boolean;
      token: string;
      user: any;
      error?: string;
    }>("/api/auth/apple", {
      method: "POST",
      body: JSON.stringify({
        appleId: credential.user,
        email: credential.email || "",
        name: fullName || "Naija User",
      }),
    });

    if (!data.ok || !data.token || !data.user) {
      throw new Error(data.error || "Apple sign in failed.");
    }

    await signIn(data.token, data.user);
 await registerPushToken(data.token);
    router.replace(
      Number(data.user.onboarding_completed || 0) === 1
        ? "/(tabs)"
        : "/onboarding"
    );
  } catch (err: any) {
    if (err?.code !== "ERR_REQUEST_CANCELED") {
      Alert.alert("Apple sign in failed", getErrorMessage(err));
    }
  } finally {
    setLoading(false);
  }
};
const handleGoogleSignIn = async () => {
  try {
    setLoading(true);

    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const result = await GoogleSignin.signIn();
    const userInfo: any = result.data || result;
    const googleUser = userInfo.user;

    if (!googleUser?.id || !googleUser?.email) {
      throw new Error("Google account information was not returned.");
    }

    const data = await apiFetch<{
      ok: boolean;
      token: string;
      user: any;
      error?: string;
    }>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name || "Naija User",
      }),
    });

    if (!data.ok || !data.token || !data.user) {
      throw new Error(data.error || "Google sign up failed.");
    }

    await signIn(data.token, data.user);
     await registerPushToken(data.token);
    try {
      await initPurchases();

      if (data.user?.email) {
       await Purchases.logIn(`user_${data.user.id}`);
      }

      await checkIsPro();
    } catch (err) {
      console.log("RevenueCat login after Google signup failed:", err);
    }

    router.replace(
      (Number(data.user.onboarding_completed || 0) === 1
        ? "/(tabs)"
        : "/onboarding") as any
    );
  } catch (err: any) {
    if (err?.code === statusCodes.SIGN_IN_CANCELLED) return;

    Alert.alert("Google sign up failed", getErrorMessage(err));
  } finally {
    setLoading(false);
  }
};
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
        
          <Text style={styles.kicker}>Start meal planning</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Build smart Nigerian meal plans based on your family size, region, and budget.
          </Text>
        </View>
{Platform.OS === "ios" && (
  <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    cornerRadius={18}
    style={styles.appleBtn}
    onPress={handleAppleSignIn}
  />
)}

<Pressable
  style={styles.googleBtn}
  onPress={handleGoogleSignIn}
  disabled={loading}
>
  <Text style={styles.googleText}>Continue with Google</Text>
</Pressable>

<View style={styles.dividerRow}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>or create with email</Text>
  <View style={styles.dividerLine} />
</View>
        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
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

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
  <TextInput
    style={styles.passwordInput}
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}
    placeholder="Password"
    placeholderTextColor="#94a3b8"
  />

  <Pressable onPress={() => setShowPassword(!showPassword)}>
    <Text style={styles.eyeText}>
      {showPassword ? "🙈" : "👁️"}
    </Text>
  </Pressable>
</View><Pressable
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Create Account</Text>
            )}
          </Pressable>

          <Pressable disabled={loading} onPress={() => router.push("/signin")}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkStrong}>Sign in</Text>
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Your region helps us suggest better meals and grocery prices.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef7f0",
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 34,
    paddingBottom: 34,
    justifyContent: "center",
  },
  hero: {
    marginBottom: 24,
  },
  kicker: {
    color: "#15803d",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  appleBtn: {
  width: "100%",
  height: 52,
  marginBottom: 14,
},

googleBtn: {
  width: "100%",
  height: 52,
  borderRadius: 18,
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#e2e8f0",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 18,
},

googleText: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 15,
},

dividerRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  marginBottom: 18,
},

dividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: "#e2e8f0",
},

dividerText: {
  color: "#94a3b8",
  fontWeight: "800",
  fontSize: 12,
},
  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1.2,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
    maxWidth: 370,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 22,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
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
    marginBottom: 16,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "700",
  },
  locationCard: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 22,
    padding: 17,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationLabel: {
    color: "#64748b",
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 5,
  },
  locationValue: {
    color: "#166534",
    fontWeight: "900",
    fontSize: 16,
  },
  locationAction: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  locationActionText: {
    fontSize: 20,
  },
  primaryBtn: {
    backgroundColor: "#0f7a43",
    padding: 18,
    borderRadius: 22,
    alignItems: "center",
    marginTop: 2,
    shadowColor: "#0f7a43",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
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
    fontWeight: "800",
    color: "#64748b",
  },
  linkStrong: {
    color: "#0f7a43",
    fontWeight: "900",
  },
  footerText: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 24,
    fontWeight: "700",
    lineHeight: 20,
  },
  passwordWrap: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#f6faf8",
  borderWidth: 1,
  borderColor: "#e4eee8",
  borderRadius: 20,
  paddingHorizontal: 16,
  marginTop: 12,
},

passwordInput: {
  flex: 1,
  paddingVertical: 16,
  fontSize: 17,
  color: "#0f172a",
  fontWeight: "700",
},

eyeText: {
  fontSize: 20,
  marginLeft: 10,
},
});