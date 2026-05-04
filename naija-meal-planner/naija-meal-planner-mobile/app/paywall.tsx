import { View, Text, StyleSheet, Pressable } from "react-native";
import { useAppContext } from "../context/AppContext";
import { router } from "expo-router";
export default function Paywall() {
  const { isPro, setIsPro } = useAppContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upgrade to Pro 🚀</Text>
<Pressable style={styles.backBtn} onPress={() => router.back()}>
  <Text style={styles.backText}>← Back</Text>
</Pressable>
      <Text style={styles.subtitle}>
        Unlock AI meal plans, recipes, and smart grocery features
      </Text>
      <View style={styles.card}>
        <Text style={styles.feature}>🤖 AI Meal Generator</Text>
        <Text style={styles.feature}>🍲 Recipe & Cooking Guide</Text>
        <Text style={styles.feature}>🧾 Smart Grocery Optimization</Text>
        <Text style={styles.feature}>📊 Budget Insights</Text>
      </View>

      {!isPro && (
        <Pressable
  style={styles.btn}
  onPress={() => {
    setIsPro(true);
    alert("Pro unlocked (test mode)");
  }}
>
  <Text style={styles.btnText}>Upgrade Now</Text>
</Pressable>
      )}

      {isPro && (
        <Text style={styles.proText}>You are a Pro user 🎉</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f4f8f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
  },
  feature: {
    fontSize: 15,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#7c3aed",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  backBtn: {
  position: "absolute",
  top: 55,
  left: 24,
  paddingVertical: 8,
  paddingHorizontal: 12,
},

backText: {
  color: "#0f172a",
  fontWeight: "900",
  fontSize: 16,
},
  btnText: {
    color: "#fff",
    fontWeight: "900",
  },
  proText: {
    textAlign: "center",
    fontWeight: "900",
    color: "#0f7a43",
  },
});